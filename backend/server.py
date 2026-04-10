from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Depends - SCA Scanner API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionData(BaseModel):
    session_id: str

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str = Field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    repo_url: str
    description: Optional[str] = ""
    scan_types: List[str] = ["dependencies"]  # dependencies, containers, iac
    webhook_secret: str = Field(default_factory=lambda: uuid.uuid4().hex)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_scan_at: Optional[datetime] = None
    status: str = "active"

class ProjectCreate(BaseModel):
    name: str
    repo_url: str
    description: Optional[str] = ""
    scan_types: List[str] = ["dependencies"]

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scan_types: Optional[List[str]] = None

class Vulnerability(BaseModel):
    vuln_id: str
    package_name: str
    installed_version: str
    fixed_version: Optional[str] = None
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN
    title: str
    description: Optional[str] = None
    references: List[str] = []
    cvss_score: Optional[float] = None
    target: str  # file path or image name
    target_type: str  # dependency, container, iac

class ScanResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scan_id: str = Field(default_factory=lambda: f"scan_{uuid.uuid4().hex[:12]}")
    project_id: str
    user_id: str
    status: str = "pending"  # pending, running, completed, failed
    scan_type: str  # dependencies, containers, iac, all
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    vulnerabilities: List[Dict[str, Any]] = []
    summary: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
    trivy_output: Optional[str] = None
    commit_sha: Optional[str] = None
    branch: Optional[str] = None
    triggered_by: str = "manual"  # manual, webhook, scheduled

class WebhookPayload(BaseModel):
    project_id: str
    webhook_secret: str
    scan_type: str = "all"
    commit_sha: Optional[str] = None
    branch: Optional[str] = None
    trivy_results: Optional[Dict[str, Any]] = None
    status: str = "completed"

class GitHubActionConfig(BaseModel):
    project_id: str
    scan_types: List[str] = ["dependencies", "containers", "iac"]
    fail_on_severity: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW
    schedule: Optional[str] = None  # cron expression

# ============== AUTH HELPERS ==============

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    # Try cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Find user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Convert datetime if needed
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return User(**user_doc)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/session")
async def exchange_session(data: SessionData, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    try:
        async with httpx.AsyncClient() as client_http:
            resp = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": data.session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            auth_data = resp.json()
    except httpx.RequestError as e:
        logger.error(f"Auth request failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if changed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"success": True, "user": user_doc}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"success": True}

# ============== PROJECT ROUTES ==============

@api_router.post("/projects", response_model=dict)
async def create_project(project: ProjectCreate, user: User = Depends(get_current_user)):
    """Create a new project"""
    project_obj = Project(
        user_id=user.user_id,
        name=project.name,
        repo_url=project.repo_url,
        description=project.description,
        scan_types=project.scan_types
    )
    
    doc = project_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.projects.insert_one(doc)
    
    # Return without _id
    if "_id" in doc:
        del doc["_id"]
    return doc

@api_router.get("/projects")
async def list_projects(user: User = Depends(get_current_user)):
    """List all projects for current user"""
    projects = await db.projects.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"projects": projects}

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    """Get a specific project"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@api_router.put("/projects/{project_id}")
async def update_project(
    project_id: str, 
    update: ProjectUpdate, 
    user: User = Depends(get_current_user)
):
    """Update a project"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        await db.projects.update_one(
            {"project_id": project_id},
            {"$set": update_data}
        )
    
    updated = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return updated

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    """Delete a project and its scans"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.delete_one({"project_id": project_id})
    await db.scans.delete_many({"project_id": project_id})
    
    return {"success": True}

# ============== SCAN ROUTES ==============

@api_router.post("/scans/trigger/{project_id}")
async def trigger_scan(project_id: str, user: User = Depends(get_current_user)):
    """Manually trigger a scan (creates pending scan record)"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scan = ScanResult(
        project_id=project_id,
        user_id=user.user_id,
        scan_type="all",
        triggered_by="manual"
    )
    
    doc = scan.model_dump()
    doc["started_at"] = doc["started_at"].isoformat()
    
    await db.scans.insert_one(doc)
    if "_id" in doc:
        del doc["_id"]
    
    return doc

@api_router.get("/scans/project/{project_id}")
async def get_project_scans(
    project_id: str, 
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    """Get scan history for a project"""
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scans = await db.scans.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(limit)
    
    return {"scans": scans}

@api_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str, user: User = Depends(get_current_user)):
    """Get a specific scan with vulnerabilities"""
    scan = await db.scans.find_one(
        {"scan_id": scan_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scan

@api_router.get("/scans")
async def list_all_scans(
    limit: int = 50,
    user: User = Depends(get_current_user)
):
    """List all scans for current user"""
    scans = await db.scans.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(limit)
    
    return {"scans": scans}

# ============== WEBHOOK ROUTES ==============

@api_router.get("/webhook/test")
async def webhook_test():
    """Test endpoint to verify webhook connectivity"""
    return {"status": "ok", "message": "webhook endpoint is working"}

@api_router.post("/webhook/scan")
async def receive_scan_webhook(payload: WebhookPayload, request: Request):
    """Receive scan results from GitHub Action"""
    # Log incoming webhook request
    logger.info(f"=== WEBHOOK RECEIVED ===")
    logger.info(f"Project ID: {payload.project_id}")
    logger.info(f"Branch: {payload.branch}")
    logger.info(f"Commit: {payload.commit_sha}")
    logger.info(f"Scan Type: {payload.scan_type}")
    logger.info(f"Status: {payload.status}")
    
    # Find project
    project = await db.projects.find_one(
        {"project_id": payload.project_id},
        {"_id": 0}
    )
    
    if not project:
        logger.error(f"Project not found: {payload.project_id}")
        raise HTTPException(status_code=404, detail=f"Project not found: {payload.project_id}")
    
    logger.info(f"Project found: {project.get('name')}")
    
    # Validate webhook secret
    if project["webhook_secret"] != payload.webhook_secret:
        logger.error(f"Invalid webhook secret for project: {payload.project_id}")
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    
    logger.info("Webhook secret validated")
    
    # Process Trivy results
    vulnerabilities = []
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
    
    if payload.trivy_results:
        results = payload.trivy_results.get("Results", [])
        logger.info(f"Processing {len(results)} result targets")
        
        for result in results:
            target = result.get("Target", "unknown")
            target_type = result.get("Type", "dependency")
            
            vulns_in_target = result.get("Vulnerabilities", [])
            logger.info(f"Target '{target}': {len(vulns_in_target)} vulnerabilities")
            
            for vuln in vulns_in_target:
                severity = vuln.get("Severity", "UNKNOWN").lower()
                if severity in summary:
                    summary[severity] += 1
                
                vulnerabilities.append({
                    "vuln_id": vuln.get("VulnerabilityID", ""),
                    "package_name": vuln.get("PkgName", ""),
                    "installed_version": vuln.get("InstalledVersion", ""),
                    "fixed_version": vuln.get("FixedVersion"),
                    "severity": vuln.get("Severity", "UNKNOWN"),
                    "title": vuln.get("Title", ""),
                    "description": vuln.get("Description"),
                    "references": vuln.get("References", []),
                    "cvss_score": vuln.get("CVSS", {}).get("nvd", {}).get("V3Score"),
                    "target": target,
                    "target_type": target_type
                })
            
            # Process misconfigs for IaC
            misconfigs = result.get("Misconfigurations", [])
            for misconfig in misconfigs:
                severity = misconfig.get("Severity", "UNKNOWN").lower()
                if severity in summary:
                    summary[severity] += 1
                
                vulnerabilities.append({
                    "vuln_id": misconfig.get("ID", ""),
                    "package_name": misconfig.get("Type", "IaC"),
                    "installed_version": "N/A",
                    "fixed_version": None,
                    "severity": misconfig.get("Severity", "UNKNOWN"),
                    "title": misconfig.get("Title", ""),
                    "description": misconfig.get("Description"),
                    "references": misconfig.get("References", []),
                    "cvss_score": None,
                    "target": target,
                    "target_type": "iac"
                })
    
    logger.info(f"Vulnerability summary: {summary}")
    logger.info(f"Total vulnerabilities: {len(vulnerabilities)}")
    
    # Create scan record
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    scan_doc = {
        "scan_id": scan_id,
        "project_id": payload.project_id,
        "user_id": project["user_id"],
        "status": payload.status,
        "scan_type": payload.scan_type,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "vulnerabilities": vulnerabilities,
        "summary": summary,
        "commit_sha": payload.commit_sha,
        "branch": payload.branch,
        "triggered_by": "webhook"
    }
    
    await db.scans.insert_one(scan_doc)
    logger.info(f"Scan saved with ID: {scan_id}")
    
    # Update project last_scan_at
    await db.projects.update_one(
        {"project_id": payload.project_id},
        {"$set": {"last_scan_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info(f"=== WEBHOOK COMPLETE ===")
    return {
        "success": True, 
        "scan_id": scan_id,
        "vulnerabilities_count": len(vulnerabilities),
        "summary": summary
    }


@api_router.post("/webhook/test-scan/{project_id}")
async def send_test_scan(project_id: str, user: User = Depends(get_current_user)):
    """Send a test scan to verify the webhook pipeline works"""
    # Verify project exists and user owns it
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create a sample payload with test vulnerabilities
    test_payload = WebhookPayload(
        project_id=project_id,
        webhook_secret=project["webhook_secret"],
        scan_type="all",
        commit_sha=f"test_{uuid.uuid4().hex[:7]}",
        branch="test-branch",
        status="completed",
        trivy_results={
            "Results": [
                {
                    "Target": "requirements.txt",
                    "Type": "pip",
                    "Vulnerabilities": [
                        {
                            "VulnerabilityID": "CVE-2020-14343",
                            "PkgName": "PyYAML",
                            "InstalledVersion": "5.3.1",
                            "FixedVersion": "5.4",
                            "Severity": "CRITICAL",
                            "Title": "PyYAML: incomplete fix for CVE-2020-1747",
                            "Description": "A vulnerability in the PyYAML library allows arbitrary code execution.",
                            "References": ["https://nvd.nist.gov/vuln/detail/CVE-2020-14343"]
                        },
                        {
                            "VulnerabilityID": "CVE-2021-3737",
                            "PkgName": "urllib3",
                            "InstalledVersion": "1.25.9",
                            "FixedVersion": "1.26.5",
                            "Severity": "HIGH",
                            "Title": "urllib3: HTTPS proxy bypass vulnerability",
                            "Description": "A flaw in urllib3 may cause the proxy to be bypassed."
                        },
                        {
                            "VulnerabilityID": "CVE-2022-42969",
                            "PkgName": "py",
                            "InstalledVersion": "1.10.0",
                            "FixedVersion": "1.11.0",
                            "Severity": "MEDIUM",
                            "Title": "py: ReDoS vulnerability in svn_info function"
                        },
                        {
                            "VulnerabilityID": "CVE-2019-11324",
                            "PkgName": "urllib3",
                            "InstalledVersion": "1.25.9",
                            "FixedVersion": "1.24.2",
                            "Severity": "LOW",
                            "Title": "urllib3: certification verification bypass"
                        }
                    ]
                },
                {
                    "Target": "package-lock.json",
                    "Type": "npm",
                    "Vulnerabilities": [
                        {
                            "VulnerabilityID": "CVE-2023-45857",
                            "PkgName": "axios",
                            "InstalledVersion": "1.6.0",
                            "FixedVersion": "1.6.1",
                            "Severity": "HIGH",
                            "Title": "axios: Server-Side Request Forgery"
                        }
                    ]
                }
            ]
        }
    )
    
    # Process the test scan through the same logic as real webhook
    vulnerabilities = []
    summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
    
    results = test_payload.trivy_results.get("Results", [])
    for result in results:
        target = result.get("Target", "unknown")
        target_type = result.get("Type", "dependency")
        
        for vuln in result.get("Vulnerabilities", []):
            severity = vuln.get("Severity", "UNKNOWN").lower()
            if severity in summary:
                summary[severity] += 1
            
            vulnerabilities.append({
                "vuln_id": vuln.get("VulnerabilityID", ""),
                "package_name": vuln.get("PkgName", ""),
                "installed_version": vuln.get("InstalledVersion", ""),
                "fixed_version": vuln.get("FixedVersion"),
                "severity": vuln.get("Severity", "UNKNOWN"),
                "title": vuln.get("Title", ""),
                "description": vuln.get("Description"),
                "references": vuln.get("References", []),
                "cvss_score": None,
                "target": target,
                "target_type": target_type
            })
    
    # Save test scan
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    scan_doc = {
        "scan_id": scan_id,
        "project_id": project_id,
        "user_id": user.user_id,
        "status": "completed",
        "scan_type": "all",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "vulnerabilities": vulnerabilities,
        "summary": summary,
        "commit_sha": test_payload.commit_sha,
        "branch": "test-branch",
        "triggered_by": "test"
    }
    
    await db.scans.insert_one(scan_doc)
    
    # Update project last_scan_at
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {"last_scan_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info(f"Test scan created: {scan_id} with {len(vulnerabilities)} vulnerabilities")
    
    return {
        "success": True,
        "scan_id": scan_id,
        "message": "Test scan created successfully",
        "vulnerabilities_count": len(vulnerabilities),
        "summary": summary
    }


# ============== GITHUB ACTION GENERATOR ==============

@api_router.post("/generate-action")
async def generate_github_action(
    config: GitHubActionConfig,
    user: User = Depends(get_current_user)
):
    """Generate GitHub Action YAML for Trivy scanning"""
    project = await db.projects.find_one(
        {"project_id": config.project_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    webhook_url = os.environ.get("WEBHOOK_BASE_URL", "https://trivy-github-scanner.preview.emergentagent.com")
    
    # Build Trivy scan commands based on scan types
    scan_commands = []
    if "dependencies" in config.scan_types:
        scan_commands.append("""
      - name: Run Trivy vulnerability scanner (Dependencies)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'json'
          output: 'trivy-deps-results.json'
          severity: 'CRITICAL,HIGH,MEDIUM,LOW'""")
    
    if "containers" in config.scan_types:
        scan_commands.append("""
      - name: Run Trivy vulnerability scanner (Container)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'image'
          image-ref: '${{ github.repository }}:${{ github.sha }}'
          format: 'json'
          output: 'trivy-container-results.json'
          severity: 'CRITICAL,HIGH,MEDIUM,LOW'
        continue-on-error: true""")
    
    if "iac" in config.scan_types:
        scan_commands.append("""
      - name: Run Trivy config scanner (IaC)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: '.'
          format: 'json'
          output: 'trivy-iac-results.json'
          severity: 'CRITICAL,HIGH,MEDIUM,LOW'""")
    
    # Build trigger section
    trigger = """on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]"""
    
    if config.schedule:
        trigger += f"""
  schedule:
    - cron: '{config.schedule}'"""
    
    yaml_content = f"""# Depends SCA Scanner - GitHub Action
# Generated for project: {project['name']}
# Repo: {project['repo_url']}

name: Depends Security Scan

{trigger}

jobs:
  security-scan:
    name: Trivy Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
{''.join(scan_commands)}

      - name: Merge and send results to Depends
        run: |
          # Merge all Trivy results
          echo '{{}}' > merged-results.json
          
          if [ -f trivy-deps-results.json ]; then
            jq -s '.[0] * {{Results: (.[0].Results // []) + (.[1].Results // [])}}' merged-results.json trivy-deps-results.json > temp.json && mv temp.json merged-results.json
          fi
          
          if [ -f trivy-container-results.json ]; then
            jq -s '.[0] * {{Results: (.[0].Results // []) + (.[1].Results // [])}}' merged-results.json trivy-container-results.json > temp.json && mv temp.json merged-results.json
          fi
          
          if [ -f trivy-iac-results.json ]; then
            jq -s '.[0] * {{Results: (.[0].Results // []) + (.[1].Results // [])}}' merged-results.json trivy-iac-results.json > temp.json && mv temp.json merged-results.json
          fi
          
          # Send to Depends webhook
          curl -X POST "{webhook_url}/api/webhook/scan" \\
            -H "Content-Type: application/json" \\
            -d "$(jq -n \\
              --arg project_id "{project['project_id']}" \\
              --arg webhook_secret "{project['webhook_secret']}" \\
              --arg commit_sha "${{{{ github.sha }}}}" \\
              --arg branch "${{{{ github.ref_name }}}}" \\
              --arg scan_type "all" \\
              --slurpfile results merged-results.json \\
              '{{
                project_id: $project_id,
                webhook_secret: $webhook_secret,
                commit_sha: $commit_sha,
                branch: $branch,
                scan_type: $scan_type,
                trivy_results: $results[0],
                status: "completed"
              }}')"

      - name: Check for critical/high vulnerabilities
        if: always()
        run: |
          CRITICAL=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' merged-results.json 2>/dev/null || echo 0)
          HIGH=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' merged-results.json 2>/dev/null || echo 0)
          
          echo "Critical vulnerabilities: $CRITICAL"
          echo "High vulnerabilities: $HIGH"
          
          if [ "${{{{ env.FAIL_ON_SEVERITY }}}}" == "CRITICAL" ] && [ "$CRITICAL" -gt 0 ]; then
            echo "::error::Found $CRITICAL critical vulnerabilities"
            exit 1
          fi
          
          if [ "${{{{ env.FAIL_ON_SEVERITY }}}}" == "HIGH" ] && [ "$((CRITICAL + HIGH))" -gt 0 ]; then
            echo "::error::Found $CRITICAL critical and $HIGH high vulnerabilities"
            exit 1
          fi
        env:
          FAIL_ON_SEVERITY: {config.fail_on_severity}
"""
    
    return {
        "yaml": yaml_content,
        "project_id": project["project_id"],
        "webhook_url": f"{webhook_url}/api/webhook/scan",
        "webhook_secret": project["webhook_secret"]
    }

# ============== DASHBOARD STATS ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    """Get aggregated stats for dashboard"""
    # Count projects
    project_count = await db.projects.count_documents({"user_id": user.user_id})
    
    # Get all scans for user
    scans = await db.scans.find(
        {"user_id": user.user_id},
        {"_id": 0, "summary": 1, "status": 1, "started_at": 1, "project_id": 1}
    ).to_list(1000)
    
    # Aggregate vulnerability counts
    total_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
    for scan in scans:
        if scan.get("status") == "completed" and scan.get("summary"):
            for severity, count in scan["summary"].items():
                if severity in total_summary:
                    total_summary[severity] += count
    
    # Get recent scans (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_scans = [s for s in scans if s.get("started_at", "") >= seven_days_ago]
    
    # Trend data (group by day)
    trend_data = {}
    for scan in scans:
        if scan.get("started_at"):
            date_str = scan["started_at"][:10]  # Get just the date part
            if date_str not in trend_data:
                trend_data[date_str] = {"date": date_str, "critical": 0, "high": 0, "medium": 0, "low": 0}
            if scan.get("summary"):
                for sev in ["critical", "high", "medium", "low"]:
                    trend_data[date_str][sev] += scan["summary"].get(sev, 0)
    
    # Sort trend data by date
    sorted_trend = sorted(trend_data.values(), key=lambda x: x["date"])[-14:]  # Last 14 days
    
    return {
        "project_count": project_count,
        "total_scans": len(scans),
        "recent_scans": len(recent_scans),
        "vulnerability_summary": total_summary,
        "total_vulnerabilities": sum(total_summary.values()),
        "trend_data": sorted_trend
    }

@api_router.get("/dashboard/recent-vulnerabilities")
async def get_recent_vulnerabilities(
    limit: int = 20,
    severity: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get recent vulnerabilities across all projects"""
    # Get recent completed scans
    scans = await db.scans.find(
        {"user_id": user.user_id, "status": "completed"},
        {"_id": 0}
    ).sort("started_at", -1).to_list(50)
    
    # Get project names
    projects = await db.projects.find(
        {"user_id": user.user_id},
        {"_id": 0, "project_id": 1, "name": 1}
    ).to_list(100)
    project_names = {p["project_id"]: p["name"] for p in projects}
    
    # Flatten vulnerabilities
    all_vulns = []
    for scan in scans:
        for vuln in scan.get("vulnerabilities", []):
            vuln_copy = vuln.copy()
            vuln_copy["scan_id"] = scan["scan_id"]
            vuln_copy["project_id"] = scan["project_id"]
            vuln_copy["project_name"] = project_names.get(scan["project_id"], "Unknown")
            vuln_copy["scanned_at"] = scan["started_at"]
            all_vulns.append(vuln_copy)
    
    # Filter by severity if specified
    if severity:
        all_vulns = [v for v in all_vulns if v.get("severity", "").upper() == severity.upper()]
    
    # Sort by severity priority and return limited results
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNKNOWN": 4}
    all_vulns.sort(key=lambda x: severity_order.get(x.get("severity", "UNKNOWN"), 5))
    
    return {"vulnerabilities": all_vulns[:limit]}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Depends SCA Scanner API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

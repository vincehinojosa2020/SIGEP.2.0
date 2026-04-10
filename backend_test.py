#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Depends SCA Scanner
Tests all endpoints: health, auth, projects, scans, webhooks, GitHub actions, dashboard
"""

import requests
import sys
import json
from datetime import datetime
import uuid

class DependsAPITester:
    def __init__(self, base_url="https://trivy-github-scanner.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, status_code=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED")
            if status_code:
                print(f"   Status: {status_code}")
            if error:
                print(f"   Error: {error}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "status_code": status_code,
            "error": str(error) if error else None
        })

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            self.log_test("Health Check", success, response.status_code)
            if success:
                data = response.json()
                print(f"   Health Status: {data.get('status')}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, error=e)
            return False

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            self.log_test("Root API Endpoint", success, response.status_code)
            if success:
                data = response.json()
                print(f"   Message: {data.get('message')}")
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, error=e)
            return False

    def create_test_user_session(self):
        """Create test user and session in MongoDB for testing"""
        try:
            import subprocess
            timestamp = int(datetime.now().timestamp())
            user_id = f"test-user-{timestamp}"
            session_token = f"test_session_{timestamp}"
            
            mongo_script = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{user_id}',
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: '{user_id}',
  session_token: '{session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
"""
            
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                self.log_test("Create Test User Session", True)
                print(f"   User ID: {user_id}")
                print(f"   Session Token: {session_token}")
                return True
            else:
                self.log_test("Create Test User Session", False, error=result.stderr)
                return False
                
        except Exception as e:
            self.log_test("Create Test User Session", False, error=e)
            return False

    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint"""
        if not self.session_token:
            self.log_test("Auth Me Endpoint", False, error="No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Auth Me Endpoint", success, response.status_code)
            if success:
                data = response.json()
                print(f"   User: {data.get('name')} ({data.get('email')})")
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, error=e)
            return False

    def test_auth_logout_endpoint(self):
        """Test /api/auth/logout endpoint"""
        if not self.session_token:
            self.log_test("Auth Logout Endpoint", False, error="No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(f"{self.api_url}/auth/logout", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Auth Logout Endpoint", success, response.status_code)
            return success
        except Exception as e:
            self.log_test("Auth Logout Endpoint", False, error=e)
            return False

    def test_projects_crud(self):
        """Test Projects CRUD operations"""
        if not self.session_token:
            self.log_test("Projects CRUD", False, error="No session token available")
            return False

        headers = {"Authorization": f"Bearer {self.session_token}", "Content-Type": "application/json"}
        project_id = None

        try:
            # Test POST /api/projects
            project_data = {
                "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
                "repo_url": "https://github.com/test/repo",
                "description": "Test project for API testing",
                "scan_types": ["dependencies", "containers"]
            }
            
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Create Project (POST /projects)", success, response.status_code)
            
            if success:
                data = response.json()
                project_id = data.get("project_id")
                print(f"   Created Project ID: {project_id}")
            else:
                return False

            # Test GET /api/projects
            response = requests.get(f"{self.api_url}/projects", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("List Projects (GET /projects)", success, response.status_code)
            
            if success:
                data = response.json()
                projects = data.get("projects", [])
                print(f"   Found {len(projects)} projects")

            # Test GET /api/projects/{id}
            if project_id:
                response = requests.get(f"{self.api_url}/projects/{project_id}", headers=headers, timeout=10)
                success = response.status_code == 200
                self.log_test("Get Project (GET /projects/{id})", success, response.status_code)

            # Test PUT /api/projects/{id}
            if project_id:
                update_data = {"description": "Updated test project description"}
                response = requests.put(f"{self.api_url}/projects/{project_id}", json=update_data, headers=headers, timeout=10)
                success = response.status_code == 200
                self.log_test("Update Project (PUT /projects/{id})", success, response.status_code)

            # Test DELETE /api/projects/{id}
            if project_id:
                response = requests.delete(f"{self.api_url}/projects/{project_id}", headers=headers, timeout=10)
                success = response.status_code == 200
                self.log_test("Delete Project (DELETE /projects/{id})", success, response.status_code)

            return True

        except Exception as e:
            self.log_test("Projects CRUD", False, error=e)
            return False

    def test_scans_endpoints(self):
        """Test Scans endpoints"""
        if not self.session_token:
            self.log_test("Scans Endpoints", False, error="No session token available")
            return False

        headers = {"Authorization": f"Bearer {self.session_token}", "Content-Type": "application/json"}

        try:
            # First create a test project for scans
            project_data = {
                "name": f"Scan Test Project {datetime.now().strftime('%H%M%S')}",
                "repo_url": "https://github.com/test/scan-repo",
                "description": "Project for scan testing",
                "scan_types": ["dependencies"]
            }
            
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Scans Endpoints - Create Test Project", False, response.status_code)
                return False
            
            project_id = response.json().get("project_id")
            print(f"   Created test project: {project_id}")

            # Test POST /api/scans/trigger/{project_id}
            response = requests.post(f"{self.api_url}/scans/trigger/{project_id}", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Trigger Scan (POST /scans/trigger/{project_id})", success, response.status_code)
            
            scan_id = None
            if success:
                data = response.json()
                scan_id = data.get("scan_id")
                print(f"   Triggered Scan ID: {scan_id}")

            # Test GET /api/scans
            response = requests.get(f"{self.api_url}/scans", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("List All Scans (GET /scans)", success, response.status_code)
            
            if success:
                data = response.json()
                scans = data.get("scans", [])
                print(f"   Found {len(scans)} scans")

            # Test GET /api/scans/{scan_id}
            if scan_id:
                response = requests.get(f"{self.api_url}/scans/{scan_id}", headers=headers, timeout=10)
                success = response.status_code == 200
                self.log_test("Get Scan (GET /scans/{scan_id})", success, response.status_code)

            # Test GET /api/scans/project/{project_id}
            response = requests.get(f"{self.api_url}/scans/project/{project_id}", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Get Project Scans (GET /scans/project/{project_id})", success, response.status_code)

            # Clean up test project
            requests.delete(f"{self.api_url}/projects/{project_id}", headers=headers, timeout=10)

            return True

        except Exception as e:
            self.log_test("Scans Endpoints", False, error=e)
            return False

    def test_webhook_endpoint(self):
        """Test webhook endpoint"""
        try:
            # Create a test project first to get webhook secret
            if not self.session_token:
                self.log_test("Webhook Endpoint", False, error="No session token available")
                return False

            headers = {"Authorization": f"Bearer {self.session_token}", "Content-Type": "application/json"}
            
            project_data = {
                "name": f"Webhook Test Project {datetime.now().strftime('%H%M%S')}",
                "repo_url": "https://github.com/test/webhook-repo",
                "description": "Project for webhook testing",
                "scan_types": ["dependencies"]
            }
            
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Webhook Endpoint - Create Test Project", False, response.status_code)
                return False
            
            project = response.json()
            project_id = project.get("project_id")
            webhook_secret = project.get("webhook_secret")

            # Test POST /api/webhook/scan
            webhook_payload = {
                "project_id": project_id,
                "webhook_secret": webhook_secret,
                "scan_type": "all",
                "commit_sha": "abc123",
                "branch": "main",
                "status": "completed",
                "trivy_results": {
                    "Results": [
                        {
                            "Target": "package.json",
                            "Type": "npm",
                            "Vulnerabilities": [
                                {
                                    "VulnerabilityID": "CVE-2023-1234",
                                    "PkgName": "test-package",
                                    "InstalledVersion": "1.0.0",
                                    "FixedVersion": "1.0.1",
                                    "Severity": "HIGH",
                                    "Title": "Test vulnerability",
                                    "Description": "Test vulnerability description"
                                }
                            ]
                        }
                    ]
                }
            }
            
            response = requests.post(f"{self.api_url}/webhook/scan", json=webhook_payload, timeout=10)
            success = response.status_code == 200
            self.log_test("Webhook Scan (POST /webhook/scan)", success, response.status_code)
            
            if success:
                data = response.json()
                print(f"   Webhook processed, scan ID: {data.get('scan_id')}")

            # Clean up test project
            requests.delete(f"{self.api_url}/projects/{project_id}", headers=headers, timeout=10)

            return success

        except Exception as e:
            self.log_test("Webhook Endpoint", False, error=e)
            return False

    def test_github_action_generator(self):
        """Test GitHub Action generator endpoint"""
        if not self.session_token:
            self.log_test("GitHub Action Generator", False, error="No session token available")
            return False

        headers = {"Authorization": f"Bearer {self.session_token}", "Content-Type": "application/json"}

        try:
            # Create a test project first
            project_data = {
                "name": f"GitHub Action Test Project {datetime.now().strftime('%H%M%S')}",
                "repo_url": "https://github.com/test/action-repo",
                "description": "Project for GitHub Action testing",
                "scan_types": ["dependencies", "containers", "iac"]
            }
            
            response = requests.post(f"{self.api_url}/projects", json=project_data, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("GitHub Action Generator - Create Test Project", False, response.status_code)
                return False
            
            project_id = response.json().get("project_id")

            # Test POST /api/generate-action
            action_config = {
                "project_id": project_id,
                "scan_types": ["dependencies", "containers", "iac"],
                "fail_on_severity": "HIGH",
                "schedule": "0 2 * * *"
            }
            
            response = requests.post(f"{self.api_url}/generate-action", json=action_config, headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Generate GitHub Action (POST /generate-action)", success, response.status_code)
            
            if success:
                data = response.json()
                yaml_content = data.get("yaml", "")
                print(f"   Generated YAML length: {len(yaml_content)} characters")
                print(f"   Webhook URL: {data.get('webhook_url')}")

            # Clean up test project
            requests.delete(f"{self.api_url}/projects/{project_id}", headers=headers, timeout=10)

            return success

        except Exception as e:
            self.log_test("GitHub Action Generator", False, error=e)
            return False

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        if not self.session_token:
            self.log_test("Dashboard Endpoints", False, error="No session token available")
            return False

        headers = {"Authorization": f"Bearer {self.session_token}"}

        try:
            # Test GET /api/dashboard/stats
            response = requests.get(f"{self.api_url}/dashboard/stats", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Dashboard Stats (GET /dashboard/stats)", success, response.status_code)
            
            if success:
                data = response.json()
                print(f"   Project count: {data.get('project_count', 0)}")
                print(f"   Total scans: {data.get('total_scans', 0)}")
                print(f"   Total vulnerabilities: {data.get('total_vulnerabilities', 0)}")

            # Test GET /api/dashboard/recent-vulnerabilities
            response = requests.get(f"{self.api_url}/dashboard/recent-vulnerabilities", headers=headers, timeout=10)
            success = response.status_code == 200
            self.log_test("Recent Vulnerabilities (GET /dashboard/recent-vulnerabilities)", success, response.status_code)
            
            if success:
                data = response.json()
                vulns = data.get("vulnerabilities", [])
                print(f"   Recent vulnerabilities: {len(vulns)}")

            return True

        except Exception as e:
            self.log_test("Dashboard Endpoints", False, error=e)
            return False

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        try:
            import subprocess
            
            mongo_script = """
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
db.projects.deleteMany({name: /Test Project|Scan Test Project|Webhook Test Project|GitHub Action Test Project/});
db.scans.deleteMany({triggered_by: 'manual'});
"""
            
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            success = result.returncode == 0
            self.log_test("Cleanup Test Data", success)
            return success
                
        except Exception as e:
            self.log_test("Cleanup Test Data", False, error=e)
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Depends SCA Scanner API Tests")
        print(f"📍 Testing API: {self.api_url}")
        print("=" * 60)

        # Basic connectivity tests
        self.test_health_endpoint()
        self.test_root_endpoint()

        # Create test user session for authenticated tests
        if self.create_test_user_session():
            # Auth tests
            self.test_auth_me_endpoint()
            
            # CRUD tests
            self.test_projects_crud()
            self.test_scans_endpoints()
            
            # Integration tests
            self.test_webhook_endpoint()
            self.test_github_action_generator()
            self.test_dashboard_endpoints()
            
            # Auth logout test
            self.test_auth_logout_endpoint()
            
            # Cleanup
            self.cleanup_test_data()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = DependsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
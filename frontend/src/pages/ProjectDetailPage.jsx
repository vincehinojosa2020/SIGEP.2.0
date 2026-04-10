import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { 
  ArrowLeft, 
  Play, 
  Copy, 
  Check,
  ExternalLink,
  Clock,
  AlertTriangle,
  Shield,
  FileCode,
  Webhook
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [scans, setScans] = useState([]);
  const [actionYaml, setActionYaml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, scansRes] = await Promise.all([
          axios.get(`${API}/projects/${projectId}`, { withCredentials: true }),
          axios.get(`${API}/scans/project/${projectId}`, { withCredentials: true })
        ]);
        setProject(projectRes.data);
        setScans(scansRes.data.scans || []);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project");
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, navigate]);

  const handleTriggerScan = async () => {
    try {
      const res = await axios.post(
        `${API}/scans/trigger/${projectId}`, 
        {}, 
        { withCredentials: true }
      );
      toast.success("Scan triggered. Run the GitHub Action to complete.");
      // Refresh scans
      const scansRes = await axios.get(`${API}/scans/project/${projectId}`, { withCredentials: true });
      setScans(scansRes.data.scans || []);
    } catch (error) {
      console.error("Failed to trigger scan:", error);
      toast.error("Failed to trigger scan");
    }
  };

  const handleGenerateAction = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
        `${API}/generate-action`,
        {
          project_id: projectId,
          scan_types: project.scan_types || ["dependencies"],
          fail_on_severity: "HIGH"
        },
        { withCredentials: true }
      );
      setActionYaml(res.data);
      toast.success("GitHub Action generated");
    } catch (error) {
      console.error("Failed to generate action:", error);
      toast.error("Failed to generate GitHub Action");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyYaml = () => {
    if (actionYaml?.yaml) {
      navigator.clipboard.writeText(actionYaml.yaml);
      setCopied(true);
      toast.success("YAML copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getSeverityTotal = (scan) => {
    if (!scan.summary) return 0;
    return Object.values(scan.summary).reduce((a, b) => a + b, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-8 w-64 rounded mb-4" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="h-4 w-96 rounded mb-8" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="h-64 rounded" style={{ backgroundColor: 'var(--surface-1)' }}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-sm mb-4 hover:text-white transition-colors"
            style={{ color: 'var(--text-muted)' }}
            data-testid="back-to-projects"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
                style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
              >
                {project?.name}
              </h1>
              <a
                href={project?.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink className="w-4 h-4" />
                {project?.repo_url}
              </a>
            </div>

            <Button
              onClick={handleTriggerScan}
              className="btn-primary rounded-sm"
              data-testid="trigger-scan-btn"
            >
              <Play className="w-4 h-4 mr-2" />
              Trigger Scan
            </Button>
          </div>

          {project?.description && (
            <p className="mt-4" style={{ color: 'var(--text-body)' }}>
              {project.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {project?.scan_types?.map((type) => (
              <span
                key={type}
                className="px-2 py-1 text-xs rounded-sm capitalize"
                style={{ 
                  backgroundColor: 'var(--primary-muted)', 
                  color: 'var(--primary)' 
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scans" className="space-y-6">
          <TabsList 
            className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <TabsTrigger 
              value="scans"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-scans"
            >
              <Shield className="w-4 h-4 mr-2" />
              Scan History
            </TabsTrigger>
            <TabsTrigger 
              value="action"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-action"
            >
              <FileCode className="w-4 h-4 mr-2" />
              GitHub Action
            </TabsTrigger>
            <TabsTrigger 
              value="webhook"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-webhook"
            >
              <Webhook className="w-4 h-4 mr-2" />
              Webhook
            </TabsTrigger>
          </TabsList>

          {/* Scan History Tab */}
          <TabsContent value="scans">
            {scans.length > 0 ? (
              <div 
                className="rounded-md overflow-hidden"
                style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Scan ID</th>
                      <th>Status</th>
                      <th>Vulnerabilities</th>
                      <th>Branch</th>
                      <th>Triggered</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map((scan) => (
                      <tr 
                        key={scan.scan_id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/scans/${scan.scan_id}`)}
                        data-testid={`scan-row-${scan.scan_id}`}
                      >
                        <td>
                          <span className="font-mono text-sm" style={{ color: 'var(--text-heading)' }}>
                            {scan.scan_id}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={`status-dot ${scan.status}`}></span>
                            <span className="capitalize">{scan.status}</span>
                          </div>
                        </td>
                        <td>
                          {scan.status === "completed" ? (
                            <div className="flex items-center gap-2">
                              {scan.summary?.critical > 0 && (
                                <span className="badge severity-critical">
                                  {scan.summary.critical} C
                                </span>
                              )}
                              {scan.summary?.high > 0 && (
                                <span className="badge severity-high">
                                  {scan.summary.high} H
                                </span>
                              )}
                              {getSeverityTotal(scan) === 0 && (
                                <span className="badge severity-secure">Clean</span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span className="font-mono text-sm">
                            {scan.branch || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="capitalize" style={{ color: 'var(--text-muted)' }}>
                            {scan.triggered_by}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {formatDate(scan.started_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state py-16">
                <Shield className="empty-state-icon" />
                <h4 className="empty-state-title">No Scans Yet</h4>
                <p className="empty-state-text">
                  Set up the GitHub Action and push to your repo to run scans
                </p>
              </div>
            )}
          </TabsContent>

          {/* GitHub Action Tab */}
          <TabsContent value="action">
            <div 
              className="rounded-md p-6"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 
                    className="text-lg font-semibold mb-1"
                    style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                  >
                    GitHub Action Configuration
                  </h3>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Generate a GitHub Action YAML file to scan this repository
                  </p>
                </div>
                {!actionYaml && (
                  <Button
                    onClick={handleGenerateAction}
                    disabled={generating}
                    className="btn-primary rounded-sm"
                    data-testid="generate-action-btn"
                  >
                    {generating ? "Generating..." : "Generate YAML"}
                  </Button>
                )}
              </div>

              {actionYaml && (
                <div className="space-y-4">
                  <div className="code-container">
                    <div className="code-header">
                      <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                        .github/workflows/depends-scan.yml
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyYaml}
                        className="btn-ghost"
                        data-testid="copy-yaml-btn"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 mr-1" style={{ color: 'var(--primary)' }} />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="code-content">
                        <pre>{actionYaml.yaml}</pre>
                      </div>
                    </ScrollArea>
                  </div>

                  <div 
                    className="p-4 rounded-sm"
                    style={{ backgroundColor: 'var(--primary-muted)', border: '1px solid var(--border-focus)' }}
                  >
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                      Setup Instructions
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: 'var(--text-body)' }}>
                      <li>Copy the YAML above</li>
                      <li>Create a file at <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--app-bg)' }}>.github/workflows/depends-scan.yml</code> in your repository</li>
                      <li>Paste the YAML content and commit</li>
                      <li>The scan will run on every push to main/master or pull request</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Webhook Tab */}
          <TabsContent value="webhook">
            <div 
              className="rounded-md p-6"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            >
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
              >
                Webhook Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Webhook URL
                  </label>
                  <div 
                    className="mt-1 p-3 rounded-sm font-mono text-sm break-all"
                    style={{ backgroundColor: 'var(--app-bg)', border: '1px solid var(--border-default)' }}
                  >
                    {process.env.REACT_APP_BACKEND_URL}/api/webhook/scan
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Project ID
                  </label>
                  <div 
                    className="mt-1 p-3 rounded-sm font-mono text-sm"
                    style={{ backgroundColor: 'var(--app-bg)', border: '1px solid var(--border-default)' }}
                  >
                    {project?.project_id}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    Webhook Secret
                  </label>
                  <div 
                    className="mt-1 p-3 rounded-sm font-mono text-sm"
                    style={{ backgroundColor: 'var(--app-bg)', border: '1px solid var(--border-default)' }}
                  >
                    {project?.webhook_secret}
                  </div>
                </div>

                <div 
                  className="p-4 rounded-sm"
                  style={{ backgroundColor: 'var(--medium-bg)', border: '1px solid var(--medium-border)' }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--medium-text)' }} />
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: 'var(--medium-text)' }}>
                        Keep Your Secret Safe
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-body)' }}>
                        The webhook secret is used to authenticate scan results. Store it securely in your GitHub repository secrets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProjectDetailPage;

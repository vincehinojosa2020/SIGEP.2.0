import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { 
  ArrowLeft, 
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Clock,
  GitBranch,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { toast } from "sonner";

const ScanDetailPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const res = await axios.get(`${API}/scans/${scanId}`, { withCredentials: true });
        setScan(res.data);
      } catch (error) {
        console.error("Failed to fetch scan:", error);
        toast.error("Failed to load scan details");
        navigate("/scans");
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [scanId, navigate]);

  const filteredVulns = scan?.vulnerabilities?.filter(vuln => {
    const matchesSeverity = severityFilter === "all" || vuln.severity?.toLowerCase() === severityFilter.toLowerCase();
    const matchesSearch = !searchQuery || 
      vuln.vuln_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vuln.package_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vuln.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  }) || [];

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

  const getSeverityIcon = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return <AlertCircle className="w-4 h-4" style={{ color: 'var(--critical-text)' }} />;
      case "HIGH":
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--high-text)' }} />;
      case "MEDIUM":
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--medium-text)' }} />;
      default:
        return <Info className="w-4 h-4" style={{ color: 'var(--low-text)' }} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" style={{ color: 'var(--secure-text)' }} />;
      case "failed":
        return <XCircle className="w-5 h-5" style={{ color: 'var(--critical-text)' }} />;
      default:
        return <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-8 w-64 rounded mb-4" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="h-4 w-96 rounded mb-8" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="h-96 rounded" style={{ backgroundColor: 'var(--surface-1)' }}></div>
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
            onClick={() => navigate("/scans")}
            className="flex items-center gap-2 text-sm mb-4 hover:text-white transition-colors"
            style={{ color: 'var(--text-muted)' }}
            data-testid="back-to-scans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scans
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(scan?.status)}
                <h1 
                  className="text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Scan Results
                </h1>
              </div>
              <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                {scan?.scan_id}
              </p>
            </div>
          </div>

          {/* Scan Meta */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>
                {formatDate(scan?.started_at)}
              </span>
            </div>
            {scan?.branch && (
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                  {scan.branch}
                </span>
              </div>
            )}
            {scan?.commit_sha && (
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-muted)' }}>Commit:</span>
                <span className="font-mono" style={{ color: 'var(--primary)' }}>
                  {scan.commit_sha.slice(0, 7)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {["critical", "high", "medium", "low", "unknown"].map((severity) => (
            <div
              key={severity}
              className={`metric-card cursor-pointer ${severityFilter === severity ? 'ring-1' : ''}`}
              style={{ 
                borderColor: severityFilter === severity ? `var(--${severity}-border, var(--border-focus))` : undefined,
                ringColor: `var(--${severity}-border, var(--border-focus))`
              }}
              onClick={() => setSeverityFilter(severityFilter === severity ? "all" : severity)}
              data-testid={`filter-${severity}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getSeverityIcon(severity.toUpperCase())}
                <span className="text-xs uppercase tracking-widest capitalize" style={{ color: 'var(--text-muted)' }}>
                  {severity}
                </span>
              </div>
              <div 
                className="metric-value text-3xl"
                style={{ color: `var(--${severity}-text, var(--text-heading))` }}
              >
                {scan?.summary?.[severity] || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div 
          className="flex items-center gap-4 p-4 rounded-md mb-6"
          style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Search by CVE ID, package name, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{ 
                backgroundColor: 'var(--app-bg)', 
                borderColor: 'var(--border-default)',
                color: 'var(--text-heading)'
              }}
              data-testid="search-vulns"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger 
              className="w-40"
              style={{ 
                backgroundColor: 'var(--app-bg)', 
                borderColor: 'var(--border-default)' 
              }}
              data-testid="severity-filter"
            >
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-default)' 
              }}
            >
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vulnerabilities List */}
        {filteredVulns.length > 0 ? (
          <div 
            className="rounded-md"
            style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            data-testid="vulnerabilities-list"
          >
            <ScrollArea className="h-[600px]">
              <Accordion type="single" collapsible className="w-full">
                {filteredVulns.map((vuln, idx) => (
                  <AccordionItem 
                    key={`${vuln.vuln_id}-${idx}`} 
                    value={`item-${idx}`}
                    className="border-b"
                    style={{ borderColor: 'var(--border-divider)' }}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-[var(--surface-hover)]">
                      <div className="flex items-center gap-4 flex-1 text-left">
                        {getSeverityIcon(vuln.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span 
                              className="font-mono text-sm font-medium"
                              style={{ color: 'var(--text-heading)' }}
                            >
                              {vuln.vuln_id}
                            </span>
                            <span className={`badge severity-${vuln.severity?.toLowerCase()}`}>
                              {vuln.severity}
                            </span>
                          </div>
                          <p className="text-sm truncate mt-1" style={{ color: 'var(--text-muted)' }}>
                            {vuln.package_name}@{vuln.installed_version}
                            {vuln.fixed_version && (
                              <span style={{ color: 'var(--secure-text)' }}>
                                {" → "}{vuln.fixed_version}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        <div>
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-heading)' }}>
                            {vuln.title || "No title available"}
                          </h4>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {vuln.description || "No description available"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                              Package
                            </span>
                            <p className="font-mono text-sm mt-1">{vuln.package_name}</p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                              Installed
                            </span>
                            <p className="font-mono text-sm mt-1">{vuln.installed_version}</p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                              Fixed In
                            </span>
                            <p className="font-mono text-sm mt-1" style={{ color: vuln.fixed_version ? 'var(--secure-text)' : 'var(--text-muted)' }}>
                              {vuln.fixed_version || "Not fixed"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                              CVSS Score
                            </span>
                            <p className="font-mono text-sm mt-1">
                              {vuln.cvss_score || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                            Target
                          </span>
                          <p className="font-mono text-sm mt-1">{vuln.target}</p>
                        </div>

                        {vuln.references?.length > 0 && (
                          <div>
                            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                              References
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {vuln.references.slice(0, 3).map((ref, refIdx) => (
                                <a
                                  key={refIdx}
                                  href={ref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-[var(--surface-hover)]"
                                  style={{ color: 'var(--primary)' }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {new URL(ref).hostname}
                                </a>
                              ))}
                              {vuln.references.length > 3 && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  +{vuln.references.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        ) : (
          <div className="empty-state py-16">
            <CheckCircle className="empty-state-icon" style={{ color: 'var(--secure-text)' }} />
            <h4 className="empty-state-title">
              {searchQuery || severityFilter !== "all" ? "No matching vulnerabilities" : "No Vulnerabilities Found"}
            </h4>
            <p className="empty-state-text">
              {searchQuery || severityFilter !== "all" 
                ? "Try adjusting your filters"
                : "This scan completed without finding any security issues"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScanDetailPage;

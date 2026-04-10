import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { 
  ScanSearch, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ScansPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await axios.get(`${API}/scans?limit=100`, { withCredentials: true });
        setScans(res.data.scans || []);
      } catch (error) {
        console.error("Failed to fetch scans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const filteredScans = scans.filter(scan => 
    statusFilter === "all" || scan.status === statusFilter
  );

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" style={{ color: 'var(--secure-text)' }} />;
      case "failed":
        return <XCircle className="w-4 h-4" style={{ color: 'var(--critical-text)' }} />;
      case "running":
        return <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--medium-text)' }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
    }
  };

  const getSeverityTotal = (scan) => {
    if (!scan.summary) return 0;
    return Object.values(scan.summary).reduce((a, b) => a + b, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-8 w-48 rounded mb-8" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="h-96 rounded" style={{ backgroundColor: 'var(--surface-1)' }}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Scan History
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              View all security scans across your projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger 
                className="w-40"
                style={{ 
                  backgroundColor: 'var(--surface-1)', 
                  borderColor: 'var(--border-default)' 
                }}
                data-testid="status-filter"
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent
                style={{ 
                  backgroundColor: 'var(--surface-1)', 
                  borderColor: 'var(--border-default)' 
                }}
              >
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scans Table */}
        {filteredScans.length > 0 ? (
          <div 
            className="rounded-md overflow-hidden"
            style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            data-testid="scans-table"
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Vulnerabilities</th>
                  <th>Type</th>
                  <th>Triggered</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => (
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
                      <span className="font-mono text-sm" style={{ color: 'var(--primary)' }}>
                        {scan.project_id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.status)}
                        <span className="capitalize">{scan.status}</span>
                      </div>
                    </td>
                    <td>
                      {scan.status === "completed" ? (
                        <div className="flex items-center gap-1">
                          {scan.summary?.critical > 0 && (
                            <span className="badge severity-critical">
                              {scan.summary.critical}
                            </span>
                          )}
                          {scan.summary?.high > 0 && (
                            <span className="badge severity-high">
                              {scan.summary.high}
                            </span>
                          )}
                          {scan.summary?.medium > 0 && (
                            <span className="badge severity-medium">
                              {scan.summary.medium}
                            </span>
                          )}
                          {scan.summary?.low > 0 && (
                            <span className="badge severity-low">
                              {scan.summary.low}
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
                      <span className="capitalize text-sm">
                        {scan.scan_type}
                      </span>
                    </td>
                    <td>
                      <span className="capitalize text-sm" style={{ color: 'var(--text-muted)' }}>
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
          <div className="empty-state py-20">
            <ScanSearch className="empty-state-icon" />
            <h4 className="empty-state-title">No Scans Found</h4>
            <p className="empty-state-text">
              {statusFilter !== "all" 
                ? `No scans with status "${statusFilter}"` 
                : "Run your first scan by setting up a GitHub Action"}
            </p>
            {statusFilter !== "all" && (
              <Button
                onClick={() => setStatusFilter("all")}
                className="btn-secondary rounded-sm mt-4"
              >
                Clear Filter
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScansPage;

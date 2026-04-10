import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  FolderGit2,
  ScanSearch,
  TrendingUp,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ScrollArea } from "../components/ui/scroll-area";

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentVulns, setRecentVulns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, vulnsRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
          axios.get(`${API}/dashboard/recent-vulnerabilities?limit=10`, { withCredentials: true })
        ]);
        setStats(statsRes.data);
        setRecentVulns(vulnsRes.data.vulnerabilities || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const severityColors = {
    critical: "#EF4444",
    high: "#F97316",
    medium: "#EAB308",
    low: "#3B82F6",
    unknown: "#10B981"
  };

  const pieData = stats ? [
    { name: "Critical", value: stats.vulnerability_summary.critical, color: severityColors.critical },
    { name: "High", value: stats.vulnerability_summary.high, color: severityColors.high },
    { name: "Medium", value: stats.vulnerability_summary.medium, color: severityColors.medium },
    { name: "Low", value: stats.vulnerability_summary.low, color: severityColors.low },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-8 w-48 rounded mb-8" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 rounded" style={{ backgroundColor: 'var(--surface-1)' }}></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
          >
            Security Overview
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Monitor vulnerabilities across your projects
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="metric-card" data-testid="metric-projects">
            <div className="flex items-center gap-3 mb-4">
              <FolderGit2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Projects
              </span>
            </div>
            <div className="metric-value" style={{ color: 'var(--text-heading)' }}>
              {stats?.project_count || 0}
            </div>
          </div>

          <div className="metric-card" data-testid="metric-scans">
            <div className="flex items-center gap-3 mb-4">
              <ScanSearch className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Total Scans
              </span>
            </div>
            <div className="metric-value" style={{ color: 'var(--text-heading)' }}>
              {stats?.total_scans || 0}
            </div>
          </div>

          <div className="metric-card" data-testid="metric-vulns">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--critical-text)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Vulnerabilities
              </span>
            </div>
            <div className="metric-value" style={{ color: 'var(--critical-text)' }}>
              {stats?.total_vulnerabilities || 0}
            </div>
          </div>

          <div className="metric-card" data-testid="metric-critical">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5" style={{ color: 'var(--critical-text)' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Critical
              </span>
            </div>
            <div className="metric-value" style={{ color: 'var(--critical-text)' }}>
              {stats?.vulnerability_summary?.critical || 0}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 chart-container" data-testid="trend-chart">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Vulnerability Trend
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last 14 days</p>
              </div>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.trend_data || []}>
                  <defs>
                    <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={severityColors.critical} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={severityColors.critical} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={severityColors.high} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={severityColors.high} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis 
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-1)', 
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px'
                    }}
                    labelStyle={{ color: 'var(--text-heading)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="critical" 
                    stroke={severityColors.critical}
                    fill="url(#criticalGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="high" 
                    stroke={severityColors.high}
                    fill="url(#highGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Distribution */}
          <div className="chart-container" data-testid="severity-chart">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Severity Distribution
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All time</p>
              </div>
            </div>
            {pieData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--surface-1)', 
                          border: '1px solid var(--border-default)',
                          borderRadius: '4px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.name}: <span className="font-mono">{item.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p style={{ color: 'var(--text-muted)' }}>No vulnerability data</p>
              </div>
            )}
          </div>
        </div>

        {/* Severity Summary & Recent Vulnerabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Severity Summary Cards */}
          <div className="space-y-4">
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Severity Breakdown
            </h3>
            
            <div 
              className="p-4 rounded-sm flex items-center justify-between"
              style={{ backgroundColor: 'var(--critical-bg)', border: '1px solid var(--critical-border)' }}
              data-testid="severity-critical"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--critical-text)' }} />
                <span style={{ color: 'var(--critical-text)' }}>Critical</span>
              </div>
              <span className="font-mono text-xl font-medium" style={{ color: 'var(--critical-text)' }}>
                {stats?.vulnerability_summary?.critical || 0}
              </span>
            </div>

            <div 
              className="p-4 rounded-sm flex items-center justify-between"
              style={{ backgroundColor: 'var(--high-bg)', border: '1px solid var(--high-border)' }}
              data-testid="severity-high"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--high-text)' }} />
                <span style={{ color: 'var(--high-text)' }}>High</span>
              </div>
              <span className="font-mono text-xl font-medium" style={{ color: 'var(--high-text)' }}>
                {stats?.vulnerability_summary?.high || 0}
              </span>
            </div>

            <div 
              className="p-4 rounded-sm flex items-center justify-between"
              style={{ backgroundColor: 'var(--medium-bg)', border: '1px solid var(--medium-border)' }}
              data-testid="severity-medium"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--medium-text)' }} />
                <span style={{ color: 'var(--medium-text)' }}>Medium</span>
              </div>
              <span className="font-mono text-xl font-medium" style={{ color: 'var(--medium-text)' }}>
                {stats?.vulnerability_summary?.medium || 0}
              </span>
            </div>

            <div 
              className="p-4 rounded-sm flex items-center justify-between"
              style={{ backgroundColor: 'var(--low-bg)', border: '1px solid var(--low-border)' }}
              data-testid="severity-low"
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5" style={{ color: 'var(--low-text)' }} />
                <span style={{ color: 'var(--low-text)' }}>Low</span>
              </div>
              <span className="font-mono text-xl font-medium" style={{ color: 'var(--low-text)' }}>
                {stats?.vulnerability_summary?.low || 0}
              </span>
            </div>
          </div>

          {/* Recent Vulnerabilities */}
          <div 
            className="lg:col-span-2 rounded-md"
            style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            data-testid="recent-vulnerabilities"
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Recent Vulnerabilities
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Latest findings across projects</p>
              </div>
              <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            
            <ScrollArea className="h-[400px]">
              {recentVulns.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Package</th>
                      <th>Severity</th>
                      <th>Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVulns.map((vuln, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="font-mono text-sm" style={{ color: 'var(--text-heading)' }}>
                            {vuln.vuln_id}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-sm">
                            {vuln.package_name}@{vuln.installed_version}
                          </span>
                        </td>
                        <td>
                          <span className={`badge severity-${vuln.severity?.toLowerCase()}`}>
                            {vuln.severity}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {vuln.project_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state py-16">
                  <Shield className="empty-state-icon" />
                  <h4 className="empty-state-title">No Vulnerabilities Found</h4>
                  <p className="empty-state-text">
                    Run a scan to detect vulnerabilities in your projects
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;

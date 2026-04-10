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
  Clock,
  Sparkles
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
    critical: "#F87171",
    high: "#FB923C",
    medium: "#FACC15",
    low: "#60A5FA",
    unknown: "#34D399"
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
        <div className="p-8">
          <div className="h-8 w-56 skeleton mb-2"></div>
          <div className="h-4 w-72 skeleton mb-10"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 skeleton rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="page-title">Security Overview</h1>
          <p className="page-subtitle">Monitor vulnerabilities across your projects</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-10">
          <div className="metric-card hover-lift" data-testid="metric-projects">
            <div className="flex items-center gap-2.5 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-muted)' }}
              >
                <FolderGit2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <span className="overline">Projects</span>
            </div>
            <div className="metric-value" style={{ color: 'var(--text-heading)' }}>
              {stats?.project_count || 0}
            </div>
          </div>

          <div className="metric-card hover-lift" data-testid="metric-scans">
            <div className="flex items-center gap-2.5 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary-muted)' }}
              >
                <ScanSearch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <span className="overline">Total Scans</span>
            </div>
            <div className="metric-value" style={{ color: 'var(--text-heading)' }}>
              {stats?.total_scans || 0}
            </div>
          </div>

          <div className="metric-card hover-lift" data-testid="metric-vulns">
            <div className="flex items-center gap-2.5 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--critical-bg)' }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--critical-text)' }} />
              </div>
              <span className="overline">Vulnerabilities</span>
            </div>
            <div className="metric-value" style={{ color: 'var(--critical-text)' }}>
              {stats?.total_vulnerabilities || 0}
            </div>
          </div>

          <div className="metric-card hover-lift" data-testid="metric-critical">
            <div className="flex items-center gap-2.5 mb-4">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--critical-bg)' }}
              >
                <Shield className="w-4 h-4" style={{ color: 'var(--critical-text)' }} />
              </div>
              <span className="overline">Critical</span>
            </div>
            <div className="metric-value" style={{ color: 'var(--critical-text)' }}>
              {stats?.vulnerability_summary?.critical || 0}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mb-10">
          {/* Trend Chart */}
          <div className="lg:col-span-2 chart-container" data-testid="trend-chart">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="section-title">Vulnerability Trend</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Last 14 days</p>
              </div>
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.trend_data || []}>
                  <defs>
                    <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={severityColors.critical} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={severityColors.critical} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={severityColors.high} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={severityColors.high} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--border-default)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis 
                    stroke="var(--border-default)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface-2)', 
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }}
                    labelStyle={{ color: 'var(--text-heading)', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: 'var(--text-body)', fontSize: 12 }}
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
                <h3 className="section-title">Severity Distribution</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All time</p>
              </div>
            </div>
            {pieData.length > 0 ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--surface-2)', 
                          border: '1px solid var(--border-default)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 justify-center mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.name}: <span className="font-mono font-medium" style={{ color: 'var(--text-body)' }}>{item.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No vulnerability data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Severity Summary & Recent Vulnerabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Severity Summary Cards */}
          <div className="space-y-3">
            <h3 className="section-title mb-4">Severity Breakdown</h3>
            
            {[
              { key: 'critical', label: 'Critical', icon: AlertCircle, color: 'critical' },
              { key: 'high', label: 'High', icon: AlertTriangle, color: 'high' },
              { key: 'medium', label: 'Medium', icon: AlertTriangle, color: 'medium' },
              { key: 'low', label: 'Low', icon: Info, color: 'low' },
            ].map(({ key, label, icon: Icon, color }) => (
              <div 
                key={key}
                className="p-4 rounded-lg flex items-center justify-between transition-all duration-150 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: `var(--${color}-bg)`, 
                  border: `1px solid var(--${color}-border)` 
                }}
                data-testid={`severity-${key}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" style={{ color: `var(--${color}-text)` }} />
                  <span className="font-medium text-sm" style={{ color: `var(--${color}-text)` }}>{label}</span>
                </div>
                <span 
                  className="font-mono text-xl font-semibold"
                  style={{ color: `var(--${color}-text)` }}
                >
                  {stats?.vulnerability_summary?.[key] || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Recent Vulnerabilities */}
          <div 
            className="lg:col-span-2 rounded-lg overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, var(--surface-1) 0%, rgba(10, 20, 16, 0.8) 100%)',
              border: '1px solid var(--border-default)' 
            }}
            data-testid="recent-vulnerabilities"
          >
            <div 
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div>
                <h3 className="section-title">Recent Vulnerabilities</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest findings across projects</p>
              </div>
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            
            <ScrollArea className="h-[380px]">
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
                      <tr key={idx} className="cursor-pointer">
                        <td>
                          <span className="font-mono text-[13px]" style={{ color: 'var(--text-heading)' }}>
                            {vuln.vuln_id}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[13px]">
                            {vuln.package_name}
                            <span style={{ color: 'var(--text-muted)' }}>@{vuln.installed_version}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`badge severity-${vuln.severity?.toLowerCase()}`}>
                            {vuln.severity}
                          </span>
                        </td>
                        <td>
                          <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                            {vuln.project_name}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state py-20">
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

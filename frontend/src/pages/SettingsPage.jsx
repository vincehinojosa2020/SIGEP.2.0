import { useState } from "react";
import { useAuth } from "../App";
import Layout from "../components/Layout";
import { 
  User, 
  Shield, 
  Bell,
  Key,
  HelpCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const SettingsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email_critical: true,
    email_high: true,
    email_scan_complete: false
  });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
          >
            Settings
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList 
            className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <TabsTrigger 
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="about"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary)] data-[state=active]:text-[var(--primary)] px-4 py-3"
              data-testid="tab-about"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div 
              className="rounded-md p-6"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback 
                    className="text-2xl"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--app-bg)' }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h2 
                    className="text-xl font-semibold mb-1"
                    style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                  >
                    {user?.name}
                  </h2>
                  <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: 'var(--secure-text)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-body)' }}>
                      Authenticated via Google
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <h3 
                  className="font-semibold mb-4"
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      User ID
                    </label>
                    <p className="font-mono text-sm mt-1" style={{ color: 'var(--text-body)' }}>
                      {user?.user_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Email
                    </label>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-body)' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div 
              className="rounded-md p-6"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            >
              <h3 
                className="font-semibold mb-6"
                style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
              >
                Email Notifications
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium" style={{ color: 'var(--text-heading)' }}>
                      Critical Vulnerabilities
                    </Label>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Get notified when critical vulnerabilities are found
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_critical}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, email_critical: checked })
                    }
                    data-testid="toggle-critical-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium" style={{ color: 'var(--text-heading)' }}>
                      High Severity Alerts
                    </Label>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Get notified for high severity vulnerabilities
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_high}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, email_high: checked })
                    }
                    data-testid="toggle-high-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium" style={{ color: 'var(--text-heading)' }}>
                      Scan Completion
                    </Label>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Receive summary after each scan completes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email_scan_complete}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, email_scan_complete: checked })
                    }
                    data-testid="toggle-scan-notifications"
                  />
                </div>
              </div>

              <div 
                className="mt-6 p-4 rounded-sm"
                style={{ backgroundColor: 'var(--primary-muted)', border: '1px solid var(--border-focus)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-body)' }}>
                  <strong style={{ color: 'var(--primary)' }}>Note:</strong> Email notifications are coming soon. 
                  These settings will be saved for when the feature launches.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div 
              className="rounded-md p-6"
              style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded flex items-center justify-center"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <Shield className="w-7 h-7" style={{ color: 'var(--app-bg)' }} />
                </div>
                <div>
                  <h2 
                    className="text-xl font-bold"
                    style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                  >
                    Depends
                  </h2>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Software Composition Analysis Scanner
                  </p>
                </div>
              </div>

              <div className="space-y-4" style={{ color: 'var(--text-body)' }}>
                <p>
                  Depends is a cloud-based SCA scanner powered by Trivy that helps you identify 
                  vulnerabilities in your dependencies, container images, and infrastructure as code.
                </p>

                <h4 className="font-semibold pt-4" style={{ color: 'var(--text-heading)' }}>
                  Features
                </h4>
                <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-muted)' }}>
                  <li>Dependency vulnerability scanning</li>
                  <li>Container image security analysis</li>
                  <li>Infrastructure as Code (IaC) misconfiguration detection</li>
                  <li>GitHub Action integration with webhook support</li>
                  <li>Real-time scan results and trend tracking</li>
                </ul>

                <h4 className="font-semibold pt-4" style={{ color: 'var(--text-heading)' }}>
                  Powered By
                </h4>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <a 
                    href="https://trivy.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Trivy by Aqua Security
                  </a>
                </div>

                <div 
                  className="mt-6 pt-6 border-t text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                >
                  Version 1.0.0
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;

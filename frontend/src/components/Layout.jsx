import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { 
  LayoutDashboard, 
  FolderGit2, 
  ScanSearch, 
  Settings, 
  LogOut,
  Shield,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/projects", icon: FolderGit2, label: "Projects" },
    { to: "/scans", icon: ScanSearch, label: "Scans" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="main-sidebar">
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center glow-primary"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00D68F 100%)' }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--app-bg)' }} />
            </div>
            <div className="logo-text">
              <h1 
                className="font-bold text-lg tracking-tight leading-none"
                style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
              >
                Depends
              </h1>
              <p 
                className="text-[9px] uppercase tracking-[0.15em] mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                SCA Scanner
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-5">
          <div className="px-5 mb-3">
            <span 
              className="text-[9px] uppercase tracking-[0.15em] font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Main Menu
            </span>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon />
                <span className="nav-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 border-t"
          style={{ borderColor: 'var(--border-default)', background: 'var(--surface-1)' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 hover:bg-[var(--surface-hover)]"
                data-testid="user-menu-trigger"
              >
                <Avatar className="w-9 h-9 ring-2 ring-[var(--border-default)]">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback 
                    className="text-sm font-semibold"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--primary) 0%, #00D68F 100%)', 
                      color: 'var(--app-bg)' 
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left nav-text min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {user?.name || 'User'}
                  </p>
                  <p 
                    className="text-xs truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown 
                  className="w-4 h-4 nav-text transition-transform"
                  style={{ color: 'var(--text-muted)' }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-default)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

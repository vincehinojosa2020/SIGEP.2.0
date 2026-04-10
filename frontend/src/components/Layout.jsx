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
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center" 
                 style={{ backgroundColor: 'var(--primary)' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--app-bg)' }} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}>
                Depends
              </h1>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                SCA Scanner
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="py-4">
          <div className="px-3 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
              Main Menu
            </span>
          </div>
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
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-full flex items-center gap-3 p-2 rounded transition-colors hover:bg-[var(--surface-hover)]"
                data-testid="user-menu-trigger"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback style={{ backgroundColor: 'var(--primary)', color: 'var(--app-bg)' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left nav-text">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {user?.email || ''}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48"
              style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-default)' }}
            >
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer"
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
        {children}
      </main>
    </div>
  );
};

export default Layout;

import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  FolderTree, 
  Settings, 
  QrCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: UtensilsCrossed, label: 'Menu Items', path: '/dashboard/items' },
  { icon: FolderTree, label: 'Categories', path: '/dashboard/categories' },
  { icon: QrCode, label: 'QR Code', path: '/dashboard/qr' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <Logo size="sm" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Import/Export Section */}
        {!collapsed && (
          <div className="mt-6 pt-6 border-t border-sidebar-border">
            <p className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Data
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/dashboard/import"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Import Menu</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/export"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Export Menu</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && user && (
          <p className="text-sm text-sidebar-foreground/70 mb-2 truncate">
            {user.email}
          </p>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed ? "w-full justify-center" : "w-full justify-start"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

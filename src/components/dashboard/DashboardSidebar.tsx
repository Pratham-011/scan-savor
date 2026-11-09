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
  Download,
  Menu,
  X,
  Tag as TagIcon,
  PlusCircle,
  MessageCircle,
  Megaphone,
  BadgeDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { WHATSAPP_COMING_SOON } from '@/lib/features';

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  comingSoon?: boolean;
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: UtensilsCrossed, label: 'Menu Items', path: '/dashboard/items' },
  { icon: TagIcon, label: 'Tags', path: '/dashboard/tags' },
  { icon: PlusCircle, label: 'Add-Ons', path: '/dashboard/add-ons' },
  { icon: FolderTree, label: 'Categories', path: '/dashboard/categories' },
  { icon: QrCode, label: 'QR Code', path: '/dashboard/qr' },
  { icon: MessageCircle, label: 'WhatsApp Setup', path: '/dashboard/whatsapp', comingSoon: WHATSAPP_COMING_SOON },
  { icon: MessageCircle, label: 'Templates', path: '/dashboard/whatsapp-automation', comingSoon: WHATSAPP_COMING_SOON },
  { icon: MessageCircle, label: 'Quick Replies', path: '/dashboard/whatsapp-quick-replies', comingSoon: WHATSAPP_COMING_SOON },
  { icon: MessageCircle, label: 'Customer Sheet', path: '/dashboard/whatsapp-customers', comingSoon: WHATSAPP_COMING_SOON },
  { icon: MessageCircle, label: 'Chat Inbox', path: '/dashboard/whatsapp-chat', comingSoon: WHATSAPP_COMING_SOON },
  { icon: Megaphone, label: 'Broadcast', path: '/dashboard/broadcast', comingSoon: WHATSAPP_COMING_SOON },
  { icon: BadgeDollarSign, label: 'Meta Ads', path: '/dashboard/meta-ads' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

function SidebarContent({ collapsed, onCollapse, onNavigate }: { collapsed: boolean; onCollapse?: () => void; onNavigate?: () => void }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <Logo size="sm" />}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onNavigate}
                  title={item.comingSoon ? `${item.label} (coming soon)` : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <span className="relative flex-shrink-0">
                    <item.icon className={cn("h-5 w-5", item.comingSoon && "opacity-60")} />
                    {collapsed && item.comingSoon && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className={cn("font-medium", item.comingSoon && "opacity-60")}>{item.label}</span>
                      {item.comingSoon && (
                        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                          Soon
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {
        /* Import/Export Section
        {!collapsed && (
          <div className="mt-6 pt-6 border-t border-sidebar-border">
            <p className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Data
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/dashboard/import"
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Import Menu</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/export"
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Export Menu</span>
                </Link>
              </li>
            </ul>
          </div>
        )} */
        }
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
    </>
  );
}

export function DashboardSidebar() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sheet on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-50">
          <Logo size="sm" />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="h-full flex flex-col">
                <SidebarContent 
                  collapsed={false} 
                  onNavigate={() => setMobileOpen(false)} 
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Spacer for fixed header */}
        <div className="h-14" />
      </>
    );
  }

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent 
        collapsed={collapsed} 
        onCollapse={() => setCollapsed(!collapsed)} 
      />
    </aside>
  );
}

export function useSidebarState() {
  const isMobile = useIsMobile();
  const [collapsed] = useState(false);
  
  return {
    isMobile,
    sidebarWidth: isMobile ? 0 : (collapsed ? 64 : 256),
  };
}

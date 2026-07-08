import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { restaurantApi, mainCategoryApi, categoryApi, menuItemApi, menuAnalyticsApi, orderApi } from '@/lib/api';
import type { Restaurant, MenuAnalytics } from '@/lib/api';
import { 
  UtensilsCrossed, 
  FolderTree, 
  QrCode, 
  Plus,
  ArrowRight,
  TrendingUp,
  Eye,
  ScanLine,
  BellRing
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState({
    mainCategories: 0,
    categories: 0,
    menuItems: 0,
    availableItems: 0,
    newOrders: 0,
    activeOrders: 0,
  });
  const [analytics, setAnalytics] = useState<MenuAnalytics | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rest, mainCats, cats, items, orders] = await Promise.all([
          restaurantApi.get().catch(() => null),
          mainCategoryApi.getAll().catch(() => []),
          categoryApi.getAll().catch(() => []),
          menuItemApi.getAll().catch(() => []),
          orderApi.getAll().catch(() => []),
        ]);

        setRestaurant(rest);
        setStats({
          mainCategories: mainCats.length,
          categories: cats.length,
          menuItems: items.length,
          availableItems: items.filter(i => i.isCurrentlyAvailable).length,
          newOrders: orders.filter(order => order.status === 'new').length,
          activeOrders: orders.filter(order => !['served', 'cancelled'].includes(order.status)).length,
        });

        // Fetch analytics if restaurant exists
        if (rest?._id) {
          const analyticsData = await menuAnalyticsApi.get(rest._id).catch(() => null);
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="inline-flex p-6 rounded-2xl bg-primary/10 mb-6">
          <UtensilsCrossed className="h-12 w-12 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-4">
          Welcome to oneQr!
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Let's set up your restaurant to get started with your digital menu.
        </p>
        <Button variant="gold" size="lg" asChild>
          <Link to="/dashboard/setup">
            Set Up Restaurant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">{restaurant.address}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="sm:size-default" asChild>
            <a href={`${window.origin}/menu/${(restaurant as any).qrSlug || restaurant.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">View Menu</span>
              <span className="sm:hidden">View</span>
            </a>
          </Button>
          <Button variant="gold" size="sm" className="sm:size-default" asChild>
            <Link to="/dashboard/qr">
              <QrCode className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Get QR Code</span>
              <span className="sm:hidden">QR</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={BellRing}
          label="New Orders"
          value={stats.newOrders}
          href="/dashboard/orders"
          color="green"
        />
        <StatCard
          icon={BellRing}
          label="Active Orders"
          value={stats.activeOrders}
          href="/dashboard/orders"
        />
        <StatCard
          icon={FolderTree}
          label="Main Categories"
          value={stats.mainCategories}
          href="/dashboard/categories"
        />
        <StatCard
          icon={FolderTree}
          label="Sub Categories"
          value={stats.categories}
          href="/dashboard/categories"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Menu Items"
          value={stats.menuItems}
          href="/dashboard/items"
        />
        <StatCard
          icon={TrendingUp}
          label="Available Items"
          value={stats.availableItems}
          color="green"
        />
      </div>

      {/* Menu Scans Analytics */}
      {analytics && (
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="font-display text-lg sm:text-xl font-semibold">Menu Scans</h2>
            <Select value={analyticsPeriod} onValueChange={(v) => setAnalyticsPeriod(v as typeof analyticsPeriod)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass glass-hover rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {analyticsPeriod === 'today' ? "Today's Scans" : 
                     analyticsPeriod === 'week' ? "This Week" :
                     analyticsPeriod === 'month' ? "This Month" : "This Year"}
                  </p>
                  <p className="text-3xl font-bold mt-1">{analytics[analyticsPeriod]}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <ScanLine className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="glass glass-hover rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                  <p className="text-3xl font-bold mt-1">{analytics.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <ScanLine className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="font-display text-lg sm:text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Plus}
            title="Add Menu Item"
            description="Add a new dish to your menu"
            href="/dashboard/items/new"
          />
          <QuickActionCard
            icon={BellRing}
            title="View Orders"
            description="Review table orders"
            href="/dashboard/orders"
          />
          <QuickActionCard
            icon={FolderTree}
            title="Manage Categories"
            description="Organize your menu structure"
            href="/dashboard/categories"
          />
          <QuickActionCard
            icon={QrCode}
            title="QR Management"
            description="Create, bulk-generate, and manage QR codes"
            href="/dashboard/qr"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  href,
  color = 'primary' 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  href?: string;
  color?: 'primary' | 'green';
}) {
  const content = (
    <div className="glass glass-hover rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color === 'green' ? 'bg-green-500/10' : 'bg-primary/10'}`}>
          <Icon className={`h-6 w-6 ${color === 'green' ? 'text-green-500' : 'text-primary'}`} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
    >
      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

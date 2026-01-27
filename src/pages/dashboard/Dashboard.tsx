import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { restaurantApi, mainCategoryApi, categoryApi, menuItemApi } from '@/lib/api';
import type { Restaurant, MainCategory, Category, MenuItem } from '@/lib/api';
import { 
  UtensilsCrossed, 
  FolderTree, 
  QrCode, 
  Plus,
  ArrowRight,
  TrendingUp,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [stats, setStats] = useState({
    mainCategories: 0,
    categories: 0,
    menuItems: 0,
    availableItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rest, mainCats, cats, items] = await Promise.all([
          restaurantApi.get().catch(() => null),
          mainCategoryApi.getAll().catch(() => []),
          categoryApi.getAll().catch(() => []),
          menuItemApi.getAll().catch(() => []),
        ]);

        setRestaurant(rest);
        setStats({
          mainCategories: mainCats.length,
          categories: cats.length,
          menuItems: items.length,
          availableItems: items.filter(i => i.isAvailable).length,
        });
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
          Welcome to oneQR!
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground mt-1">{restaurant.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href={`http://localhost:8080/menu/${(restaurant as any).qrSlug || restaurant.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              View Menu
            </a>
          </Button>
          <Button variant="gold" asChild>
            <Link to="/dashboard/qr">
              <QrCode className="mr-2 h-4 w-4" />
              Get QR Code
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Plus}
            title="Add Menu Item"
            description="Add a new dish to your menu"
            href="/dashboard/items/new"
          />
          <QuickActionCard
            icon={FolderTree}
            title="Manage Categories"
            description="Organize your menu structure"
            href="/dashboard/categories"
          />
          <QuickActionCard
            icon={QrCode}
            title="Download QR Code"
            description="Get your menu QR code"
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

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicMenuApi, PublicMenu as PublicMenuType } from '@/lib/api';
import { Loader2, MapPin, Phone, Instagram, Leaf, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<PublicMenuType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showVegOnly, setShowVegOnly] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) return;
      try {
        const data = await publicMenuApi.getBySlug(slug);
        setMenu(data);
      } catch (err) {
        setError('Menu not found or subscription expired');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Menu Unavailable</h1>
          <p className="text-muted-foreground">{error || 'This menu could not be found.'}</p>
        </div>
      </div>
    );
  }

  const { restaurant, mainCategories, categories, items } = menu;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || 
                            item.mainCategory === selectedCategory || 
                            item.category === selectedCategory;
    const matchesVeg = !showVegOnly || item.isVeg;
    const isAvailable = item.isAvailable;
    return matchesSearch && matchesCategory && matchesVeg && isAvailable;
  });

  const groupedItems = mainCategories
    .sort((a, b) => a.order - b.order)
    .map(mainCat => ({
      ...mainCat,
      subCategories: categories
        .filter(c => c.mainCategory === mainCat._id)
        .map(subCat => ({
          ...subCat,
          items: filteredItems.filter(item => item.category === subCat._id)
        }))
        .filter(sub => sub.items.length > 0)
    }))
    .filter(main => main.subCategories.length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative">
        {restaurant.banner && (
          <div className="h-48 w-full">
            <img 
              src={restaurant.banner} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        
        <div className={cn("px-4", restaurant.banner ? "-mt-16 relative z-10" : "pt-8")}>
          <div className="flex items-end gap-4 mb-4">
            {restaurant.logo && (
              <img 
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-20 h-20 rounded-2xl border-4 border-background object-cover bg-card"
              />
            )}
            <div className="flex-1 pb-1">
              <h1 className="font-display text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-muted-foreground text-sm">{restaurant.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {restaurant.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {restaurant.address}
              </span>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="h-3 w-3" />
                {restaurant.phone}
              </a>
            )}
            {restaurant.Instaurl && (
              <a href={restaurant.Instaurl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Instagram className="h-3 w-3" />
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowVegOnly(!showVegOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
              showVegOnly 
                ? "border-veg bg-veg/10 text-veg" 
                : "border-border text-muted-foreground"
            )}
          >
            <Leaf className="h-4 w-4" />
            Veg
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}
          >
            All
          </button>
          {mainCategories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat._id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6 space-y-8">
        {groupedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          groupedItems.map(mainCat => (
            <div key={mainCat._id}>
              <h2 className="font-display text-xl font-bold mb-4 text-gradient-gold">
                {mainCat.name}
              </h2>
              
              {mainCat.subCategories.map(subCat => (
                <div key={subCat._id} className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {subCat.name}
                  </h3>
                  
                  <div className="space-y-3">
                    {subCat.items.map(item => (
                      <div 
                        key={item._id}
                        className="flex gap-4 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors"
                      >
                        {item.image && (
                          <img 
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {item.isVeg ? (
                                <div className="p-0.5 border border-veg rounded flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-veg rounded-full" />
                                </div>
                              ) : (
                                <div className="p-0.5 border border-non-veg rounded flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-non-veg rounded-full" />
                                </div>
                              )}
                              <h4 className="font-semibold">{item.name}</h4>
                            </div>
                            <span className="font-bold text-primary flex-shrink-0">
                              ₹{item.price}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Powered By Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3">
        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="text-gradient-gold font-semibold">oneQR</span>
        </p>
      </div>
    </div>
  );
}

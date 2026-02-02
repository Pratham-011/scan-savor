import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { publicMenuApi, PublicMenuResponse, PublicMenuItem, MainCategory, Category } from '@/lib/api';
import { demoMenuData } from '@/lib/demoData';
import { Loader2, MapPin, Phone, Instagram, Leaf, Search, X, Sparkles, Salad, Drumstick } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GroupedCategory {
  _id: string;
  name: string;
  order: number;
  items: PublicMenuItem[];
}

interface GroupedMainCategory {
  _id: string;
  name: string;
  order: number;
  subCategories: GroupedCategory[];
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showNonVegOnly, setShowNonVegOnly] = useState(false);
  const [showJainOnly, setShowJainOnly] = useState(false);
  const [showVeganOnly, setShowVeganOnly] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) return;
      
      // Demo mode - only when explicitly typing /menu/demo
      if (slug === 'demo') {
        setMenuData(demoMenuData);
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await publicMenuApi.getBySlug(slug);
        setMenuData(data);
      } catch (err) {
        console.error('Failed to load menu:', err);
        setError('Menu not found or unavailable');
        setMenuData(null);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchMenu();
  }, [slug]);
  
  
  
  // Extract unique main categories from menu items
  const mainCategories = useMemo(() => {
    if (!menuData?.menu) return [];
    const uniqueMainCats = new Map<string, MainCategory>();
    menuData.menu.forEach(item => {
      if (item.mainCategory && !uniqueMainCats.has(item.mainCategory._id)) {
        uniqueMainCats.set(item.mainCategory._id, item.mainCategory);
      }
    });
    return Array.from(uniqueMainCats.values()).sort((a, b) => a.order - b.order);
  }, [menuData]);

  // Extract subcategories for selected main category
  const subCategories = useMemo(() => {
    if (!menuData?.menu || !selectedMainCategory) return [];
    const uniqueSubCats = new Map<string, { _id: string; name: string; order: number }>();
    menuData.menu.forEach(item => {
      if (item.mainCategory._id === selectedMainCategory && item.category && !uniqueSubCats.has(item.category._id)) {
        uniqueSubCats.set(item.category._id, {
          _id: item.category._id,
          name: item.category.name,
          order: item.category.order || 0
        });
      }
    });
    return Array.from(uniqueSubCats.values()).sort((a, b) => a.order - b.order);
  }, [menuData, selectedMainCategory]);

  // Filter and group items
  const groupedItems = useMemo((): GroupedMainCategory[] => {
    if (!menuData?.menu) return [];

    // Filter items based on search, category, subcategory, veg, jain, and vegan filters
    const filteredItems = menuData.menu.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedMainCategory || item.mainCategory._id === selectedMainCategory;
      const matchesSubCategory = !selectedSubCategory || item.category._id === selectedSubCategory;
      const matchesVeg = !showVegOnly || item.isVeg;
      const matchesNonVeg = !showNonVegOnly || !item.isVeg;
      const matchesJain = !showJainOnly || item.isJain;
      const matchesVegan = !showVeganOnly || item.isVegan;
      const isAvailable = item.isAvailable;
      return matchesSearch && matchesCategory && matchesSubCategory && matchesVeg && matchesNonVeg && matchesJain && matchesVegan && isAvailable;
    });

    // Group by main category, then by sub category
    const mainCatMap = new Map<string, GroupedMainCategory>();

    filteredItems.forEach(item => {
      const mainCat = item.mainCategory;
      const subCat = item.category;

      if (!mainCatMap.has(mainCat._id)) {
        mainCatMap.set(mainCat._id, {
          _id: mainCat._id,
          name: mainCat.name,
          order: mainCat.order,
          subCategories: []
        });
      }

      const mainCatGroup = mainCatMap.get(mainCat._id)!;
      let subCatGroup = mainCatGroup.subCategories.find(s => s._id === subCat._id);
      
      if (!subCatGroup) {
        subCatGroup = {
          _id: subCat._id,
          name: subCat.name,
          order: subCat.order || 0,
          items: []
        };
        mainCatGroup.subCategories.push(subCatGroup);
      }

      subCatGroup.items.push(item);
    });

    // Sort everything
    return Array.from(mainCatMap.values())
      .sort((a, b) => a.order - b.order)
      .map(mainCat => ({
        ...mainCat,
        subCategories: mainCat.subCategories
          .sort((a, b) => a.order - b.order)
          .map(subCat => ({
            ...subCat,
            items: subCat.items.sort((a, b) => a.order - b.order)
          }))
      }));
  }, [menuData, searchQuery, selectedMainCategory, selectedSubCategory, showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Menu Unavailable</h1>
          <p className="text-muted-foreground">{error || 'This menu could not be found.'}</p>
        </div>
      </div>
    );
  }

  const { restaurant } = menuData;

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
            onClick={() => {
              setShowVegOnly(!showVegOnly);
              if (!showVegOnly) setShowNonVegOnly(false);
            }}
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
          {restaurant.foodTypes?.includes('non-veg') && (
            <button
              onClick={() => {
                setShowNonVegOnly(!showNonVegOnly);
                if (!showNonVegOnly) setShowVegOnly(false);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                showNonVegOnly 
                  ? "border-non-veg bg-non-veg/10 text-non-veg" 
                  : "border-border text-muted-foreground"
              )}
            >
              <Drumstick className="h-4 w-4" />
              Non-Veg
            </button>
          )}
          {restaurant.foodTypes?.includes('jain') && (
            <button
              onClick={() => setShowJainOnly(!showJainOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                showJainOnly 
                  ? "border-amber-500 bg-amber-500/10 text-amber-500" 
                  : "border-border text-muted-foreground"
              )}
            >
              <Sparkles className="h-4 w-4" />
              Jain
            </button>
          )}
          {restaurant.foodTypes?.includes('vegan') && (
            <button
              onClick={() => setShowVeganOnly(!showVeganOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                showVeganOnly 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" 
                  : "border-border text-muted-foreground"
              )}
            >
              <Salad className="h-4 w-4" />
              Vegan
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedMainCategory(null);
              setSelectedSubCategory(null);
            }}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              !selectedMainCategory
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}
          >
            All
          </button>
          {mainCategories.map(cat => (
            <button
              key={cat._id}
              onClick={() => {
                setSelectedMainCategory(cat._id);
                setSelectedSubCategory(null);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedMainCategory === cat._id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory Pills - show only when main category is selected */}
        {selectedMainCategory && subCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mt-2">
            <button
              onClick={() => setSelectedSubCategory(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                !selectedSubCategory
                  ? "bg-accent text-accent-foreground" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              All
            </button>
            {subCategories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedSubCategory(cat._id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedSubCategory === cat._id 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
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
                              {item.isJain && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-600 rounded border border-amber-500/30">
                                  JAIN
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 rounded border border-emerald-500/30">
                                  VEGAN
                                </span>
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
          Powered by <span className="text-gradient-gold font-semibold">oneQr</span>
        </p>
      </div>
    </div>
  );
}

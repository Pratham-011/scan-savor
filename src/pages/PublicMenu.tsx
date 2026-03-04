import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { publicMenuApi, PublicMenuResponse, PublicMenuItem, MainCategory, Category } from '@/lib/api';
import { demoMenuData } from '@/lib/demoData';
import { MapPin, Phone, Instagram, Leaf, Search, X, Sparkles, Salad, Drumstick, CookingPot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [showHalfJainOnly, setShowHalfJainOnly] = useState(false);

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
  
  
  
  // Extract unique main categories from menu items (only currently available ones)
const mainCategories = useMemo(() => {
  if (!menuData?.menu) return [];

  const uniqueMainCats = new Map<string, any>();

  menuData.menu.forEach(item => {
    if (!uniqueMainCats.has(item.mainCategory._id)) {
      uniqueMainCats.set(item.mainCategory._id, item.mainCategory);
    }
  });

  return Array.from(uniqueMainCats.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
}, [menuData]);



  // Extract subcategories for selected main category (only currently available ones)
const subCategories = useMemo(() => {
  if (!menuData?.menu || !selectedMainCategory) return [];

  const uniqueSubCats = new Map<string, any>();

  menuData.menu.forEach(item => {
    if (
      item.mainCategory._id === selectedMainCategory &&
      !uniqueSubCats.has(item.category._id)
    ) {
      uniqueSubCats.set(item.category._id, {
        _id: item.category._id,
        name: item.category.name,
        order: item.category.order || 0,
        image: item.category.image
      });
    }
  });

  return Array.from(uniqueSubCats.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
}, [menuData, selectedMainCategory]);



  // Filter and group items
  const groupedItems = useMemo((): GroupedMainCategory[] => {
    if (!menuData?.menu) return [];

    // Filter items based on search, category, subcategory, veg, jain, vegan, and availability filters
const filteredItems = menuData.menu.filter(item => {
  const matchesSearch =
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesCategory =
    !selectedMainCategory || item.mainCategory._id === selectedMainCategory;

  const matchesSubCategory =
    !selectedSubCategory || item.category._id === selectedSubCategory;

  const matchesVeg = !showVegOnly || item.isVeg;
  const matchesNonVeg = !showNonVegOnly || !item.isVeg;
  const matchesJain = !showJainOnly || item.isJain;
  const matchesVegan = !showVeganOnly || item.isVegan;
  const matchesHalfJain = !showHalfJainOnly || item.isHalfJain;

  return (
    matchesSearch &&
    matchesCategory &&
    matchesSubCategory &&
    matchesVeg &&
    matchesNonVeg &&
    matchesJain &&
    matchesVegan &&
    matchesHalfJain
  );
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

    // Sort everything by admin-defined order
    return Array.from(mainCatMap.values())
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(mainCat => ({
        ...mainCat,
        subCategories: mainCat.subCategories
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(subCat => ({
            ...subCat,
            items: subCat.items.sort((a, b) => (a.order || 0) - (b.order || 0))
          }))
      }));
  }, [menuData, searchQuery, selectedMainCategory, selectedSubCategory, showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly, showHalfJainOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <div className="relative">
          <Skeleton className="h-48 w-full" />
          <div className="px-4 -mt-16 relative z-10">
            <div className="flex items-end gap-4 mb-4">
              <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
              <div className="flex-1 pb-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Search & Filter Skeleton */}
        <div className="px-4 py-3 mt-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-16 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Menu Items Skeleton */}
        <div className="px-4 py-6 space-y-8">
          {[1, 2].map(section => (
            <div key={section}>
              <Skeleton className="h-6 w-36 mb-4" />
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="space-y-3">
                {[1, 2, 3].map(item => (
                  <div key={item} className="flex gap-4 p-3 rounded-xl">
                    <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
              restaurant.locationLink ? (
                <a 
                  href={restaurant.locationLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {restaurant.address}
                </a>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {restaurant.address}
                </span>
              )
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
          {restaurant.foodTypes?.includes('half-jain') && (
            <button
              onClick={() => setShowHalfJainOnly(!showHalfJainOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                showHalfJainOnly 
                  ? "border-orange-500 bg-orange-500/10 text-orange-500" 
                  : "border-border text-muted-foreground"
              )}
            >
              <CookingPot className="h-4 w-4" />
              Half Jain
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
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedMainCategory === cat._id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {cat.image && (
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
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
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedSubCategory === cat._id 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {cat.image && (
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                )}
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
          groupedItems.map(mainCat => {
            // Find main category image from the original data
            const mainCatData = mainCategories.find(c => c._id === mainCat._id);
            return (
            <div key={mainCat._id}>
              <div className="flex items-center gap-3 mb-4">
                {mainCatData?.image && (
                  <img 
                    src={mainCatData.image} 
                    alt={mainCat.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <h2 className="font-display text-xl font-bold text-gradient-gold">
                  {mainCat.name}
                </h2>
              </div>
              
              {mainCat.subCategories.map(subCat => {
                // Find subcategory image from the original data
                const subCatData = subCategories.find(c => c._id === subCat._id);
                return (
                <div key={subCat._id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {subCatData?.image && (
                      <img 
                        src={subCatData.image} 
                        alt={subCat.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {subCat.name}
                    </h3>
                  </div>
                  
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
                            <div className="flex items-center gap-1.5">
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
                            <div className="flex items-center gap-1.5 flex-shrink-0">
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
                              {item.isHalfJain && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500/20 text-orange-600 rounded border border-orange-500/30">
                                  HALF JAIN
                                </span>
                              )}
                              <span className="font-bold text-primary">
                                ₹{item.price}
                              </span>
                            </div>
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
              );
              })}
            </div>
          );
          })
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

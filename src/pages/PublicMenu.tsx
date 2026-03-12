import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { publicMenuApi, PublicMenuResponse, PublicMenuItem, MainCategory, Category } from '@/lib/api';
import { demoMenuData } from '@/lib/demoData';
import { MapPin, Phone, Instagram, Leaf, Search, X, Sparkles, Salad, Drumstick, CookingPot, TagIcon, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [addressExpanded, setAddressExpanded] = useState(false);
  const tagFilterRef = useRef<HTMLDivElement>(null);

  const toggleDescription = useCallback((itemId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!showTagFilter) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!tagFilterRef.current) return;
      const targetNode = event.target as Node;
      if (!tagFilterRef.current.contains(targetNode)) {
        setShowTagFilter(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTagFilter(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showTagFilter]);

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

// Extract unique tags from menu items
const uniqueTags = useMemo(() => {
  if (!menuData?.menu) return [];

  const tagsMap = new Map<string, { _id: string; name: string; color: string }>();

  menuData.menu.forEach(item => {
    item.tags?.forEach(tag => {
      if (!tagsMap.has(tag._id)) {
        tagsMap.set(tag._id, { _id: tag._id, name: tag.name, color: tag.color });
      }
    });
  });

  return Array.from(tagsMap.values());
}, [menuData]);

const visibleTags = useMemo(() => {
  if (!tagSearchQuery.trim()) return uniqueTags;

  const query = tagSearchQuery.toLowerCase();
  return uniqueTags.filter(tag => tag.name.toLowerCase().includes(query));
}, [uniqueTags, tagSearchQuery]);



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
  const matchesTag = selectedTags.size === 0 || item.tags?.some(t => selectedTags.has(t._id));

  return (
    matchesSearch &&
    matchesCategory &&
    matchesSubCategory &&
    matchesVeg &&
    matchesNonVeg &&
    matchesJain &&
    matchesVegan &&
    matchesHalfJain &&
    matchesTag
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
  }, [menuData, searchQuery, selectedMainCategory, selectedSubCategory, showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly, showHalfJainOnly, selectedTags]);

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

  const mapsUrl = (() => {
    const raw = restaurant.locationLink?.trim();

    if (raw) {
      if (/^https?:\/\//i.test(raw)) return raw;
      if (raw.includes('google.') || raw.includes('maps.app.goo.gl') || raw.startsWith('www.')) {
        return `https://${raw.replace(/^\/+/, '')}`;
      }
    }

    if (restaurant.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
    }

    return null;
  })();

  const instagramUrl = (() => {
    const raw = restaurant.Instaurl?.trim();
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('@')) return `https://instagram.com/${raw.slice(1)}`;
    if (raw.includes('instagram.com/')) return `https://${raw.replace(/^https?:\/\//i, '')}`;

    return `https://instagram.com/${raw}`;
  })();

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
                className="w-20 h-20 rounded-2xl border-4 border-background object-cover bg-card cursor-pointer active:scale-95 transition-transform"
                onClick={() => setLightboxImage(restaurant.logo!)}
              />
            )}
            <div className="flex-1 pb-1">
              <h1 className="font-display text-2xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-muted-foreground text-sm">{restaurant.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {restaurant.address && (
              <div className="flex items-start gap-1.5 min-h-[40px] py-1">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("active:text-primary transition-colors touch-manipulation", !addressExpanded && restaurant.address.length > 40 && "line-clamp-1")}
                    >
                      {restaurant.address}
                    </a>
                  ) : (
                    <span className={cn(!addressExpanded && restaurant.address.length > 40 && "line-clamp-1")}>
                      {restaurant.address}
                    </span>
                  )}
                </div>
                {restaurant.address.length > 40 && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddressExpanded(!addressExpanded); }}
                    className="text-xs text-primary font-medium whitespace-nowrap flex-shrink-0 border border-primary/30 rounded px-1.5 py-0.5"
                    type="button"
                  >
                    {addressExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-1.5 min-h-[36px] py-1 active:text-primary transition-colors touch-manipulation"
                >
                  <Phone className="h-4 w-4" />
                  {restaurant.phone}
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 min-h-[36px] py-1 active:text-primary transition-colors touch-manipulation"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 mt-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-secondary/50 border-border/50"
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

        {/* Diet Filters - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => {
              setShowVegOnly(!showVegOnly);
              if (!showVegOnly) setShowNonVegOnly(false);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
              showVegOnly
                ? "bg-veg/15 text-veg ring-1 ring-veg/40 shadow-[0_0_12px_hsl(var(--veg)/0.2)]"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            )}
          >
            <Leaf className="h-3.5 w-3.5" />
            Veg
          </button>
          {restaurant.foodTypes?.includes('non-veg') && (
            <button
              onClick={() => {
                setShowNonVegOnly(!showNonVegOnly);
                if (!showNonVegOnly) setShowVegOnly(false);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                showNonVegOnly
                  ? "bg-non-veg/15 text-non-veg ring-1 ring-non-veg/40 shadow-[0_0_12px_hsl(var(--non-veg)/0.2)]"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              <Drumstick className="h-3.5 w-3.5" />
              Non-Veg
            </button>
          )}
          {restaurant.foodTypes?.includes('jain') && (
            <button
              onClick={() => setShowJainOnly(!showJainOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                showJainOnly
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Jain
            </button>
          )}
          {restaurant.foodTypes?.includes('vegan') && (
            <button
              onClick={() => setShowVeganOnly(!showVeganOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                showVeganOnly
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              <Salad className="h-3.5 w-3.5" />
              Vegan
            </button>
          )}
          {restaurant.foodTypes?.includes('half-jain') && (
            <button
              onClick={() => setShowHalfJainOnly(!showHalfJainOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
                showHalfJainOnly
                  ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              <CookingPot className="h-3.5 w-3.5" />
              Half Jain
            </button>
          )}
        </div>

        {/* Tag Filter - compact icon toggle with multi-select */}
        {uniqueTags.length > 0 && (
          <div ref={tagFilterRef} className="mt-3 relative">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                aria-label="Filter by tags"
                aria-expanded={showTagFilter}
                className={cn(
                  "relative inline-flex items-center gap-2 h-9 px-3 rounded-xl border transition-all duration-200",
                  showTagFilter || selectedTags.size > 0
                    ? "border-primary/40 bg-secondary text-foreground shadow-sm"
                    : "border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <TagIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">Tags</span>
                {selectedTags.size > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                    {selectedTags.size}
                  </span>
                )}
              </button>

              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {showTagFilter && (
              <div className="absolute right-0 top-full mt-2 z-30 w-full sm:w-[340px] rounded-xl border border-border/70 bg-card/95 backdrop-blur-md shadow-xl p-2.5">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-secondary/50 border-border/50"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto pr-1 space-y-1">
                  {visibleTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 px-1">No tags found</p>
                  ) : (
                    visibleTags.map(tag => {
                      const isSelected = selectedTags.has(tag._id);

                      return (
                        <label
                          key={tag._id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
                            isSelected ? "bg-secondary" : "hover:bg-secondary/60"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const newSelected = new Set(selectedTags);
                              if (isSelected) {
                                newSelected.delete(tag._id);
                              } else {
                                newSelected.add(tag._id);
                              }
                              setSelectedTags(newSelected);
                            }}
                            className="sr-only"
                          />

                          <span
                            className={cn(
                              "h-4 w-4 rounded-md border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-background border-border/70"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>

                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />

                          <span className="text-xs text-foreground truncate">{tag.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Category Tabs - card style */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mt-2">
          <button
            onClick={() => {
              setSelectedMainCategory(null);
              setSelectedSubCategory(null);
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
              !selectedMainCategory
                ? "bg-gradient-gold text-primary-foreground shadow-md"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
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
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                selectedMainCategory === cat._id
                  ? "bg-gradient-gold text-primary-foreground shadow-md"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-6 h-6 rounded-lg object-cover"
                />
              )}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory Pills - underline style */}
        {selectedMainCategory && subCategories.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mt-2 border-t border-border/30 pt-2">
            <button
              onClick={() => setSelectedSubCategory(null)}
              className={cn(
                "px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2",
                !selectedSubCategory
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {subCategories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedSubCategory(cat._id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2",
                  selectedSubCategory === cat._id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-4 h-4 rounded object-cover"
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
              {/* Main Category Header */}
              <div className="flex items-center gap-3 mb-5 pb-2 border-b border-border/40">
                {mainCatData?.image && (
                  <img 
                    src={mainCatData.image} 
                    alt={mainCat.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                )}
                <div>
                  <h2 className="font-display text-lg font-bold text-gradient-gold">
                    {mainCat.name}
                  </h2>
                  <div className="h-0.5 w-8 bg-gradient-gold rounded-full mt-1" />
                </div>
              </div>
              
              {mainCat.subCategories.map(subCat => {
                const subCatData = subCategories.find(c => c._id === subCat._id);
                return (
                <div key={subCat._id} className="mb-6">
                  {/* Subcategory Header */}
                  <div className="flex items-center gap-2 mb-3 ml-1">
                    {subCatData?.image && (
                      <img 
                        src={subCatData.image} 
                        alt={subCat.name}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                    )}
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {subCat.name}
                    </h3>
                    <div className="flex-1 h-px bg-border/30 ml-2" />
                  </div>
                  
                  <div className="space-y-2">
                    {subCat.items.map(item => (
                      <div
                        key={item._id}
                        className="flex gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors cursor-pointer border border-border/30"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 rounded-xl object-cover flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(item.image!);
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          {/* Row 1: veg dot + name + price */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {item.isVeg ? (
                                <div className="p-0.5 border border-veg rounded flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-veg rounded-full" />
                                </div>
                              ) : (
                                <div className="p-0.5 border border-non-veg rounded flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-non-veg rounded-full" />
                                </div>
                              )}
                              <h4 className="font-semibold text-sm leading-snug truncate">{item.name}</h4>
                            </div>
                            <span className="font-bold text-primary text-sm flex-shrink-0">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Row 2: badges (tags + dietary) */}
                          {(item.tags?.length || item.isJain || item.isVegan || item.isHalfJain) ? (
                            <div className="flex flex-wrap gap-1">
                              {item.tags?.map(tag => (
                                <span
                                  key={tag._id}
                                  className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {item.isJain && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 rounded-full">
                                  JAIN
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full">
                                  VEGAN
                                </span>
                              )}
                              {item.isHalfJain && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-500/15 text-orange-400 rounded-full">
                                  HALF JAIN
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* Row 3: description */}
                          {item.description && (
                            <div>
                              <p className={cn(
                                "text-xs text-muted-foreground leading-relaxed",
                                !expandedDescriptions.has(item._id) && "line-clamp-2"
                              )}>
                                {item.description}
                              </p>
                              {item.description.length > 80 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleDescription(item._id); }}
                                  className="text-xs text-primary font-medium mt-0.5"
                                >
                                  {expandedDescriptions.has(item._id) ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Row 4: add-ons */}
                          {item.effectiveAddOns && item.effectiveAddOns.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-auto pt-1">
                              {item.effectiveAddOns.map(addOn => (
                                <span
                                  key={addOn._id}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-secondary/60 text-muted-foreground rounded-full border border-border/50"
                                >
                                  +{addOn.name} ₹{addOn.price}
                                </span>
                              ))}
                            </div>
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

      {/* Item Details Drawer */}
      <Drawer
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DrawerContent className="max-h-[88vh]">
          {selectedItem && (
            <div className="relative overflow-y-auto pb-6">
              <DrawerTitle className="sr-only">{selectedItem.name} details</DrawerTitle>

              {/* Extra top tap area to close quickly */}
              <DrawerClose asChild>
                <button className="w-full h-3" aria-label="Close" />
              </DrawerClose>

              {selectedItem.image && (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-52 object-cover"
                  onClick={() => setLightboxImage(selectedItem.image!)}
                />
              )}

              <div className="px-4 pt-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold leading-tight">{selectedItem.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedItem.isVeg ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-veg/15 text-veg border border-veg/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-veg" />
                          VEG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-non-veg/15 text-non-veg border border-non-veg/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-non-veg" />
                          NON-VEG
                        </span>
                      )}
                      {selectedItem.isJain && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-full">JAIN</span>
                      )}
                      {selectedItem.isVegan && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full">VEGAN</span>
                      )}
                      {selectedItem.isHalfJain && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/15 text-orange-400 rounded-full">HALF JAIN</span>
                      )}
                      {selectedItem.tags?.map(tag => (
                        <span
                          key={tag._id}
                          className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xl font-bold text-primary whitespace-nowrap">₹{selectedItem.price}</span>
                </div>

                {selectedItem.description && (
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.effectiveAddOns && selectedItem.effectiveAddOns.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Available Add-ons</h4>
                    <div className="space-y-2">
                      {selectedItem.effectiveAddOns.map(addOn => (
                        <div key={addOn._id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2">
                          <span className="text-sm">{addOn.name}</span>
                          <span className="text-sm font-semibold text-primary">+₹{addOn.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full view"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

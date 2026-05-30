// import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { publicMenuApi, PublicMenuResponse, PublicMenuItem, MainCategory, Category } from '@/lib/api';
// import { demoMenuData } from '@/lib/demoData';
// import { MapPin, Phone, Instagram, Leaf, Search, X, Sparkles, Salad, Drumstick, CookingPot, TagIcon, Check } from 'lucide-react';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Input } from '@/components/ui/input';
// import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
// import { cn } from '@/lib/utils';

// interface GroupedCategory {
//   _id: string;
//   name: string;
//   order: number;
//   items: PublicMenuItem[];
// }

// interface GroupedMainCategory {
//   _id: string;
//   name: string;
//   order: number;
//   subCategories: GroupedCategory[];
// }

// export default function PublicMenu() {
//   const { slug } = useParams<{ slug: string }>();
//   const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
//   const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
//   const [showVegOnly, setShowVegOnly] = useState(false);
//   const [showNonVegOnly, setShowNonVegOnly] = useState(false);
//   const [showJainOnly, setShowJainOnly] = useState(false);
//   const [showVeganOnly, setShowVeganOnly] = useState(false);
//   const [showHalfJainOnly, setShowHalfJainOnly] = useState(false);
//   const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
//   const [showTagFilter, setShowTagFilter] = useState(false);
//   const [tagSearchQuery, setTagSearchQuery] = useState('');
//   const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
//   const [lightboxImage, setLightboxImage] = useState<string | null>(null);
//   const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
//   const [addressExpanded, setAddressExpanded] = useState(false);

//     const isMobileDevice =
//     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
//     (window.matchMedia('(pointer:coarse)').matches && window.innerWidth <= 1024);
    
//   const [isRedirectingToWhatsApp, setIsRedirectingToWhatsApp] = useState(false);
//   const tagFilterRef = useRef<HTMLDivElement>(null);

//   const toggleDescription = useCallback((itemId: string) => {
//     setExpandedDescriptions(prev => {
//       const next = new Set(prev);
//       if (next.has(itemId)) next.delete(itemId);
//       else next.add(itemId);
//       return next;
//     });
//   }, []);

//   useEffect(() => {
//     if (!showTagFilter) return;

//     const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
//       if (!tagFilterRef.current) return;
//       const targetNode = event.target as Node;
//       if (!tagFilterRef.current.contains(targetNode)) {
//         setShowTagFilter(false);
//       }
//     };

//     const handleEscape = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         setShowTagFilter(false);
//       }
//     };

//     document.addEventListener('mousedown', handleOutsideClick);
//     document.addEventListener('touchstart', handleOutsideClick);
//     document.addEventListener('keydown', handleEscape);

//     return () => {
//       document.removeEventListener('mousedown', handleOutsideClick);
//       document.removeEventListener('touchstart', handleOutsideClick);
//       document.removeEventListener('keydown', handleEscape);
//     };
//   }, [showTagFilter]);

//   useEffect(() => {
//     const fetchMenu = async () => {
//       if (!slug) return;
//       const source = new URLSearchParams(window.location.search).get('source') || undefined;
      
//       // Demo mode - only when explicitly typing /menu/demo
//       if (slug === 'demo') {
//         setMenuData(demoMenuData);
//         setIsLoading(false);
//         return;
//       }
      
//       // Track whether we are redirecting so finally block can skip setIsLoading.
//       // NOTE: a return inside try still runs finally, so we need this flag.
//       let redirecting = false;

//       try {
//         const data = await publicMenuApi.getBySlug(slug, source);
//         if (data.redirectToWhatsapp && data.redirectUrl) {
//           redirecting = true;
//           setIsRedirectingToWhatsApp(true);
//           // Use replace so the menu page is not in browser history
//           window.location.replace(data.redirectUrl);
//           return;
//         }
//         setMenuData(data);
//       } catch (err) {
//         console.error('Failed to load menu:', err);
//         setError('Menu not found or unavailable');
//         setMenuData(null);
//       } finally {
//         // Only stop the loading spinner if we are NOT mid-redirect.
//         // Leaving isLoading=true while the browser navigates away prevents
//         // the "Menu Unavailable" screen from flashing before the redirect completes.
//         if (!redirecting) {
//           setIsLoading(false);
//         }
//       }
//     };
  
//     fetchMenu();
//   }, [slug]);
  

//   // Extract unique main categories from menu items (only currently available ones)
// const mainCategories = useMemo(() => {
//   if (!menuData?.menu) return [];

//   const uniqueMainCats = new Map<string, any>();

//   menuData.menu.forEach(item => {
//     if (!uniqueMainCats.has(item.mainCategory._id)) {
//       uniqueMainCats.set(item.mainCategory._id, item.mainCategory);
//     }
//   });

//   return Array.from(uniqueMainCats.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
// }, [menuData]);



//   // Extract subcategories for selected main category (only currently available ones)
// const subCategories = useMemo(() => {
//   if (!menuData?.menu || !selectedMainCategory) return [];

//   const uniqueSubCats = new Map<string, any>();

//   menuData.menu.forEach(item => {
//     if (
//       item.mainCategory._id === selectedMainCategory &&
//       !uniqueSubCats.has(item.category._id)
//     ) {
//       uniqueSubCats.set(item.category._id, {
//         _id: item.category._id,
//         name: item.category.name,
//         order: item.category.order || 0,
//         image: item.category.image
//       });
//     }
//   });

//   return Array.from(uniqueSubCats.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
// }, [menuData, selectedMainCategory]);

// // Extract unique tags from menu items
// const uniqueTags = useMemo(() => {
//   if (!menuData?.menu) return [];

//   const tagsMap = new Map<string, { _id: string; name: string; color: string }>();

//   menuData.menu.forEach(item => {
//     item.tags?.forEach(tag => {
//       if (!tagsMap.has(tag._id)) {
//         tagsMap.set(tag._id, { _id: tag._id, name: tag.name, color: tag.color });
//       }
//     });
//   });

//   return Array.from(tagsMap.values());
// }, [menuData]);

// const visibleTags = useMemo(() => {
//   if (!tagSearchQuery.trim()) return uniqueTags;

//   const query = tagSearchQuery.toLowerCase();
//   return uniqueTags.filter(tag => tag.name.toLowerCase().includes(query));
// }, [uniqueTags, tagSearchQuery]);



//   // Filter and group items
//   const groupedItems = useMemo((): GroupedMainCategory[] => {
//     if (!menuData?.menu) return [];

//     // Filter items based on search, category, subcategory, veg, jain, vegan, and availability filters
// const filteredItems = menuData.menu.filter(item => {
//   const matchesSearch =
//     item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     item.description?.toLowerCase().includes(searchQuery.toLowerCase());

//   const matchesCategory =
//     !selectedMainCategory || item.mainCategory._id === selectedMainCategory;

//   const matchesSubCategory =
//     !selectedSubCategory || item.category._id === selectedSubCategory;

//   const matchesVeg = !showVegOnly || item.isVeg;
//   const matchesNonVeg = !showNonVegOnly || !item.isVeg;
//   const matchesJain = !showJainOnly || item.isJain;
//   const matchesVegan = !showVeganOnly || item.isVegan;
//   const matchesHalfJain = !showHalfJainOnly || item.isHalfJain;
//   const matchesTag = selectedTags.size === 0 || item.tags?.some(t => selectedTags.has(t._id));

//   return (
//     matchesSearch &&
//     matchesCategory &&
//     matchesSubCategory &&
//     matchesVeg &&
//     matchesNonVeg &&
//     matchesJain &&
//     matchesVegan &&
//     matchesHalfJain &&
//     matchesTag
//   );
// });



//     // Group by main category, then by sub category
//     const mainCatMap = new Map<string, GroupedMainCategory>();

//     filteredItems.forEach(item => {
//       const mainCat = item.mainCategory;
//       const subCat = item.category;

//       if (!mainCatMap.has(mainCat._id)) {
//         mainCatMap.set(mainCat._id, {
//           _id: mainCat._id,
//           name: mainCat.name,
//           order: mainCat.order,
//           subCategories: []
//         });
//       }

//       const mainCatGroup = mainCatMap.get(mainCat._id)!;
//       let subCatGroup = mainCatGroup.subCategories.find(s => s._id === subCat._id);
      
//       if (!subCatGroup) {
//         subCatGroup = {
//           _id: subCat._id,
//           name: subCat.name,
//           order: subCat.order || 0,
//           items: []
//         };
//         mainCatGroup.subCategories.push(subCatGroup);
//       }

//       subCatGroup.items.push(item);
//     });

//     // Sort everything by admin-defined order
//     return Array.from(mainCatMap.values())
//       .sort((a, b) => (a.order || 0) - (b.order || 0))
//       .map(mainCat => ({
//         ...mainCat,
//         subCategories: mainCat.subCategories
//           .sort((a, b) => (a.order || 0) - (b.order || 0))
//           .map(subCat => ({
//             ...subCat,
//             items: subCat.items.sort((a, b) => (a.order || 0) - (b.order || 0))
//           }))
//       }));
//   }, [menuData, searchQuery, selectedMainCategory, selectedSubCategory, showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly, showHalfJainOnly, selectedTags]);

  	
//   // Show a clean screen while the browser navigates to WhatsApp.
//   // This prevents the skeleton or "Menu Unavailable" from flashing.
//   if (isRedirectingToWhatsApp) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <div className="text-center space-y-3">
//           <div className="text-4xl">💬</div>
//           <h1 className="font-display text-xl font-bold">Redirecting to WhatsApp…</h1>
//           <p className="text-muted-foreground text-sm">You'll be connected with the restaurant shortly.</p>
//         </div>
//       </div>
//     );
//   }  

//   if (isLoading) {
//          if (isMobileDevice) {
//        return <div className="min-h-screen bg-background" />; // blank, no flash
//      }
//     return (
//       <div className="min-h-screen bg-background pb-24">
//         {/* Header Skeleton */}
//         <div className="relative">
//           <Skeleton className="h-48 w-full" />
//           <div className="px-4 -mt-16 relative z-10">
//             <div className="flex items-end gap-4 mb-4">
//               <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
//               <div className="flex-1 pb-1 space-y-2">
//                 <Skeleton className="h-7 w-48" />
//                 <Skeleton className="h-4 w-64" />
//               </div>
//             </div>
//             <div className="flex gap-3">
//               <Skeleton className="h-4 w-32" />
//               <Skeleton className="h-4 w-24" />
//             </div>
//           </div>
//         </div>

//         {/* Search & Filter Skeleton */}
//         <div className="px-4 py-3 mt-4 border-b border-border">
//           <div className="flex items-center gap-3 mb-3">
//             <Skeleton className="h-10 flex-1 rounded-md" />
//             <Skeleton className="h-10 w-16 rounded-lg" />
//             <Skeleton className="h-10 w-24 rounded-lg" />
//           </div>
//           <div className="flex gap-2">
//             {[1, 2, 3, 4].map(i => (
//               <Skeleton key={i} className="h-8 w-20 rounded-full" />
//             ))}
//           </div>
//         </div>

//         {/* Menu Items Skeleton */}
//         <div className="px-4 py-6 space-y-8">
//           {[1, 2].map(section => (
//             <div key={section}>
//               <Skeleton className="h-6 w-36 mb-4" />
//               <Skeleton className="h-4 w-24 mb-3" />
//               <div className="space-y-3">
//                 {[1, 2, 3].map(item => (
//                   <div key={item} className="flex gap-4 p-3 rounded-xl">
//                     <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
//                     <div className="flex-1 space-y-2">
//                       <Skeleton className="h-5 w-3/4" />
//                       <Skeleton className="h-4 w-full" />
//                       <Skeleton className="h-4 w-1/2" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (error || !menuData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background p-4">
//         <div className="text-center">
//           <h1 className="font-display text-2xl font-bold mb-2">Menu Unavailable</h1>
//           <p className="text-muted-foreground">{error || 'This menu could not be found.'}</p>
//         </div>
//       </div>
//     );
//   }

//   const { restaurant } = menuData;

//   const mapsUrl = (() => {
//     const raw = restaurant.locationLink?.trim();

//     if (raw) {
//       if (/^https?:\/\//i.test(raw)) return raw;
//       if (raw.includes('google.') || raw.includes('maps.app.goo.gl') || raw.startsWith('www.')) {
//         return `https://${raw.replace(/^\/+/, '')}`;
//       }
//     }

//     if (restaurant.address) {
//       return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
//     }

//     return null;
//   })();

//   const instagramUrl = (() => {
//     const raw = restaurant.Instaurl?.trim();
//     if (!raw) return null;

//     if (/^https?:\/\//i.test(raw)) return raw;
//     if (raw.startsWith('@')) return `https://instagram.com/${raw.slice(1)}`;
//     if (raw.includes('instagram.com/')) return `https://${raw.replace(/^https?:\/\//i, '')}`;

//     return `https://instagram.com/${raw}`;
//   })();

//   return (
//     <div className="min-h-screen bg-background pb-24">
//       {/* Header */}
//       <div className="relative">
//         {restaurant.banner && (
//           <div className="h-48 w-full">
//             <img 
//               src={restaurant.banner} 
//               alt={restaurant.name}
//               className="w-full h-full object-cover"
//             />
//             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
//           </div>
//         )}
        
//         <div className={cn("px-4", restaurant.banner ? "-mt-16 relative z-10" : "pt-8")}>
//           <div className="flex items-end gap-4 mb-4">
//             {restaurant.logo && (
//               <img 
//                 src={restaurant.logo}
//                 alt={restaurant.name}
//                 className="w-20 h-20 rounded-2xl border-4 border-background object-cover bg-card cursor-pointer active:scale-95 transition-transform"
//                 onClick={() => setLightboxImage(restaurant.logo!)}
//               />
//             )}
//             <div className="flex-1 pb-1">
//               <h1 className="font-display text-2xl font-bold">{restaurant.name}</h1>
//               {restaurant.description && (
//                 <p className="text-muted-foreground text-sm">{restaurant.description}</p>
//               )}
//             </div>
//           </div>

//           <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
//             {restaurant.address && (
//               <div className="flex items-start gap-1.5 min-h-[40px] py-1">
//                 <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   {mapsUrl ? (
//                     <a
//                       href={mapsUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className={cn("active:text-primary transition-colors touch-manipulation", !addressExpanded && restaurant.address.length > 40 && "line-clamp-1")}
//                     >
//                       {restaurant.address}
//                     </a>
//                   ) : (
//                     <span className={cn(!addressExpanded && restaurant.address.length > 40 && "line-clamp-1")}>
//                       {restaurant.address}
//                     </span>
//                   )}
//                 </div>
//                 {restaurant.address.length > 40 && (
//                   <button
//                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddressExpanded(!addressExpanded); }}
//                     className="text-xs text-primary font-medium whitespace-nowrap flex-shrink-0 border border-primary/30 rounded px-1.5 py-0.5"
//                     type="button"
//                   >
//                     {addressExpanded ? 'Show less' : 'Read more'}
//                   </button>
//                 )}
//               </div>
//             )}
//             <div className="flex flex-wrap items-center gap-3">
//               {restaurant.phone && (
//                 <a
//                   href={`tel:${restaurant.phone}`}
//                   className="flex items-center gap-1.5 min-h-[36px] py-1 active:text-primary transition-colors touch-manipulation"
//                 >
//                   <Phone className="h-4 w-4" />
//                   {restaurant.phone}
//                 </a>
//               )}
//               {instagramUrl && (
//                 <a
//                   href={instagramUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center gap-1.5 min-h-[36px] py-1 active:text-primary transition-colors touch-manipulation"
//                 >
//                   <Instagram className="h-4 w-4" />
//                   Instagram
//                 </a>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search & Filters */}
//       <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 mt-4">
//         {/* Search */}
//         <div className="relative mb-3">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search menu..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-9 pr-9 bg-secondary/50 border-border/50"
//           />
//           {searchQuery && (
//             <button
//               onClick={() => setSearchQuery('')}
//               className="absolute right-3 top-1/2 -translate-y-1/2"
//             >
//               <X className="h-4 w-4 text-muted-foreground" />
//             </button>
//           )}
//         </div>

//         {/* Diet Filters - horizontal scroll on mobile */}
//         <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
//           <button
//             onClick={() => {
//               setShowVegOnly(!showVegOnly);
//               if (!showVegOnly) setShowNonVegOnly(false);
//             }}
//             className={cn(
//               "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
//               showVegOnly
//                 ? "bg-veg/15 text-veg ring-1 ring-veg/40 shadow-[0_0_12px_hsl(var(--veg)/0.2)]"
//                 : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
//             )}
//           >
//             <Leaf className="h-3.5 w-3.5" />
//             Veg
//           </button>
//           {restaurant.foodTypes?.includes('non-veg') && (
//             <button
//               onClick={() => {
//                 setShowNonVegOnly(!showNonVegOnly);
//                 if (!showNonVegOnly) setShowVegOnly(false);
//               }}
//               className={cn(
//                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
//                 showNonVegOnly
//                   ? "bg-non-veg/15 text-non-veg ring-1 ring-non-veg/40 shadow-[0_0_12px_hsl(var(--non-veg)/0.2)]"
//                   : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
//               )}
//             >
//               <Drumstick className="h-3.5 w-3.5" />
//               Non-Veg
//             </button>
//           )}
//           {restaurant.foodTypes?.includes('jain') && (
//             <button
//               onClick={() => setShowJainOnly(!showJainOnly)}
//               className={cn(
//                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
//                 showJainOnly
//                   ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
//                   : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
//               )}
//             >
//               <Sparkles className="h-3.5 w-3.5" />
//               Jain
//             </button>
//           )}
//           {restaurant.foodTypes?.includes('vegan') && (
//             <button
//               onClick={() => setShowVeganOnly(!showVeganOnly)}
//               className={cn(
//                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
//                 showVeganOnly
//                   ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
//                   : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
//               )}
//             >
//               <Salad className="h-3.5 w-3.5" />
//               Vegan
//             </button>
//           )}
//           {restaurant.foodTypes?.includes('half-jain') && (
//             <button
//               onClick={() => setShowHalfJainOnly(!showHalfJainOnly)}
//               className={cn(
//                 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200",
//                 showHalfJainOnly
//                   ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
//                   : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
//               )}
//             >
//               <CookingPot className="h-3.5 w-3.5" />
//               Half Jain
//             </button>
//           )}
//         </div>

//         {/* Tag Filter - compact icon toggle with multi-select */}
//         {uniqueTags.length > 0 && (
//           <div ref={tagFilterRef} className="mt-3 relative">
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setShowTagFilter(!showTagFilter)}
//                 aria-label="Filter by tags"
//                 aria-expanded={showTagFilter}
//                 className={cn(
//                   "relative inline-flex items-center gap-2 h-9 px-3 rounded-xl border transition-all duration-200",
//                   showTagFilter || selectedTags.size > 0
//                     ? "border-primary/40 bg-secondary text-foreground shadow-sm"
//                     : "border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
//                 )}
//               >
//                 <TagIcon className="h-4 w-4" />
//                 <span className="text-xs font-semibold">Tags</span>
//                 {selectedTags.size > 0 && (
//                   <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
//                     {selectedTags.size}
//                   </span>
//                 )}
//               </button>

//               {selectedTags.size > 0 && (
//                 <button
//                   onClick={() => setSelectedTags(new Set())}
//                   className="text-xs text-muted-foreground hover:text-foreground"
//                 >
//                   Clear
//                 </button>
//               )}
//             </div>

//             {showTagFilter && (
//               <div className="absolute right-0 top-full mt-2 z-30 w-full sm:w-[340px] rounded-xl border border-border/70 bg-card/95 backdrop-blur-md shadow-xl p-2.5">
//                 <div className="relative mb-2">
//                   <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
//                   <Input
//                     placeholder="Search tags..."
//                     value={tagSearchQuery}
//                     onChange={(e) => setTagSearchQuery(e.target.value)}
//                     className="h-8 pl-8 text-xs bg-secondary/50 border-border/50"
//                   />
//                 </div>

//                 <div className="max-h-56 overflow-y-auto pr-1 space-y-1">
//                   {visibleTags.length === 0 ? (
//                     <p className="text-xs text-muted-foreground py-2 px-1">No tags found</p>
//                   ) : (
//                     visibleTags.map(tag => {
//                       const isSelected = selectedTags.has(tag._id);

//                       return (
//                         <label
//                           key={tag._id}
//                           className={cn(
//                             "flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
//                             isSelected ? "bg-secondary" : "hover:bg-secondary/60"
//                           )}
//                         >
//                           <input
//                             type="checkbox"
//                             checked={isSelected}
//                             onChange={() => {
//                               const newSelected = new Set(selectedTags);
//                               if (isSelected) {
//                                 newSelected.delete(tag._id);
//                               } else {
//                                 newSelected.add(tag._id);
//                               }
//                               setSelectedTags(newSelected);
//                             }}
//                             className="sr-only"
//                           />

//                           <span
//                             className={cn(
//                               "h-4 w-4 rounded-md border flex items-center justify-center transition-colors",
//                               isSelected
//                                 ? "bg-primary border-primary text-primary-foreground"
//                                 : "bg-background border-border/70"
//                             )}
//                           >
//                             {isSelected && <Check className="h-3 w-3" />}
//                           </span>

//                           <span
//                             className="h-2.5 w-2.5 rounded-full flex-shrink-0"
//                             style={{ backgroundColor: tag.color }}
//                           />

//                           <span className="text-xs text-foreground truncate">{tag.name}</span>
//                         </label>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Main Category Tabs - card style */}
//         <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mt-2">
//           <button
//             onClick={() => {
//               setSelectedMainCategory(null);
//               setSelectedSubCategory(null);
//             }}
//             className={cn(
//               "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
//               !selectedMainCategory
//                 ? "bg-gradient-gold text-primary-foreground shadow-md"
//                 : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
//             )}
//           >
//             All
//           </button>
//           {mainCategories.map(cat => (
//             <button
//               key={cat._id}
//               onClick={() => {
//                 setSelectedMainCategory(cat._id);
//                 setSelectedSubCategory(null);
//               }}
//               className={cn(
//                 "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
//                 selectedMainCategory === cat._id
//                   ? "bg-gradient-gold text-primary-foreground shadow-md"
//                   : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
//               )}
//             >
//               {cat.image && (
//                 <img
//                   src={cat.image}
//                   alt={cat.name}
//                   className="w-6 h-6 rounded-lg object-cover"
//                 />
//               )}
//               {cat.name}
//             </button>
//           ))}
//         </div>

//         {/* Subcategory Pills - underline style */}
//         {selectedMainCategory && subCategories.length > 0 && (
//           <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide mt-2 border-t border-border/30 pt-2">
//             <button
//               onClick={() => setSelectedSubCategory(null)}
//               className={cn(
//                 "px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2",
//                 !selectedSubCategory
//                   ? "border-primary text-primary"
//                   : "border-transparent text-muted-foreground hover:text-foreground"
//               )}
//             >
//               All
//             </button>
//             {subCategories.map(cat => (
//               <button
//                 key={cat._id}
//                 onClick={() => setSelectedSubCategory(cat._id)}
//                 className={cn(
//                   "flex items-center gap-1.5 px-3 py-1 text-xs font-medium whitespace-nowrap transition-all duration-200 border-b-2",
//                   selectedSubCategory === cat._id
//                     ? "border-primary text-primary"
//                     : "border-transparent text-muted-foreground hover:text-foreground"
//                 )}
//               >
//                 {cat.image && (
//                   <img
//                     src={cat.image}
//                     alt={cat.name}
//                     className="w-4 h-4 rounded object-cover"
//                   />
//                 )}
//                 {cat.name}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Menu Items */}
//       <div className="px-4 py-6 space-y-8">
//         {groupedItems.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-muted-foreground">No items found</p>
//           </div>
//         ) : (
//           groupedItems.map(mainCat => {
//             // Find main category image from the original data
//             const mainCatData = mainCategories.find(c => c._id === mainCat._id);
//             return (
//             <div key={mainCat._id}>
//               {/* Main Category Header */}
//               <div className="flex items-center gap-3 mb-5 pb-2 border-b border-border/40">
//                 {mainCatData?.image && (
//                   <img 
//                     src={mainCatData.image} 
//                     alt={mainCat.name}
//                     className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20"
//                   />
//                 )}
//                 <div>
//                   <h2 className="font-display text-lg font-bold text-gradient-gold">
//                     {mainCat.name}
//                   </h2>
//                   <div className="h-0.5 w-8 bg-gradient-gold rounded-full mt-1" />
//                 </div>
//               </div>
              
//               {mainCat.subCategories.map(subCat => {
//                 const subCatData = subCategories.find(c => c._id === subCat._id);
//                 return (
//                 <div key={subCat._id} className="mb-6">
//                   {/* Subcategory Header */}
//                   <div className="flex items-center gap-2 mb-3 ml-1">
//                     {subCatData?.image && (
//                       <img 
//                         src={subCatData.image} 
//                         alt={subCat.name}
//                         className="w-6 h-6 rounded-md object-cover"
//                       />
//                     )}
//                     <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
//                       {subCat.name}
//                     </h3>
//                     <div className="flex-1 h-px bg-border/30 ml-2" />
//                   </div>
                  
//                   <div className="space-y-2">
//                     {subCat.items.map(item => (
//                       <div
//                         key={item._id}
//                         className="flex gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors cursor-pointer border border-border/30"
//                         onClick={() => setSelectedItem(item)}
//                       >
//                         {item.image && (
//                           <img
//                             src={item.image}
//                             alt={item.name}
//                             className="w-24 h-24 rounded-xl object-cover flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setLightboxImage(item.image!);
//                             }}
//                           />
//                         )}
//                         <div className="flex-1 min-w-0 flex flex-col gap-1">
//                           {/* Row 1: veg dot + name + price */}
//                           <div className="flex items-start justify-between gap-2">
//                             <div className="flex items-center gap-1.5 min-w-0">
//                               {item.isVeg ? (
//                                 <div className="p-0.5 border border-veg rounded flex-shrink-0">
//                                   <div className="w-1.5 h-1.5 bg-veg rounded-full" />
//                                 </div>
//                               ) : (
//                                 <div className="p-0.5 border border-non-veg rounded flex-shrink-0">
//                                   <div className="w-1.5 h-1.5 bg-non-veg rounded-full" />
//                                 </div>
//                               )}
//                               <h4 className="font-semibold text-sm leading-snug truncate">{item.name}</h4>
//                             </div>
//                             <span className="font-bold text-primary text-sm flex-shrink-0">
//                               ₹{item.price}
//                             </span>
//                           </div>

//                           {/* Row 2: badges (tags + dietary) */}
//                           {(item.tags?.length || item.isJain || item.isVegan || item.isHalfJain) ? (
//                             <div className="flex flex-wrap gap-1">
//                               {item.tags?.map(tag => (
//                                 <span
//                                   key={tag._id}
//                                   className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
//                                   style={{ backgroundColor: tag.color }}
//                                 >
//                                   {tag.name}
//                                 </span>
//                               ))}
//                               {item.isJain && (
//                                 <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 rounded-full">
//                                   JAIN
//                                 </span>
//                               )}
//                               {item.isVegan && (
//                                 <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full">
//                                   VEGAN
//                                 </span>
//                               )}
//                               {item.isHalfJain && (
//                                 <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-500/15 text-orange-400 rounded-full">
//                                   HALF JAIN
//                                 </span>
//                               )}
//                             </div>
//                           ) : null}

//                           {/* Row 3: description */}
//                           {item.description && (
//                             <div>
//                               <p className={cn(
//                                 "text-xs text-muted-foreground leading-relaxed",
//                                 !expandedDescriptions.has(item._id) && "line-clamp-2"
//                               )}>
//                                 {item.description}
//                               </p>
//                               {item.description.length > 80 && (
//                                 <button
//                                   onClick={(e) => { e.stopPropagation(); toggleDescription(item._id); }}
//                                   className="text-xs text-primary font-medium mt-0.5"
//                                 >
//                                   {expandedDescriptions.has(item._id) ? 'Show less' : 'Read more'}
//                                 </button>
//                               )}
//                             </div>
//                           )}

//                           {/* Row 4: add-ons */}
//                           {item.effectiveAddOns && item.effectiveAddOns.length > 0 && (
//                             <div className="flex flex-wrap gap-1 mt-auto pt-1">
//                               {item.effectiveAddOns.map(addOn => (
//                                 <span
//                                   key={addOn._id}
//                                   className="px-2 py-0.5 text-[10px] font-medium bg-secondary/60 text-muted-foreground rounded-full border border-border/50"
//                                 >
//                                   +{addOn.name} ₹{addOn.price}
//                                 </span>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               );
//               })}
//             </div>
//           );
//           })
//         )}
//       </div>

//       {/* Powered By Footer */}
//       <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3">
//         <p className="text-center text-xs text-muted-foreground">
//           Powered by <span className="text-gradient-gold font-semibold">oneQr</span>
//         </p>
//       </div>

//       {/* Item Details Drawer */}
//       <Drawer
//         open={!!selectedItem}
//         onOpenChange={(open) => {
//           if (!open) setSelectedItem(null);
//         }}
//       >
//         <DrawerContent className="max-h-[88vh]">
//           {selectedItem && (
//             <div className="relative overflow-y-auto pb-6">
//               <DrawerTitle className="sr-only">{selectedItem.name} details</DrawerTitle>

//               {/* Extra top tap area to close quickly */}
//               <DrawerClose asChild>
//                 <button className="w-full h-3" aria-label="Close" />
//               </DrawerClose>

//               {selectedItem.image && (
//                 <img
//                   src={selectedItem.image}
//                   alt={selectedItem.name}
//                   className="w-full h-52 object-cover"
//                   onClick={() => setLightboxImage(selectedItem.image!)}
//                 />
//               )}

//               <div className="px-4 pt-4 space-y-4">
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="space-y-2">
//                     <h3 className="text-lg font-bold leading-tight">{selectedItem.name}</h3>
//                     <div className="flex items-center gap-2 flex-wrap">
//                       {selectedItem.isVeg ? (
//                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-veg/15 text-veg border border-veg/40">
//                           <span className="h-1.5 w-1.5 rounded-full bg-veg" />
//                           VEG
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-non-veg/15 text-non-veg border border-non-veg/40">
//                           <span className="h-1.5 w-1.5 rounded-full bg-non-veg" />
//                           NON-VEG
//                         </span>
//                       )}
//                       {selectedItem.isJain && (
//                         <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-full">JAIN</span>
//                       )}
//                       {selectedItem.isVegan && (
//                         <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full">VEGAN</span>
//                       )}
//                       {selectedItem.isHalfJain && (
//                         <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/15 text-orange-400 rounded-full">HALF JAIN</span>
//                       )}
//                       {selectedItem.tags?.map(tag => (
//                         <span
//                           key={tag._id}
//                           className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full"
//                           style={{ backgroundColor: tag.color }}
//                         >
//                           {tag.name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                   <span className="text-xl font-bold text-primary whitespace-nowrap">₹{selectedItem.price}</span>
//                 </div>

//                 {selectedItem.description && (
//                   <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
//                     <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
//                   </div>
//                 )}

//                 {selectedItem.effectiveAddOns && selectedItem.effectiveAddOns.length > 0 && (
//                   <div>
//                     <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Available Add-ons</h4>
//                     <div className="space-y-2">
//                       {selectedItem.effectiveAddOns.map(addOn => (
//                         <div key={addOn._id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 px-3 py-2">
//                           <span className="text-sm">{addOn.name}</span>
//                           <span className="text-sm font-semibold text-primary">+₹{addOn.price}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </DrawerContent>
//       </Drawer>

//       {/* Fullscreen Image Lightbox */}
//       {lightboxImage && (
//         <div 
//           className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
//           onClick={() => setLightboxImage(null)}
//         >
//           <button
//             onClick={() => setLightboxImage(null)}
//             className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
//           >
//             <X className="h-6 w-6" />
//           </button>
//           <img
//             src={lightboxImage}
//             alt="Full view"
//             className="max-w-full max-h-[85vh] object-contain rounded-lg"
//             onClick={(e) => e.stopPropagation()}
//           />
//         </div>
//       )}
//     </div>
//   );
// }



import { useEffect, useState, useMemo, useCallback, useRef, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { publicMenuApi, PublicMenuResponse, PublicMenuItem } from '@/lib/api';
import { demoMenuData } from '@/lib/demoData';
import { MapPin, Phone, Instagram, Leaf, Search, X, Sparkles, Salad, Drumstick, CookingPot, TagIcon, Check, SlidersHorizontal, UtensilsCrossed, Plus, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { getMenuThemePreset, hexToRgbTuple, normalizeMenuColor } from '@/lib/menuAppearance';

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

const normalizeImageUrl = (value?: string | null): string | undefined => {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
};

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategories, setSelectedMainCategories] = useState<Set<string>>(new Set());
  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<string>>(new Set());
  const [draftMainCategories, setDraftMainCategories] = useState<Set<string>>(new Set());
  const [draftSubCategories, setDraftSubCategories] = useState<Set<string>>(new Set());
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showNonVegOnly, setShowNonVegOnly] = useState(false);
  const [showJainOnly, setShowJainOnly] = useState(false);
  const [showVeganOnly, setShowVeganOnly] = useState(false);
  const [showHalfJainOnly, setShowHalfJainOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showDietFilter, setShowDietFilter] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [isFilterBarFixed, setIsFilterBarFixed] = useState(false);
  const [filterBarHeight, setFilterBarHeight] = useState(0);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showMenuOpenPopup, setShowMenuOpenPopup] = useState(false);
  const [menuOpenPopupConfig, setMenuOpenPopupConfig] = useState<{
    isEnabled?: boolean;
    title?: string;
    message?: string;
    buttonText?: string;
  } | null>(null);

    const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia('(pointer:coarse)').matches && window.innerWidth <= 1024);
    
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);  // true until the lightweight settings check completes
  const [isRedirectingToWhatsApp, setIsRedirectingToWhatsApp] = useState(false);
  const dietFilterRef = useRef<HTMLDivElement>(null);
  const tagFilterRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  const toggleDescription = useCallback((itemId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!showTagFilter && !showDietFilter) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node;
      const clickedInsideTagFilter = tagFilterRef.current?.contains(targetNode) ?? false;
      const clickedInsideDietFilter = dietFilterRef.current?.contains(targetNode) ?? false;

      if (!clickedInsideTagFilter) {
        setShowTagFilter(false);
      }

      if (!clickedInsideDietFilter) {
        setShowDietFilter(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTagFilter(false);
        setShowDietFilter(false);
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
  }, [showTagFilter, showDietFilter]);

  useEffect(() => {
    const updateFilterBarPosition = () => {
      const sentinel = filterSentinelRef.current;
      const filterBar = filterBarRef.current;
      if (!sentinel || !filterBar) return;

      setFilterBarHeight(filterBar.getBoundingClientRect().height);
      setIsFilterBarFixed(sentinel.getBoundingClientRect().top <= 0);
    };

    updateFilterBarPosition();
    window.addEventListener('scroll', updateFilterBarPosition, { passive: true });
    window.addEventListener('resize', updateFilterBarPosition);

    return () => {
      window.removeEventListener('scroll', updateFilterBarPosition);
      window.removeEventListener('resize', updateFilterBarPosition);
    };
  }, [menuData]);

  useEffect(() => {
    const checkAndLoad = async () => {
      if (!slug) return;

      // Demo mode
      if (slug === 'demo') {
        setIsCheckingSettings(false);
        setMenuData(demoMenuData);
        setIsLoading(false);
        return;
      }

      // Step 1: Fetch lightweight settings first.
      // Fast (no menu data) — tells us immediately whether to
      // redirect to WhatsApp or load the menu. Shows a simple
      // spinner during this check instead of the full skeleton.
      try {
        const settings = await publicMenuApi.getSettings(slug);
        setMenuOpenPopupConfig(settings.menuOpenPopup || null);

        if (settings.menuOpenPopup?.isEnabled && settings.menuOpenPopup?.message?.trim()) {
          setShowMenuOpenPopup(true);
        }

        if (settings.whatsappEnabled && settings.redirectUrl) {
          setIsRedirectingToWhatsApp(true);
          window.location.replace(settings.redirectUrl);
          return;
        }
      } catch (err) {
        // Settings fetch failed — fall through and try to load menu anyway
        console.error('Settings check failed:', err);
      } finally {
        setIsCheckingSettings(false);
      }

      // Step 2: WhatsApp not enabled — load the full menu.
      const source = new URLSearchParams(window.location.search).get('source') || undefined;
      try {
        const data = await publicMenuApi.getBySlug(slug, source);
        setMenuData(data);
      } catch (err) {
        console.error('Failed to load menu:', err);
        setError('Menu not found or unavailable');
      } finally {
        setIsLoading(false);
      }
    };

    checkAndLoad();
  }, [slug]);

  useEffect(() => {
    if (menuOpenPopupConfig) return;

    const popup = menuData?.restaurant?.menuOpenPopup;
    if (popup?.isEnabled && popup?.message?.trim()) {
      setShowMenuOpenPopup(true);
      return;
    }

    setShowMenuOpenPopup(false);
  }, [menuData, menuOpenPopupConfig]);
  

  // Build normalized category maps from menu items.
  // Using the latest item data prevents stale image URLs from sticking around in the UI.
  const mainCategoryById = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; order: number; image?: string; isCurrentlyAvailable: boolean; forceNoImage: boolean }>();

    menuData?.menu?.forEach(item => {
      const normalizedImage = normalizeImageUrl(item.mainCategory.image);
      const existing = map.get(item.mainCategory._id);

      if (!existing) {
        map.set(item.mainCategory._id, {
          _id: item.mainCategory._id,
          name: item.mainCategory.name,
          order: item.mainCategory.order || 0,
          image: normalizedImage,
          isCurrentlyAvailable: item.mainCategory.isCurrentlyAvailable !== false,
          forceNoImage: !normalizedImage,
        });
        return;
      }

      existing.name = item.mainCategory.name;
      existing.order = item.mainCategory.order || 0;
      existing.isCurrentlyAvailable = existing.isCurrentlyAvailable && item.mainCategory.isCurrentlyAvailable !== false;

      if (!normalizedImage) {
        existing.image = undefined;
        existing.forceNoImage = true;
      } else if (!existing.forceNoImage) {
        existing.image = normalizedImage;
      }
    });

    const normalizedMap = new Map<string, { _id: string; name: string; order: number; image?: string; isCurrentlyAvailable: boolean }>();
    map.forEach((value, key) => {
      normalizedMap.set(key, {
        _id: value._id,
        name: value.name,
        order: value.order,
        image: value.image,
        isCurrentlyAvailable: value.isCurrentlyAvailable,
      });
    });

    return normalizedMap;
  }, [menuData]);

  const subCategoryById = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; order: number; image?: string; mainCategoryId: string; isCurrentlyAvailable: boolean; forceNoImage: boolean }>();

    menuData?.menu?.forEach(item => {
      const normalizedImage = normalizeImageUrl(item.category.image);
      const existing = map.get(item.category._id);

      if (!existing) {
        map.set(item.category._id, {
          _id: item.category._id,
          name: item.category.name,
          order: item.category.order || 0,
          image: normalizedImage,
          mainCategoryId: item.mainCategory._id,
          isCurrentlyAvailable: item.category.isCurrentlyAvailable !== false,
          forceNoImage: !normalizedImage,
        });
        return;
      }

      existing.name = item.category.name;
      existing.order = item.category.order || 0;
      existing.mainCategoryId = item.mainCategory._id;
      existing.isCurrentlyAvailable = existing.isCurrentlyAvailable && item.category.isCurrentlyAvailable !== false;

      if (!normalizedImage) {
        existing.image = undefined;
        existing.forceNoImage = true;
      } else if (!existing.forceNoImage) {
        existing.image = normalizedImage;
      }
    });

    const normalizedMap = new Map<string, { _id: string; name: string; order: number; image?: string; mainCategoryId: string; isCurrentlyAvailable: boolean }>();
    map.forEach((value, key) => {
      normalizedMap.set(key, {
        _id: value._id,
        name: value.name,
        order: value.order,
        image: value.image,
        mainCategoryId: value.mainCategoryId,
        isCurrentlyAvailable: value.isCurrentlyAvailable,
      });
    });

    return normalizedMap;
  }, [menuData]);

  const mainCategories = useMemo(() => {
    return Array.from(mainCategoryById.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [mainCategoryById]);

  const mainCategoryItemCounts = useMemo(() => {
    const counts = new Map<string, number>();

    menuData?.menu?.forEach(item => {
      counts.set(item.mainCategory._id, (counts.get(item.mainCategory._id) || 0) + 1);
    });

    return counts;
  }, [menuData]);

  const subCategoryItemCounts = useMemo(() => {
    const counts = new Map<string, number>();

    menuData?.menu?.forEach(item => {
      counts.set(item.category._id, (counts.get(item.category._id) || 0) + 1);
    });

    return counts;
  }, [menuData]);

  const totalMenuItemCount = menuData?.menu?.length || 0;

  const selectedMainCategoryLabels = useMemo(
    () => Array.from(selectedMainCategories).map(id => ({ id, label: mainCategoryById.get(id)?.name ?? id })),
    [mainCategoryById, selectedMainCategories]
  );

  const selectedSubCategoryLabels = useMemo(
    () => Array.from(selectedSubCategories).map(id => ({ id, label: subCategoryById.get(id)?.name ?? id })),
    [selectedSubCategories, subCategoryById]
  );

  const activeCategoryCount = selectedMainCategories.size + selectedSubCategories.size;

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

const hasActiveDietFilters = showVegOnly || showNonVegOnly || showJainOnly || showVeganOnly || showHalfJainOnly;

  const openCategoryDrawer = useCallback(() => {
    setDraftMainCategories(new Set(selectedMainCategories));
    setDraftSubCategories(new Set(selectedSubCategories));

    const firstSelectedMain = Array.from(selectedMainCategories)[0];
    const firstSelectedSub = Array.from(selectedSubCategories)[0];
    const expandedFromSelection = firstSelectedMain || (firstSelectedSub ? subCategoryById.get(firstSelectedSub)?.mainCategoryId ?? null : null);

    setExpandedCategoryId(expandedFromSelection ?? null);
    setIsCategoryDrawerOpen(true);
  }, [mainCategories, selectedMainCategories, selectedSubCategories, subCategoryById]);

const clearDietFilters = useCallback(() => {
  setShowVegOnly(false);
  setShowNonVegOnly(false);
  setShowJainOnly(false);
  setShowVeganOnly(false);
  setShowHalfJainOnly(false);
}, []);



  // Filter and group items
  const groupedItems = useMemo((): GroupedMainCategory[] => {
    if (!menuData?.menu) return [];

    // Filter items based on search, category, subcategory, veg, jain, vegan, and availability filters
const filteredItems = menuData.menu.filter(item => {
  const matchesSearch =
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesCategory =
    (selectedMainCategories.size === 0 && selectedSubCategories.size === 0) ||
    selectedMainCategories.has(item.mainCategory._id) ||
    selectedSubCategories.has(item.category._id);

  const matchesVeg = !showVegOnly || item.isVeg;
  const matchesNonVeg = !showNonVegOnly || !item.isVeg;
  const matchesJain = !showJainOnly || item.isJain;
  const matchesVegan = !showVeganOnly || item.isVegan;
  const matchesHalfJain = !showHalfJainOnly || item.isHalfJain;
  const matchesTag = selectedTags.size === 0 || item.tags?.some(t => selectedTags.has(t._id));

  return (
    matchesSearch &&
    matchesCategory &&
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
  }, [menuData, searchQuery, selectedMainCategories, selectedSubCategories, showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly, showHalfJainOnly, selectedTags]);

  	
  // Show a clean screen while the browser navigates to WhatsApp.
  // This prevents the skeleton or "Menu Unavailable" from flashing.
  if (isRedirectingToWhatsApp) {
    return (
      // <div className="min-h-screen flex items-center justify-center bg-background p-4">
      //   <div className="text-center space-y-3">
      //     <div className="text-4xl">💬</div>
      //     <h1 className="font-display text-xl font-bold">Redirecting to WhatsApp…</h1>
      //     <p className="text-muted-foreground text-sm">You'll be connected with the restaurant shortly.</p>
      //   </div>
      // </div>
      <></>
    );
  }  

  // While checking settings — show a minimal centered spinner.
  // This replaces the full skeleton during the fast settings fetch.
  if (isCheckingSettings || isRedirectingToWhatsApp) {
    return (
      <div className="min-h-screen bg-[#fff8f4] flex items-center justify-center">
        {/* <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /> */}
      </div>
      // <></>
    );
  }

  if (isLoading) {
         if (isMobileDevice) {
       return <div className="min-h-screen bg-[#fff8f4]" />; // blank, no flash
     }
    return (
      <div className="min-h-screen bg-[#fff8f4] pb-24">
        {/* Header Skeleton */}
        <div className="relative">
          <Skeleton className="h-56 w-full rounded-[28px] bg-[#f6e5d7]" />
          <div className="px-4 -mt-16 relative z-10">
            <div className="flex items-end gap-4 mb-4">
              <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0 bg-[#fffdfb]" />
              <div className="flex-1 pb-1 space-y-2">
                <Skeleton className="h-7 w-48 bg-[#f0e0d1]" />
                <Skeleton className="h-4 w-64 bg-[#f0e0d1]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-4 w-32 bg-[#f0e0d1]" />
              <Skeleton className="h-4 w-24 bg-[#f0e0d1]" />
            </div>
          </div>
        </div>

        {/* Search & Filter Skeleton */}
        <div className="mt-6 rounded-[28px] border border-[#f0e0d1] bg-white/80 px-4 py-4 shadow-[0_18px_50px_rgba(34,26,17,0.06)]">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 flex-1 rounded-full bg-[#f0e0d1]" />
            <Skeleton className="h-10 w-16 rounded-full bg-[#f0e0d1]" />
            <Skeleton className="h-10 w-24 rounded-full bg-[#f0e0d1]" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-8 w-20 rounded-full bg-[#f0e0d1]" />
            ))}
          </div>
        </div>

        {/* Menu Items Skeleton */}
        <div className="px-4 py-6 space-y-8">
          {[1, 2].map(section => (
            <div key={section}>
              <Skeleton className="h-6 w-36 mb-4 bg-[#f0e0d1]" />
              <Skeleton className="h-4 w-24 mb-3 bg-[#f0e0d1]" />
              <div className="space-y-3">
                {[1, 2, 3].map(item => (
                  <div key={item} className="flex gap-4 rounded-[22px] border border-[#f0e0d1] bg-white p-4 shadow-[0_16px_36px_rgba(34,26,17,0.06)]">
                    <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0 bg-[#f0e0d1]" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4 bg-[#f0e0d1]" />
                      <Skeleton className="h-4 w-full bg-[#f0e0d1]" />
                      <Skeleton className="h-4 w-1/2 bg-[#f0e0d1]" />
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
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f4] p-4">
        <div className="text-center">
          <h1 className="font-display mb-2 text-2xl font-semibold text-[#221a11]">Menu Unavailable</h1>
          <p className="text-sm text-[#534433]">{error || 'This menu could not be found.'}</p>
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

  const popupTitle = menuOpenPopupConfig?.title?.trim() || menuData?.restaurant?.menuOpenPopup?.title?.trim() || 'NOTE';
  const popupMessage = menuOpenPopupConfig?.message?.trim() || menuData?.restaurant?.menuOpenPopup?.message?.trim() || '';
  const popupButtonText = menuOpenPopupConfig?.buttonText?.trim() || menuData?.restaurant?.menuOpenPopup?.buttonText?.trim() || 'Continue';
  const themePreset = getMenuThemePreset(restaurant.menuAppearance?.theme);
  const menuPrimaryColor = normalizeMenuColor(restaurant.menuAppearance?.primaryColor);
  const menuSurfaceRgb = hexToRgbTuple(themePreset.colors.surface).join(', ');
  const menuPrimaryRgb = menuPrimaryColor ? hexToRgbTuple(menuPrimaryColor).join(', ') : '';
  const menuThemeStyle = {
    '--menu-bg': themePreset.colors.bg,
    '--menu-surface': themePreset.colors.surface,
    '--menu-soft': themePreset.colors.soft,
    '--menu-border': themePreset.colors.border,
    '--menu-text': themePreset.colors.text,
    '--menu-muted': themePreset.colors.muted,
    '--menu-primary': menuPrimaryColor,
    '--menu-primary-rgb': menuPrimaryRgb,
    '--menu-surface-rgb': menuSurfaceRgb,
  } as CSSProperties;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--menu-bg)] text-[var(--menu-text)]" style={menuThemeStyle}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[var(--menu-primary)]/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-96 w-96 rounded-full bg-[var(--menu-primary)]/8 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--menu-bg)] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-40 pt-3 sm:px-6 sm:pt-5 lg:px-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--menu-border)] bg-[var(--menu-surface)] shadow-[0_16px_36px_rgba(34,26,17,0.08)]">
        {restaurant.banner && (
          <div className="relative h-36 w-full overflow-hidden sm:h-52">
            <img
              src={restaurant.banner}
              alt={`${restaurant.name} banner`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 28%, rgba(var(--menu-surface-rgb),0.35) 58%, rgba(var(--menu-surface-rgb),0.98) 100%)',
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-28"
              style={{
                background:
                  'linear-gradient(to top, rgba(var(--menu-surface-rgb),1) 0%, rgba(var(--menu-surface-rgb),0.78) 30%, rgba(var(--menu-surface-rgb),0.26) 58%, rgba(var(--menu-surface-rgb),0) 100%)',
              }}
            />
          </div>
        )}

        <div className={cn("relative z-10 px-3.5 pb-3.5 pt-3.5 sm:px-5 sm:pb-5", restaurant.banner ? "-mt-20 sm:-mt-24" : "pt-4")}> 
          <div className="relative flex items-end gap-3 sm:gap-4">
            {restaurant.banner && (
              <div
                className="pointer-events-none absolute -inset-x-2 bottom-[-0.8rem] top-[68%] rounded-2xl bg-[var(--menu-surface)]/68 sm:-inset-x-3 sm:bottom-[-1rem] sm:top-[66%]"
                style={{
                  background:
                    'linear-gradient(to right, rgba(var(--menu-surface-rgb),0.72) 0%, rgba(var(--menu-surface-rgb),0.58) 58%, rgba(var(--menu-surface-rgb),0.10) 100%)',
                }}
              />
            )}
            {restaurant.logo && (
              <button
                type="button"
                onClick={() => setLightboxImage(restaurant.logo!)}
                className="group relative z-10 h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-[3px] border-[var(--menu-surface)] bg-white shadow-[0_12px_24px_rgba(34,26,17,0.14)] ring-1 ring-[var(--menu-border)] transition-transform active:scale-95 sm:h-20 sm:w-20"
                aria-label={`${restaurant.name} logo`}
                title={`${restaurant.name} logo`}
              >
                <img
                  src={restaurant.logo}
                  alt={`${restaurant.name} logo`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </button>
            )}
            <div className="relative z-10 min-w-0 flex-1 pb-0.5">
              {/* <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#855300] sm:text-[11px]">Menu</p> */}
              <h1 className="max-w-full break-words bg-gradient-to-r from-[var(--menu-text)] via-[var(--menu-primary)] to-[var(--menu-primary)] bg-clip-text font-display text-[1.5rem] font-bold leading-[1.05] text-transparent sm:text-[2.05rem]">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="mt-1.5 line-clamp-2 max-w-2xl text-xs leading-4 text-[var(--menu-muted)] sm:text-sm sm:leading-5">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3.5 grid gap-2 text-sm text-[var(--menu-muted)] sm:mt-5">
              {restaurant.address && (
              <div className="flex items-start gap-2 rounded-xl border border-[var(--menu-border)] bg-[var(--menu-soft)] px-2.5 py-2 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] sm:text-sm">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--menu-surface)] text-[var(--menu-primary)] shadow-sm ring-1 ring-[var(--menu-border)]">
                  <MapPin className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("block touch-manipulation pt-0.5 leading-4 transition-colors hover:text-[var(--menu-primary)] sm:leading-5", !addressExpanded && restaurant.address.length > 48 && "line-clamp-1")}
                    >
                      {restaurant.address}
                    </a>
                  ) : (
                    <span className={cn("block pt-0.5 leading-4 sm:leading-5", !addressExpanded && restaurant.address.length > 48 && "line-clamp-1")}>
                      {restaurant.address}
                    </span>
                  )}
                </div>
                {restaurant.address.length > 48 && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddressExpanded(!addressExpanded); }}
                    className="flex-shrink-0 whitespace-nowrap rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--menu-primary)] shadow-sm transition-colors hover:bg-[var(--menu-soft)]"
                    type="button"
                  >
                    {addressExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
              <div className="grid grid-cols-2 gap-2">
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex min-h-9 min-w-0 items-center gap-1.5 rounded-xl border border-[var(--menu-border)] bg-[var(--menu-surface)] px-2 py-1.5 text-xs text-[var(--menu-text)] shadow-sm transition-colors hover:border-[var(--menu-primary)] hover:text-[var(--menu-primary)] touch-manipulation"
                  aria-label={`Call ${restaurant.name} at ${restaurant.phone}`}
                  title={`Call ${restaurant.phone}`}
                >
                  <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--menu-soft)] text-[var(--menu-primary)]">
                    <Phone className="h-3 w-3" />
                  </span>
                  <span className="truncate">{restaurant.phone}</span>
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 min-w-0 items-center gap-1.5 rounded-xl border border-[var(--menu-border)] bg-[var(--menu-surface)] px-2 py-1.5 text-xs text-[var(--menu-text)] shadow-sm transition-colors hover:border-[var(--menu-primary)] hover:text-[var(--menu-primary)] touch-manipulation"
                  aria-label={`Open ${restaurant.name} Instagram`}
                  title="Instagram"
                >
                  <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--menu-soft)] text-[var(--menu-primary)]">
                    <Instagram className="h-3 w-3" />
                  </span>
                  <span className="truncate">Instagram</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div ref={filterSentinelRef} className="h-px" />
      {isFilterBarFixed && <div style={{ height: filterBarHeight }} />}
      <div
        ref={filterBarRef}
        className={cn(
          "z-40 mt-6 rounded-[28px] border border-[var(--menu-border)] bg-[var(--menu-bg)]/95 px-4 py-3 shadow-[0_18px_50px_rgba(34,26,17,0.08)] backdrop-blur-xl sm:px-6",
          isFilterBarFixed
            ? "fixed inset-x-0 top-0 mx-auto mt-0 max-w-6xl rounded-t-none sm:top-3 sm:rounded-t-[28px]"
            : "relative"
        )}
      >
        {/* Search with inline filters */}
        <div className="relative mb-3 flex items-center gap-2.5">
          <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#867461]" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 flex-1 rounded-full border-[var(--menu-border)] bg-[var(--menu-surface)] pl-9 pr-8 text-xs text-[var(--menu-text)] shadow-[0_10px_26px_rgba(34,26,17,0.04)] placeholder:text-[var(--menu-muted)] focus-visible:border-[var(--menu-primary)] focus-visible:ring-[var(--menu-primary)]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--menu-muted)] transition-colors hover:bg-[var(--menu-soft)] hover:text-[var(--menu-text)]"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Filter buttons inline on right */}
          <div className="flex items-center gap-2">
            {/* Diet Filter */}
            <div ref={dietFilterRef} className="relative">
              <button
                onClick={() => setShowDietFilter(!showDietFilter)}
                aria-label="Filter by diet"
                aria-expanded={showDietFilter}
                className={cn(
                  "relative inline-flex h-8 items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold transition-all duration-200",
                  showDietFilter || hasActiveDietFilters
                    ? "border-[var(--menu-primary)]/30 bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_12px_24px_rgba(34,26,17,0.08)]"
                    : "border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-muted)] hover:border-[var(--menu-primary)]/30 hover:text-[var(--menu-text)]"
                )}
              >
                <SlidersHorizontal className="h-3 w-3 text-[var(--menu-primary)]" />
                {hasActiveDietFilters && (
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--menu-primary)] text-[8px] font-bold leading-none text-white">
                    {[showVegOnly, showNonVegOnly, showJainOnly, showVeganOnly, showHalfJainOnly].filter(Boolean).length}
                  </span>
                )}
              </button>

              {showDietFilter && (
                <div className="absolute right-0 top-full z-30 mt-2 w-[200px] space-y-0.5 rounded-lg border border-[var(--menu-border)] bg-[var(--menu-surface)] p-1.5 shadow-[0_12px_30px_rgba(34,26,17,0.10)] backdrop-blur-sm sm:w-[220px]">
                  <button
                    onClick={() => {
                      setShowVegOnly(!showVegOnly);
                      if (!showVegOnly) setShowNonVegOnly(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      showVegOnly ? "bg-[var(--menu-soft)] text-[var(--menu-text)]" : "text-[var(--menu-muted)] hover:bg-[var(--menu-soft)]"
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Leaf className="h-2.5 w-2.5" />
                      Veg
                    </span>
                    {showVegOnly && <Check className="h-3 w-3" />}
                  </button>

                  {restaurant.foodTypes?.includes('non-veg') && (
                    <button
                      onClick={() => {
                        setShowNonVegOnly(!showNonVegOnly);
                        if (!showNonVegOnly) setShowVegOnly(false);
                      }}
                      className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium transition-colors",
                          showNonVegOnly ? "bg-[var(--menu-soft)] text-[var(--menu-text)]" : "text-[var(--menu-muted)] hover:bg-[var(--menu-soft)]"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Drumstick className="h-2.5 w-2.5" />
                        Non-Veg
                      </span>
                      {showNonVegOnly && <Check className="h-3 w-3" />}
                    </button>
                  )}

                  {restaurant.foodTypes?.includes('jain') && (
                    <button
                      onClick={() => setShowJainOnly(!showJainOnly)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        showJainOnly ? "bg-[var(--menu-soft)] text-[var(--menu-text)]" : "text-[var(--menu-muted)] hover:bg-[var(--menu-soft)]"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        Jain
                      </span>
                      {showJainOnly && <Check className="h-3 w-3" />}
                    </button>
                  )}

                  {restaurant.foodTypes?.includes('vegan') && (
                    <button
                      onClick={() => setShowVeganOnly(!showVeganOnly)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        showVeganOnly ? "bg-[var(--menu-soft)] text-[var(--menu-text)]" : "text-[var(--menu-muted)] hover:bg-[var(--menu-soft)]"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Salad className="h-2.5 w-2.5" />
                        Vegan
                      </span>
                      {showVeganOnly && <Check className="h-3 w-3" />}
                    </button>
                  )}

                  {restaurant.foodTypes?.includes('half-jain') && (
                    <button
                      onClick={() => setShowHalfJainOnly(!showHalfJainOnly)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        showHalfJainOnly ? "bg-[var(--menu-soft)] text-[var(--menu-text)]" : "text-[var(--menu-muted)] hover:bg-[var(--menu-soft)]"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <CookingPot className="h-2.5 w-2.5" />
                        Half Jain
                      </span>
                      {showHalfJainOnly && <Check className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tag Filter */}
            {uniqueTags.length > 0 && (
              <div ref={tagFilterRef} className="relative">
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  aria-label="Filter by tags"
                  aria-expanded={showTagFilter}
                  className={cn(
                    "relative inline-flex h-8 items-center justify-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold transition-all duration-200",
                    showTagFilter || selectedTags.size > 0
                      ? "border-[var(--menu-primary)]/30 bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_12px_24px_rgba(34,26,17,0.08)]"
                      : "border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-muted)] hover:border-[var(--menu-primary)]/30 hover:text-[var(--menu-text)]"
                  )}
                >
                  <TagIcon className="h-3 w-3" />
                  {selectedTags.size > 0 && (
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--menu-primary)] text-[8px] font-bold leading-none text-white">
                      {selectedTags.size}
                    </span>
                  )}
                </button>

                {showTagFilter && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-[200px] rounded-lg border border-[var(--menu-border)] bg-[var(--menu-surface)] p-1.5 shadow-[0_12px_30px_rgba(34,26,17,0.10)] backdrop-blur-sm sm:w-[220px]">
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5">
                      {visibleTags.length === 0 ? (
                        <p className="px-1 py-2 text-xs text-[var(--menu-muted)]">No tags found</p>
                      ) : (
                        visibleTags.map(tag => {
                          const isSelected = selectedTags.has(tag._id);

                          return (
                            <label
                              key={tag._id}
                              className={cn(
                                "flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors",
                                isSelected ? "bg-[var(--menu-soft)]" : "hover:bg-[var(--menu-soft)]"
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
                                  "flex h-3 w-3 items-center justify-center rounded-md border transition-colors",
                                  isSelected
                                    ? "border-[var(--menu-primary)] bg-[var(--menu-primary)] text-white"
                                    : "border-[var(--menu-border)] bg-[var(--menu-surface)]"
                                )}
                              >
                                {isSelected && <Check className="h-2 w-2" />}
                              </span>

                              <span
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tag.color }}
                              />

                              <span className="truncate text-xs text-[var(--menu-muted)]">{tag.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      
      <div className="pointer-events-none fixed bottom-12 right-1 z-40 sm:right-6">
        <button
          type="button"
          onClick={() => {
            openCategoryDrawer();
          }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)]/95 px-4 py-3 text-sm font-semibold text-[var(--menu-text)] shadow-[0_18px_40px_rgba(34,26,17,0.18)] backdrop-blur-xl transition-transform active:scale-95"
          aria-label="Open menu categories"
        >
          <span className="flex h-6 w-8 items-center justify-center rounded-full bg-[var(--menu-primary)] text-white shadow-[0_10px_20px_rgba(34,26,17,0.16)]">
            <UtensilsCrossed className="h-4 w-4" />
          </span>
          <span>Menu</span>
          {activeCategoryCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--menu-primary)] px-1.5 text-[10px] font-bold leading-none text-white">
              {activeCategoryCount}
            </span>
          )}
        </button>
      </div>

      <Dialog
        open={isCategoryDrawerOpen}
        onOpenChange={(open) => {
          setIsCategoryDrawerOpen(open);
          if (!open) {
            setExpandedCategoryId(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2.5rem)] max-w-[348px] overflow-hidden border border-[var(--menu-border)] bg-[linear-gradient(180deg,rgba(255,251,245,0.99)_0%,rgba(255,255,255,0.98)_42%,rgba(247,241,233,0.98)_100%)] p-0 text-[var(--menu-text)] shadow-[0_22px_60px_rgba(34,26,17,0.18)] rounded-[28px] sm:max-w-[372px] sm:rounded-[30px]" style={menuThemeStyle}>
          <DialogTitle className="sr-only">Menu categories</DialogTitle>
          <div className="max-h-[64vh] overflow-y-auto px-2.5 pb-3 pt-2.5 sm:max-h-[66vh] sm:px-4">
            <div className="mb-3 flex justify-center">
              <div className="h-1 w-12 rounded-full bg-[var(--menu-primary)]/18" />
            </div>

            <div className="space-y-1.5">
              {mainCategories.map(cat => {
                const isExpanded = expandedCategoryId === cat._id;
                const subcategoryRows = Array.from(subCategoryById.values())
                  .filter(subCategory => subCategory.mainCategoryId === cat._id)
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                const categoryCount = mainCategoryItemCounts.get(cat._id) || 0;
                const hasSelectedMain = draftMainCategories.has(cat._id);
                const selectedSubCount = subcategoryRows.filter(subCategory => draftSubCategories.has(subCategory._id)).length;
                const hasSelectedCategory = hasSelectedMain || selectedSubCount > 0;

                return (
                  <div key={cat._id} className={cn(
                    "rounded-[24px] border border-[var(--menu-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(252,248,242,0.96)_100%)] p-1.5 shadow-[0_8px_18px_rgba(34,26,17,0.05)] transition-all duration-200",
                    hasSelectedCategory && "shadow-[0_12px_30px_rgba(34,26,17,0.08)]"
                  )}>
                    <button
                      type="button"
                      onClick={() => {
                        const isAlreadySelected = draftMainCategories.has(cat._id);

                        setDraftMainCategories(isAlreadySelected ? new Set() : new Set([cat._id]));
                        setSelectedMainCategories(isAlreadySelected ? new Set() : new Set([cat._id]));

                        setDraftSubCategories(new Set());
                        setSelectedSubCategories(new Set());

                        if (subcategoryRows.length > 0) {
                          setExpandedCategoryId(prev => (prev === cat._id ? null : cat._id));
                        }
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-[18px] px-2.5 py-2 text-left transition-all duration-200",
                        hasSelectedCategory
                          ? "bg-[linear-gradient(135deg,rgba(var(--menu-surface-rgb),0.98)_0%,rgba(255,245,232,0.98)_100%)] text-[var(--menu-text)] shadow-[0_10px_20px_rgba(34,26,17,0.05)]"
                          : "hover:bg-[var(--menu-soft)]/60"
                      )}
                      title={cat.isCurrentlyAvailable === false ? `${cat.name} is not available right now` : undefined}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          {cat.image && (
                            <img src={cat.image} alt={cat.name} className="h-8 w-8 flex-shrink-0 rounded-2xl object-cover ring-1 ring-[var(--menu-border)] transition-transform duration-200 group-hover:scale-[1.02]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[0.84rem] font-semibold tracking-[-0.01em]">{cat.name}</p>
                            <p className="text-[10px] text-[var(--menu-muted)]">{categoryCount} items</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cat.isCurrentlyAvailable === false && (
                          <span className="rounded-full bg-[#f8e3df] px-2 py-1 text-[10px] font-bold text-[#b34b39]">Unavailable</span>
                        )}
                        {subcategoryRows.length > 0 ? (
                            <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200", isExpanded ? "border-[var(--menu-primary)] bg-[var(--menu-primary)] text-white shadow-[0_10px_18px_rgba(34,26,17,0.12)]" : "border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-primary)]") }>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[var(--menu-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--menu-primary)]">Open</span>
                        )}
                      </div>
                    </button>

                    {subcategoryRows.length > 0 && (
                      <div
                        className={cn(
                          "grid overflow-hidden transition-all duration-300 ease-out",
                          isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                        )}
                      >
                        <div className="overflow-hidden">
                      <div className="space-y-1 rounded-[22px] bg-[linear-gradient(180deg,rgba(var(--menu-surface-rgb),0.72)_0%,rgba(var(--menu-soft),0.76)_100%)] p-1.5 backdrop-blur-sm">
                        {/* <button
                          type="button"
                          onClick={() => {
                            setDraftMainCategories(prev => {
                              const next = new Set(prev);
                              if (next.has(cat._id)) next.delete(cat._id);
                              else next.add(cat._id);
                              return next;
                            });
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[18px] border border-transparent px-3 py-2 text-left transition-all duration-200",
                            hasSelectedMain
                              ? "border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_8px_18px_rgba(34,26,17,0.05)]"
                              : "bg-[var(--menu-surface)]/70 text-[var(--menu-muted)] hover:border-[var(--menu-border)] hover:text-[var(--menu-text)]"
                          )}
                        >
                          <span className="text-[0.88rem] font-medium tracking-[-0.01em]">All in {cat.name}</span>
                          <span className="rounded-full bg-[var(--menu-soft)] px-2 py-1 text-[10px] font-bold text-[var(--menu-primary)]">{categoryCount}</span>
                        </button> */}

                        {subcategoryRows.map(subCat => {
                          const subCount = subCategoryItemCounts.get(subCat._id) || 0;
                          const isSelected = draftSubCategories.has(subCat._id);

                          return (
                            <button
                              key={subCat._id}
                              type="button"
                              onClick={() => {
                                const isAlreadySelected = draftSubCategories.has(subCat._id);

                                setDraftMainCategories(new Set());
                                setSelectedMainCategories(new Set());

                                setDraftSubCategories(isAlreadySelected ? new Set() : new Set([subCat._id]));
                                setSelectedSubCategories(isAlreadySelected ? new Set() : new Set([subCat._id]));

                                setIsCategoryDrawerOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between rounded-[16px] px-2.5 py-1.5 text-left transition-all duration-200",
                                isSelected
                                  ? "bg-[var(--menu-surface)] text-[var(--menu-text)] shadow-[0_10px_20px_rgba(34,26,17,0.08)]"
                                  : "bg-transparent text-[var(--menu-muted)] hover:bg-[var(--menu-surface)]/80 hover:text-[var(--menu-text)]"
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                {subCat.image && (
                                  <img src={subCat.image} alt={subCat.name} className="h-6 w-6 flex-shrink-0 rounded-xl object-cover ring-1 ring-[var(--menu-border)] transition-transform duration-200 group-hover:scale-[1.02]" />
                                )}
                                <span className="truncate text-[0.82rem] font-medium tracking-[-0.01em]">{subCat.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && (
                                  <span
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                                    style={{ border: '1px solid rgba(var(--menu-primary-rgb), 0.2)', backgroundColor: 'rgba(var(--menu-primary-rgb), 0.12)', color: 'var(--menu-primary)'}}
                                  >
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                                <span className="rounded-full bg-[var(--menu-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--menu-primary)]">{subCount}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* <div className="mt-4 rounded-[24px] border border-[var(--menu-border)] bg-[var(--menu-surface)]/90 p-3 shadow-[0_12px_30px_rgba(34,26,17,0.06)]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--menu-muted)]">Selected items</p>
                <span className="rounded-full bg-[var(--menu-soft)] px-2 py-1 text-[10px] font-bold text-[var(--menu-primary)]">
                  {draftMainCategories.size + draftSubCategories.size}
                </span>
              </div>

              {(draftMainCategories.size !== 0 || draftSubCategories.size !== 0) && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(draftMainCategories).map(id => (
                    <span key={id} className="rounded-full border border-[var(--menu-primary)]/25 bg-[var(--menu-soft)] px-3 py-1 text-xs font-semibold text-[var(--menu-primary)]">
                      {mainCategoryById.get(id)?.name ?? id}
                    </span>
                  ))}
                  {Array.from(draftSubCategories).map(id => (
                    <span key={id} className="rounded-full border border-[var(--menu-primary)]/25 bg-white px-3 py-1 text-xs font-semibold text-[var(--menu-text)] shadow-[0_6px_16px_rgba(34,26,17,0.05)]">
                      {subCategoryById.get(id)?.name ?? id}
                    </span>
                  ))}
                </div>
              )}
            </div> */}

            {/* <div className="sticky bottom-0 mt-4 border-t border-[var(--menu-border)] bg-[linear-gradient(180deg,rgba(255,251,245,0.65)_0%,rgba(255,251,245,0.98)_32%)] px-1 pt-4 pb-1 backdrop-blur-sm" /> */}

          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items */}
      <div className="space-y-10 pt-8">
        {groupedItems.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--menu-border)] bg-[var(--menu-surface)]/80 px-6 py-14 text-center shadow-[0_18px_50px_rgba(34,26,17,0.06)]">
            <p className="text-sm text-[var(--menu-muted)]">No items found</p>
          </div>
        ) : (
          groupedItems.map(mainCat => {
            const mainCatImage = mainCategoryById.get(mainCat._id)?.image;
            return (
            <div key={mainCat._id} className="scroll-mt-32">
              {/* Main Category Header */}
              <div className={cn("mb-5 flex items-center pb-3", mainCatImage ? "gap-3" : "gap-0")}> 
                {mainCatImage && (
                  <img 
                    src={mainCatImage} 
                    alt={mainCat.name}
                    className="h-12 w-12 rounded-2xl object-cover shadow-[0_12px_28px_rgba(34,26,17,0.10)] ring-1 ring-[var(--menu-border)]"
                  />
                )}
                <div>
                  {/* <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--menu-muted)]">
                    Section
                  </p> */}
                  <h2 className="font-display text-[1.5rem] font-semibold text-[var(--menu-text)] sm:text-[1.9rem]">
                    {mainCat.name}
                  </h2>
                  <div className="mt-2 h-px w-12 bg-[var(--menu-primary)]/40" />
                </div>
              </div>
              
              {mainCat.subCategories.map(subCat => {
                const subCatImage = subCategoryById.get(subCat._id)?.image;
                return (
                <div key={subCat._id} className="mb-6">
                  {/* Subcategory Header */}
                  <div className={cn("mb-3 flex items-center", subCatImage ? "gap-2" : "gap-0")}> 
                    {subCatImage && (
                      <img 
                        src={subCatImage} 
                        alt={subCat.name}
                        className="h-6 w-6 rounded-md object-cover ring-1 ring-[var(--menu-border)]"
                      />
                    )}
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--menu-muted)]">
                      {subCat.name}
                    </h3>
                    <div className="ml-2 h-px flex-1 bg-[var(--menu-border)]" />
                  </div>
                  
                  <div className="space-y-3">
                    {subCat.items.map(item => (
                      <div
                        key={item._id}
                        className={cn(
                          "flex cursor-pointer gap-4 rounded-[22px] border-b border-l border-r border-t-4 border-b-[var(--menu-border)] border-l-[var(--menu-border)] border-r-[var(--menu-border)] border-t-[var(--menu-primary)] p-4 transition-all duration-200",
                          item.isCurrentlyAvailable === false
                            ? "bg-[var(--menu-surface)]/60 opacity-75"
                            : "bg-[var(--menu-surface)] shadow-[0_16px_36px_rgba(34,26,17,0.06)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(34,26,17,0.10)]"
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-24 w-24 flex-shrink-0 cursor-pointer rounded-2xl object-cover transition-transform active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxImage(item.image!);
                            }}
                          />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {/* Row 1: veg dot + name + price */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {item.isVeg ? (
                                <div className="flex-shrink-0 rounded-full border border-[#2f7a34]/35 p-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-[#2f7a34]" />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 rounded-full border border-[#9c2f2f]/35 p-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-[#9c2f2f]" />
                                </div>
                              )}
                              <h4 className="truncate text-sm font-semibold leading-snug text-[var(--menu-text)]">{item.name}</h4>
                              {item.isCurrentlyAvailable === false && (
                                <span className="whitespace-nowrap rounded-full border border-[#b34b39]/25 bg-[#f8e3df] px-1.5 py-0.5 text-[9px] font-bold text-[#b34b39]">
                                  Not available now
                                </span>
                              )}
                            </div>
                            <span className="flex-shrink-0 rounded-full bg-[var(--menu-soft)] px-3 py-1 text-sm font-bold text-[var(--menu-primary)]">
                              ₹{item.price}
                            </span>
                          </div>

                          {/* Row 2: badges (tags + dietary) */}
                          {(item.tags?.length || item.isJain || item.isVegan || item.isHalfJain) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags?.map(tag => (
                                <span
                                  key={tag._id}
                                  className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {item.isJain && (
                                <span className="rounded-full bg-[#f4ead6] px-2 py-0.5 text-[9px] font-bold text-[#8b5b14]">
                                  JAIN
                                </span>
                              )}
                              {item.isVegan && (
                                <span className="rounded-full bg-[#e6f2e7] px-2 py-0.5 text-[9px] font-bold text-[#2f7a34]">
                                  VEGAN
                                </span>
                              )}
                              {item.isHalfJain && (
                                <span className="rounded-full bg-[#f7e3d3] px-2 py-0.5 text-[9px] font-bold text-[#b8671e]">
                                  HALF JAIN
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* Row 3: description */}
                          {item.description && (
                            <div>
                              <p className={cn(
                                "text-xs leading-relaxed text-[var(--menu-muted)]",
                                !expandedDescriptions.has(item._id) && "line-clamp-2"
                              )}>
                                {item.description}
                              </p>
                              {item.description.length > 80 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleDescription(item._id); }}
                                  className="mt-0.5 text-xs font-semibold text-[var(--menu-primary)]"
                                >
                                  {expandedDescriptions.has(item._id) ? 'Show less' : 'Read more'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Row 4: add-ons */}
                          {item.effectiveAddOns && item.effectiveAddOns.length > 0 && (
                            <div className="mt-auto flex flex-wrap gap-1 pt-1">
                              {item.effectiveAddOns.map(addOn => (
                                <span
                                  key={addOn._id}
                                  className="rounded-full border border-[var(--menu-border)] bg-[var(--menu-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--menu-muted)]"
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
      <div className="fixed inset-x-0 bottom-0 border-t border-[var(--menu-border)] bg-[var(--menu-surface)]/92 px-4 py-3 backdrop-blur-xl">
        <p className="text-center text-xs text-[var(--menu-muted)]">
          Powered by <span className="font-semibold text-[var(--menu-primary)]">oneQr</span>
        </p>
      </div>

      {/* Item Details Drawer */}
      <Drawer
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DrawerContent
          className="max-h-[88vh] rounded-t-[28px] border-t border-[var(--menu-border)] bg-[var(--menu-surface)] text-[var(--menu-text)]"
          style={menuThemeStyle}
        >
          {selectedItem && (
            <div className="relative overflow-y-auto pb-6">
              <DrawerTitle className="sr-only">{selectedItem.name} details</DrawerTitle>

              {/* Extra top tap area to close quickly */}
              <DrawerClose asChild>
                <button className="h-3 w-full" aria-label="Close" />
              </DrawerClose>

              {selectedItem.image && (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-56 w-full object-cover sm:h-64"
                  onClick={() => setLightboxImage(selectedItem.image!)}
                />
              )}

              <div className="space-y-5 px-4 pt-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--menu-muted)]">Item details</p>
                    <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--menu-text)]">{selectedItem.name}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedItem.isVeg ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#2f7a34]/25 bg-[#eaf6e5] px-2 py-0.5 text-[10px] font-bold text-[#2f7a34]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2f7a34]" />
                          VEG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#9c2f2f]/25 bg-[#f8e3df] px-2 py-0.5 text-[10px] font-bold text-[#9c2f2f]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#9c2f2f]" />
                          NON-VEG
                        </span>
                      )}
                      {selectedItem.isJain && (
                        <span className="rounded-full bg-[#f4ead6] px-2 py-0.5 text-[10px] font-bold text-[#8b5b14]">JAIN</span>
                      )}
                      {selectedItem.isVegan && (
                        <span className="rounded-full bg-[#e6f2e7] px-2 py-0.5 text-[10px] font-bold text-[#2f7a34]">VEGAN</span>
                      )}
                      {selectedItem.isHalfJain && (
                        <span className="rounded-full bg-[#f7e3d3] px-2 py-0.5 text-[10px] font-bold text-[#b8671e]">HALF JAIN</span>
                      )}
                      {selectedItem.tags?.map(tag => (
                        <span
                          key={tag._id}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {selectedItem.isCurrentlyAvailable === false && (
                        <span className="rounded-full border border-[#b34b39]/25 bg-[#f8e3df] px-2 py-0.5 text-[10px] font-bold text-[#b34b39]">
                          NOT AVAILABLE NOW
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-[var(--menu-primary)] px-4 py-2 text-xl font-bold text-white shadow-[0_14px_30px_rgba(34,26,17,0.18)]">₹{selectedItem.price}</span>
                </div>

                {selectedItem.description && (
                  <div className="rounded-[22px] border border-[var(--menu-border)] bg-[var(--menu-soft)] p-4">
                    <p className="text-sm leading-relaxed text-[var(--menu-muted)]">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.effectiveAddOns && selectedItem.effectiveAddOns.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--menu-muted)]">Available Add-ons</h4>
                    <div className="space-y-2">
                      {selectedItem.effectiveAddOns.map(addOn => (
                        <div key={addOn._id} className="flex items-center justify-between rounded-2xl border border-[var(--menu-border)] bg-[var(--menu-surface)] px-4 py-3 shadow-sm">
                          <span className="text-sm text-[var(--menu-text)]">{addOn.name}</span>
                          <span className="text-sm font-semibold text-[var(--menu-primary)]">+₹{addOn.price}</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#221a11]/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full view"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showMenuOpenPopup && popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#221a11]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#d9c3ad] bg-[#fffdfb] shadow-[0_30px_90px_rgba(34,26,17,0.22)]">
            <div className="bg-[#855300] px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.3em] text-white">
              {popupTitle}
            </div>
            <div className="px-6 py-7 sm:px-7">
              <p className="whitespace-pre-wrap text-[1.15rem] leading-[1.8] text-[#221a11]">{popupMessage}</p>
              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowMenuOpenPopup(false)}
                  className="rounded-full bg-[#855300] px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_30px_rgba(133,83,0,0.18)] transition-colors hover:bg-[#6d4200]"
                >
                  {popupButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}



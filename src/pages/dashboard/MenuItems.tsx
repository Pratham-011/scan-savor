import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { menuItemApi, mainCategoryApi, categoryApi, restaurantApi, defaultAvailability } from '@/lib/api';
import type { MenuItem, MainCategory, Category, CreateMenuItemData, Restaurant, Availability } from '@/lib/api';
import { Plus, Pencil, Trash2, UtensilsCrossed, Loader2, Search, Leaf, Drumstick, Sparkles, Salad, Clock, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import AvailabilityPicker from '@/components/AvailabilityPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const emptyForm: CreateMenuItemData = {
  mainCategory: '',
  category: '',
  name: '',
  description: '',
  price: '' as unknown as number,
  isVeg: true,
  isJain: false,
  isVegan: false,
  isHalfJain: false,
  availability: { type: 'always' },
  image: '',
};

function getShortAvailabilityLabel(a: Availability): string {
  if (a.type === 'always') return 'Always';
  if (a.type === 'daily') return `Daily ${a.startTime || ''}–${a.endTime || ''}`;
  if (a.type === 'once') return 'Date range';
  if (a.type === 'weekly') return 'Weekly';
  return 'Always';
}

// Sortable menu item card
function SortableMenuItem({ item, isAvailable, disabledReason, mainCat, subCat, onToggle, onEdit, onDelete }: {
  item: MenuItem;
  isAvailable: boolean;
  disabledReason: string;
  mainCat: MainCategory | undefined;
  subCat: Category | undefined;
  onToggle: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`glass rounded-xl overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}>
      {item.image && (
        <div className="aspect-video bg-secondary relative">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button {...attributes} {...listeners} className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {!item.image && (
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            {item.isVeg ? (
              <div className="p-1 border-2 border-green-500 rounded"><div className="w-2 h-2 bg-green-500 rounded-full" /></div>
            ) : (
              <div className="p-1 border-2 border-red-500 rounded"><div className="w-2 h-2 bg-red-500 rounded-full" /></div>
            )}
            <h3 className="font-semibold">{item.name}</h3>
          </div>
          <p className="font-bold text-primary">₹{item.price}</p>
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {mainCat && <Badge variant="secondary">{mainCat.name}</Badge>}
          {subCat && <Badge variant="outline">{subCat.name}</Badge>}
          {item.isJain && (
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30">Jain</Badge>
          )}
          {item.isVegan && (
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/30">Vegan</Badge>
          )}
          {item.isHalfJain && (
            <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30">Half Jain</Badge>
          )}
          {item.status && item.status !== 'Available' && (
            <Badge variant="destructive">{item.status}</Badge>
          )}
          {!isAvailable && (
            <Badge variant="destructive">{disabledReason}</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3" />
          <span>{getShortAvailabilityLabel(item.availability || defaultAvailability)}</span>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-border">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onToggle(item)} title={isAvailable ? 'Hide temporarily' : 'Make available'}>
              {item.availability?.isAvailable !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{item.name}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(item._id, item.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<CreateMenuItemData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFoodType, setFilterFoodType] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [filterSubCategory, setFilterSubCategory] = useState('all');

  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsData, mainCats, cats, restaurantData] = await Promise.all([
        menuItemApi.getAll(),
        mainCategoryApi.getAll(),
        categoryApi.getAll(),
        restaurantApi.get(),
      ]);
      setItems(itemsData);
      setMainCategories(mainCats);
      setCategories(cats);
      setRestaurant(restaurantData);
    } catch (error) {
      toast({ title: 'Failed to load menu items', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await menuItemApi.update(editingItem._id, formData);
        toast({ title: 'Item updated!' });
      } else {
        await menuItemApi.create(formData);
        toast({ title: 'Item created!' });
      }
      setDialogOpen(false);
      setEditingItem(null);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      toast({
        title: 'Failed to save item',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    const previousItems = items;
    setItems(prev => prev.filter(item => item._id !== id));
    try {
      await menuItemApi.delete(id);
      toast({ title: 'Item deleted!' });
    } catch (error) {
      setItems(previousItems);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    const currentlyAvailable = item.availability?.isAvailable !== false;
    const previousItems = items;
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, availability: { ...i.availability, isAvailable: !currentlyAvailable }, isCurrentlyAvailable: !currentlyAvailable, status: !currentlyAvailable ? 'Available' : 'Not Available' } : i));
    try {
      await menuItemApi.update(item._id, { availability: { ...item.availability, isAvailable: !currentlyAvailable } });
      toast({ title: currentlyAvailable ? 'Item hidden temporarily' : 'Item made available' });
    } catch (error) {
      setItems(previousItems);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...filteredItems].sort((a, b) => (a.order || 0) - (b.order || 0));
    const oldIndex = sorted.findIndex(i => i._id === active.id);
    const newIndex = sorted.findIndex(i => i._id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    const updated = reordered.map((item, i) => ({ ...item, order: i + 1 }));

    // Optimistic update
    setItems(prev => {
      const filteredIds = new Set(updated.map(i => i._id));
      const otherItems = prev.filter(i => !filteredIds.has(i._id));
      return [...otherItems, ...updated];
    });

    // Persist
    try {
      await Promise.all(updated.map(item => menuItemApi.update(item._id, { order: item.order } as any)));
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' });
      fetchData();
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      mainCategory: typeof item.mainCategory === 'string' ? item.mainCategory : item.mainCategory._id,
      category: typeof item.category === 'string' ? item.category : item.category._id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      isVeg: item.isVeg,
      isJain: item.isJain || false,
      isVegan: item.isVegan || false,
      isHalfJain: item.isHalfJain || false,
      availability: item.availability || defaultAvailability,
      image: item.image || '',
    });
    setDialogOpen(true);
  };

  const handleClearAll = async () => {
    try {
      await menuItemApi.clearAll();
      toast({ title: 'All menu items deleted!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete menu', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  // 🔥 O(1) lookup maps
  const mainCategoryMap = new Map(mainCategories.map(cat => [cat._id, cat]));
  const categoryMap = new Map(categories.map(cat => [cat._id, cat]));

  const getItemAvailability = (item: MenuItem) => {
    const mainCatId = typeof item.mainCategory === 'string' ? item.mainCategory : item.mainCategory._id;
    const subCatId = typeof item.category === 'string' ? item.category : item.category._id;
    const mainCat = mainCategoryMap.get(mainCatId);
    const subCat = categoryMap.get(subCatId);
    const isItemAvailable = item.isCurrentlyAvailable !== false;
    const isMainAvailable = mainCat?.isCurrentlyAvailable !== false;
    const isSubAvailable = subCat?.isCurrentlyAvailable !== false;
    const isAvailable = isItemAvailable && isMainAvailable && isSubAvailable;
    let disabledReason = '';
    if (!isMainAvailable) disabledReason = 'Main category unavailable';
    else if (!isSubAvailable) disabledReason = 'Subcategory unavailable';
    else if (!isItemAvailable) disabledReason = 'Item unavailable';
    return { isAvailable, disabledReason, mainCat, subCat };
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const itemMainCategoryId = typeof item.mainCategory === 'string' ? item.mainCategory : item.mainCategory._id;
    const itemCategoryId = typeof item.category === 'string' ? item.category : item.category._id;
    const matchesMainCategory = filterCategory === 'all' || itemMainCategoryId === filterCategory;
    const matchesSubCategory = filterSubCategory === 'all' || itemCategoryId === filterSubCategory;
    let matchesFoodType = true;
    if (filterFoodType === 'veg') matchesFoodType = item.isVeg;
    else if (filterFoodType === 'non-veg') matchesFoodType = !item.isVeg;
    else if (filterFoodType === 'jain') matchesFoodType = item.isJain || false;
    else if (filterFoodType === 'vegan') matchesFoodType = item.isVegan || false;
    else if (filterFoodType === 'half-jain') matchesFoodType = item.isHalfJain || false;
    let matchesAvailability = true;
    if (filterAvailability === 'available') matchesAvailability = item.isCurrentlyAvailable !== false;
    else if (filterAvailability === 'unavailable') matchesAvailability = item.isCurrentlyAvailable === false;
    return matchesSearch && matchesMainCategory && matchesSubCategory && matchesFoodType && matchesAvailability;
  }).sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const availableSubCategories = categories.filter(c => c.mainCategory._id === formData.mainCategory);
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1 sm:max-w-sm rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 p-4 glass rounded-xl">
              <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-12 self-start" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
           {items.length} items • {items.filter(item => getItemAvailability(item).isAvailable).length} available
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Menu Items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {items.length} menu items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-dialog-description">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
              <DialogDescription id="menu-item-dialog-description">
                Fill in the details below to {editingItem ? 'update' : 'create'} a menu item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main Category</Label>
                  <Select value={formData.mainCategory} onValueChange={(v) => setFormData(prev => ({ ...prev, mainCategory: v, category: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))} disabled={!formData.mainCategory}>
                    <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Dal Makhani" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Short description..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" value={formData.price === 0 ? '' : formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? '' as unknown as number : parseFloat(e.target.value) }))} min={0} placeholder="Enter price" />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={formData.image} onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {restaurant?.foodTypes?.includes('non-veg') ? (
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.isVeg} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeg: checked, isJain: checked ? prev.isJain : false, isHalfJain: checked ? prev.isHalfJain : false }))} />
                    <Label className="flex items-center gap-2">
                      {formData.isVeg ? (<><Leaf className="h-4 w-4 text-veg" /> Vegetarian</>) : (<><Drumstick className="h-4 w-4 text-non-veg" /> Non-Veg</>)}
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-veg">
                    <Leaf className="h-4 w-4" />
                    <span className="text-sm font-medium">Vegetarian</span>
                  </div>
                )}
                {restaurant?.foodTypes?.includes('jain') && (
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.isJain || false} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isJain: checked }))} disabled={!formData.isVeg} />
                    <Label className={`flex items-center gap-2 ${!formData.isVeg ? 'opacity-50' : ''}`}>
                      <Sparkles className="h-4 w-4 text-amber-500" /> Jain
                      {!formData.isVeg && <span className="text-xs text-muted-foreground">(Veg only)</span>}
                    </Label>
                  </div>
                )}
                {restaurant?.foodTypes?.includes('vegan') && (
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.isVegan || false} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegan: checked }))} />
                    <Label className="flex items-center gap-2"><Salad className="h-4 w-4 text-emerald-500" /> Vegan</Label>
                  </div>
                )}
                {restaurant?.foodTypes?.includes('half-jain') && (
                  <div className="flex items-center gap-3">
                    <Switch checked={formData.isHalfJain || false} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHalfJain: checked }))} disabled={!formData.isVeg} />
                    <Label className={`flex items-center gap-2 ${!formData.isVeg ? 'opacity-50' : ''}`}>
                      <Sparkles className="h-4 w-4 text-orange-500" /> Half Jain
                      {!formData.isVeg && <span className="text-xs text-muted-foreground">(Veg only)</span>}
                    </Label>
                  </div>
                )}
              </div>

              <AvailabilityPicker 
                value={formData.availability} 
                onChange={(a) => setFormData(prev => ({ ...prev, availability: a }))} 
              />

              <Button onClick={handleSubmit} variant="gold" className="w-full">
                {editingItem ? 'Update' : 'Create'} Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 sm:gap-4 flex-wrap">
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubCategory('all'); }}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {mainCategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubCategory} onValueChange={setFilterSubCategory} disabled={filterCategory === 'all'}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {categories.filter(c => c.mainCategory._id === filterCategory).map(cat => (
                <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterFoodType} onValueChange={setFilterFoodType}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="veg"><span className="flex items-center gap-2"><Leaf className="h-3 w-3 text-veg" /> Veg</span></SelectItem>
              {restaurant?.foodTypes?.includes('non-veg') && (
                <SelectItem value="non-veg"><span className="flex items-center gap-2"><Drumstick className="h-3 w-3 text-non-veg" /> Non-Veg</span></SelectItem>
              )}
              {restaurant?.foodTypes?.includes('jain') && (
                <SelectItem value="jain"><span className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-amber-500" /> Jain</span></SelectItem>
              )}
              {restaurant?.foodTypes?.includes('vegan') && (
                <SelectItem value="vegan"><span className="flex items-center gap-2"><Salad className="h-3 w-3 text-emerald-500" /> Vegan</span></SelectItem>
              )}
              {restaurant?.foodTypes?.includes('half-jain') && (
                <SelectItem value="half-jain"><span className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-orange-500" /> Half Jain</span></SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Availability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            {items.length === 0 ? 'No menu items yet' : 'No items found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {items.length === 0 ? 'Add your first menu item to get started' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredItems.map(i => i._id)} strategy={rectSortingStrategy}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const { isAvailable, disabledReason, mainCat, subCat } = getItemAvailability(item);
                return (
                  <SortableMenuItem
                    key={item._id}
                    item={item}
                    isAvailable={isAvailable}
                    disabledReason={disabledReason}
                    mainCat={mainCat}
                    subCat={subCat}
                    onToggle={handleToggleItemAvailability}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

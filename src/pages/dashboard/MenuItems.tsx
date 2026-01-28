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
  DialogFooter,
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
import { menuItemApi, mainCategoryApi, categoryApi } from '@/lib/api';
import type { MenuItem, MainCategory, Category, CreateMenuItemData } from '@/lib/api';
import { Plus, Pencil, Trash2, UtensilsCrossed, Loader2, Search, Leaf, Drumstick } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const emptyForm: CreateMenuItemData = {
  mainCategory: '',
  category: '',
  name: '',
  description: '',
  price: 0,
  isVeg: true,
  isJain: false,
  isAvailable: true,
  image: '',
};

export default function MenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<CreateMenuItemData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsData, mainCats, cats] = await Promise.all([
        menuItemApi.getAll(),
        mainCategoryApi.getAll(),
        categoryApi.getAll(),
      ]);
      setItems(itemsData);
      setMainCategories(mainCats);
      setCategories(cats);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await menuItemApi.delete(id);
      toast({ title: 'Item deleted!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuItemApi.update(item._id, { isAvailable: !item.isAvailable });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      mainCategory:
        typeof item.mainCategory === 'string'
          ? item.mainCategory
          : item.mainCategory._id,
    
      category:
        typeof item.category === 'string'
          ? item.category
          : item.category._id,
    
      name: item.name,
      description: item.description || '',
      price: item.price,
      isVeg: item.isVeg,
      isJain: (item as any).isJain || false,
      isAvailable: item.isAvailable,
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
      toast({ 
        title: 'Failed to delete menu', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive' 
      });
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  // const filteredItems = items.filter(item => {
  //   const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
  //   const matchesCategory = filterCategory === 'all' || item.mainCategory === filterCategory;
  //   return matchesSearch && matchesCategory;
  // });
  const [filterSubCategory, setFilterSubCategory] = useState('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  
    const itemMainCategoryId =
      typeof item.mainCategory === 'string'
        ? item.mainCategory
        : item.mainCategory._id;
  
    const itemCategoryId =
      typeof item.category === 'string'
        ? item.category
        : item.category._id;
  
    const matchesMainCategory =
      filterCategory === 'all' || itemMainCategoryId === filterCategory;
  
    const matchesSubCategory =
      filterSubCategory === 'all' || itemCategoryId === filterSubCategory;
  
    return matchesSearch && matchesMainCategory && matchesSubCategory;
  });
  
  const availableSubCategories = categories.filter(
    c => c.mainCategory._id === formData.mainCategory
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} items • {items.filter(i => i.isAvailable).length} available
          </p>
        </div>
        <div className="flex gap-2">
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main Category</Label>
                  <Select 
                    value={formData.mainCategory} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, mainCategory: v, category: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                    disabled={!formData.mainCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Dal Makhani"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.isVeg}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVeg: checked }))}
                  />
                  <Label className="flex items-center gap-2">
                    {formData.isVeg ? (
                      <><Leaf className="h-4 w-4 text-veg" /> Vegetarian</>
                    ) : (
                      <><Drumstick className="h-4 w-4 text-non-veg" /> Non-Veg</>
                    )}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.isJain || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isJain: checked }))}
                  />
                  <Label>Jain</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  />
                  <Label>Available</Label>
                </div>
              </div>

              <Button onClick={handleSubmit} variant="gold" className="w-full">
                {editingItem ? 'Update' : 'Create'} Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* <Select value={filterCategory} onValueChange={setFilterCategory}> */}
        <Select
  value={filterCategory}
  onValueChange={(v) => {
    setFilterCategory(v);
    setFilterSubCategory('all');
  }}
>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {mainCategories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
  value={filterSubCategory}
  onValueChange={setFilterSubCategory}
  disabled={filterCategory === 'all'}
>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="All Subcategories" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Subcategories</SelectItem>

    {categories
      .filter(c => c.mainCategory._id === filterCategory)
      .map(cat => (
        <SelectItem key={cat._id} value={cat._id}>
          {cat.name}
        </SelectItem>
      ))}
  </SelectContent>
</Select>

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
            {items.length === 0 
              ? 'Add your first menu item to get started' 
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const mainCat = mainCategories.find(c => c._id === item.mainCategory);
            const subCat = categories.find(c => c._id === item.category);
            
            return (
              <div 
                key={item._id} 
                className={`glass rounded-xl overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}
              >
                {item.image && (
                  <div className="aspect-video bg-secondary">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                    {item.isVeg ? (
  <div className="p-1 border-2 border-green-500 rounded">
    <div className="w-2 h-2 bg-green-500 rounded-full" />
  </div>
) : (
  <div className="p-1 border-2 border-red-500 rounded">
    <div className="w-2 h-2 bg-red-500 rounded-full" />
  </div>
)}
                      <h3 className="font-semibold">{item.name}</h3>
                    </div>
                    <p className="font-bold text-primary">₹{item.price}</p>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {mainCat && <Badge variant="secondary">{mainCat.name}</Badge>}
                    {subCat && <Badge variant="outline">{subCat.name}</Badge>}
                    {!item.isAvailable && <Badge variant="destructive">Unavailable</Badge>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => handleToggleAvailability(item)}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

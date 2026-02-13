import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
import { mainCategoryApi, categoryApi, defaultAvailability } from '@/lib/api';
import type { MainCategory, Category, Availability } from '@/lib/api';
import { Plus, Pencil, Trash2, FolderTree, ChevronRight, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AvailabilityPicker from '@/components/AvailabilityPicker';
import { Badge } from '@/components/ui/badge';

function getAvailabilityLabel(a: Availability): string {
  if (a.type === 'always') return 'Always';
  if (a.type === 'once') return `${a.startDate?.split('T')[0] || ''} → ${a.endDate?.split('T')[0] || ''}`;
  if (a.type === 'daily') return `Daily ${a.startTime || ''}–${a.endTime || ''}`;
  if (a.type === 'weekly') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const selected = (a.daysOfWeek || []).map(d => days[d]).join(', ');
    return `${selected} ${a.startTime || ''}–${a.endTime || ''}`;
  }
  return 'Always';
}

export default function Categories() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingMain, setEditingMain] = useState<MainCategory | null>(null);
  const [editingSub, setEditingSub] = useState<Category | null>(null);
  const { toast } = useToast();

  // Form states
  const [mainName, setMainName] = useState('');
  const [mainOrder, setMainOrder] = useState(1);
  const [mainAvailability, setMainAvailability] = useState<Availability>(defaultAvailability);
  const [mainImage, setMainImage] = useState('');
  
  const [subName, setSubName] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState('');
  const [subAvailability, setSubAvailability] = useState<Availability>(defaultAvailability);
  const [subImage, setSubImage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mainCats, cats] = await Promise.all([
        mainCategoryApi.getAll(),
        categoryApi.getAll(),
      ]);
      setMainCategories(mainCats);
      setCategories(cats);
    } catch (error) {
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMainCategory = async () => {
    try {
      if (editingMain) {
        await mainCategoryApi.update(editingMain._id, { 
          name: mainName, 
          order: mainOrder,
          availability: mainAvailability,
          image: mainImage || undefined
        });
        toast({ title: 'Category updated!' });
      } else {
        await mainCategoryApi.create({ 
          name: mainName, 
          order: mainOrder,
          availability: mainAvailability,
          image: mainImage || undefined
        });
        toast({ title: 'Category created!' });
      }
      setDialogOpen(false);
      resetMainForm();
      fetchData();
    } catch (error) {
      toast({
        title: 'Failed to save category',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const resetMainForm = () => {
    setEditingMain(null);
    setMainName('');
    setMainOrder(1);
    setMainAvailability(defaultAvailability);
    setMainImage('');
  };

  const handleDeleteMainCategory = async (id: string) => {
    try {
      await mainCategoryApi.delete(id);
      toast({ title: 'Category deleted!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      if (editingSub) {
        await categoryApi.update(editingSub._id, { 
          name: subName,
          availability: subAvailability,
          image: subImage || undefined
        });
        toast({ title: 'Subcategory updated!' });
      } else {
        await categoryApi.create({ 
          name: subName, 
          mainCategory: selectedMainCat,
          availability: subAvailability,
          image: subImage || undefined
        });
        toast({ title: 'Subcategory created!' });
      }
      setSubDialogOpen(false);
      resetSubForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to save subcategory', variant: 'destructive' });
    }
  };

  const resetSubForm = () => {
    setEditingSub(null);
    setSubName('');
    setSelectedMainCat('');
    setSubAvailability(defaultAvailability);
    setSubImage('');
  };

  const handleDeleteSubCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      toast({ title: 'Subcategory deleted!' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const openEditMain = (cat: MainCategory) => {
    setEditingMain(cat);
    setMainName(cat.name);
    setMainOrder(cat.order);
    setMainAvailability(cat.availability || defaultAvailability);
    setMainImage(cat.image || '');
    setDialogOpen(true);
  };

  const openEditSub = (cat: Category) => {
    setEditingSub(cat);
    setSubName(cat.name);
    setSubAvailability(cat.availability || defaultAvailability);
    setSubImage(cat.image || '');
    const mainCatId = typeof cat.mainCategory === 'string' ? cat.mainCategory : cat.mainCategory._id;
    setSelectedMainCat(mainCatId);
    setSubDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Organize your menu with categories and subcategories
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="sm:size-default" onClick={() => resetSubForm()}>
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Subcategory</span>
                <span className="sm:hidden">Sub</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSub ? 'Edit' : 'Add'} Subcategory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select value={selectedMainCat} onValueChange={setSelectedMainCat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory Name</Label>
                  <Input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g., Soups, Starters" />
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={subImage} onChange={(e) => setSubImage(e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>
                <AvailabilityPicker value={subAvailability} onChange={setSubAvailability} />
                <Button onClick={handleCreateSubCategory} variant="gold" className="w-full">
                  {editingSub ? 'Update' : 'Create'} Subcategory
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm" className="sm:size-default" onClick={() => resetMainForm()}>
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Main Category</span>
                <span className="sm:hidden">Main</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMain ? 'Edit' : 'Add'} Main Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input value={mainName} onChange={(e) => setMainName(e.target.value)} placeholder="e.g., Food, Bar, Desserts" />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input type="number" value={mainOrder} onChange={(e) => setMainOrder(parseInt(e.target.value) || 1)} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="https://example.com/image.jpg" />
                </div>
                <AvailabilityPicker value={mainAvailability} onChange={setMainAvailability} />
                <Button onClick={handleCreateMainCategory} variant="gold" className="w-full">
                  {editingMain ? 'Update' : 'Create'} Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories List */}
      {mainCategories.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <FolderTree className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">No categories yet</h3>
          <p className="text-muted-foreground mb-4">Start by creating your first main category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mainCategories
            .sort((a, b) => a.order - b.order)
            .map((mainCat) => {
              const subCats = categories.filter(c => {
                const mainCatId = typeof c.mainCategory === 'string' ? c.mainCategory : c.mainCategory._id;
                return mainCatId === mainCat._id;
              });
              const isAvailable = mainCat.isCurrentlyAvailable !== false;
              
              return (
                <div key={mainCat._id} className={`glass rounded-xl overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex items-center gap-3">
                      {mainCat.image ? (
                        <img src={mainCat.image} alt={mainCat.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FolderTree className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{mainCat.name}</h3>
                          {mainCat.status && mainCat.status !== 'Available' && (
                            <Badge variant="secondary" className="text-xs">{mainCat.status}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{getAvailabilityLabel(mainCat.availability || defaultAvailability)}</span>
                          <span className="mx-1">•</span>
                          <span>{subCats.length} subcategories</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditMain(mainCat)}>
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
                            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{mainCat.name}" and all its subcategories. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMainCategory(mainCat._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {subCats.length > 0 && (
                    <div className="p-4 space-y-2">
                      {subCats.map((sub) => {
                        const subAvailable = sub.isCurrentlyAvailable !== false;
                        return (
                          <div
                            key={sub._id}
                            className={`flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors ${!subAvailable ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              {sub.image ? (
                                <img src={sub.image} alt={sub.name} className="w-8 h-8 rounded-md object-cover" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{sub.name}</span>
                                  {sub.status && sub.status !== 'Available' && (
                                    <Badge variant="secondary" className="text-[10px] py-0">{sub.status}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{getAvailabilityLabel(sub.availability || defaultAvailability)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSub(sub)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Subcategory?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{sub.name}". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSubCategory(sub._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Yes, Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

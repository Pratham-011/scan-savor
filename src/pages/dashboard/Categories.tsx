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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mainCategoryApi, categoryApi } from '@/lib/api';
import type { MainCategory, Category } from '@/lib/api';
import { Plus, Pencil, Trash2, FolderTree, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [subName, setSubName] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState('');

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
      toast({
        title: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMainCategory = async () => {
    try {
      if (editingMain) {
        await mainCategoryApi.update(editingMain._id, { name: mainName, order: mainOrder });
        toast({ title: 'Category updated!' });
      } else {
        await mainCategoryApi.create({ name: mainName, order: mainOrder });
        toast({ title: 'Category created!' });
      }
      setDialogOpen(false);
      setEditingMain(null);
      setMainName('');
      setMainOrder(1);
      fetchData();
    } catch (error) {
      toast({
        title: 'Failed to save category',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMainCategory = async (id: string) => {
    if (!confirm('Delete this category and all its subcategories?')) return;
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
        await categoryApi.update(editingSub._id, { name: subName });
        toast({ title: 'Subcategory updated!' });
      } else {
        await categoryApi.create({ name: subName, mainCategory: selectedMainCat });
        toast({ title: 'Subcategory created!' });
      }
      setSubDialogOpen(false);
      setEditingSub(null);
      setSubName('');
      setSelectedMainCat('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Failed to save subcategory',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm('Delete this subcategory?')) return;
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
    setDialogOpen(true);
  };

  const openEditSub = (cat: Category) => {
    setEditingSub(cat);
    setSubName(cat.name);
    setSelectedMainCat(cat.mainCategory);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your menu with categories and subcategories
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => { setEditingSub(null); setSubName(''); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
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
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory Name</Label>
                  <Input
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g., Soups, Starters"
                  />
                </div>
                <Button onClick={handleCreateSubCategory} variant="gold" className="w-full">
                  {editingSub ? 'Update' : 'Create'} Subcategory
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={() => { setEditingMain(null); setMainName(''); setMainOrder(1); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Main Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMain ? 'Edit' : 'Add'} Main Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    value={mainName}
                    onChange={(e) => setMainName(e.target.value)}
                    placeholder="e.g., Food, Bar, Desserts"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={mainOrder}
                    onChange={(e) => setMainOrder(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
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
          <p className="text-muted-foreground mb-4">
            Start by creating your first main category
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mainCategories
            .sort((a, b) => a.order - b.order)
            .map((mainCat) => {
              const subCats = categories.filter(c => c.mainCategory === mainCat._id);
              return (
                <div key={mainCat._id} className="glass rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FolderTree className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mainCat.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Order: {mainCat.order} • {subCats.length} subcategories
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditMain(mainCat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMainCategory(mainCat._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {subCats.length > 0 && (
                    <div className="p-4 space-y-2">
                      {subCats.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span>{sub.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditSub(sub)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSubCategory(sub._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
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

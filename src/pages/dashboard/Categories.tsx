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
import { mainCategoryApi, categoryApi, defaultAvailability, addOnApi } from '@/lib/api';
import type { MainCategory, Category, Availability, AddOn } from '@/lib/api';
import { Plus, Pencil, Trash2, FolderTree, ChevronRight, Loader2, Clock, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import AvailabilityPicker from '@/components/AvailabilityPicker';
import { Badge } from '@/components/ui/badge';
import { AddOnSelector } from '@/components/AddOnSelector';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable subcategory row
function SortableSubCategory({ sub, onToggle, onEdit, onDelete }: {
  sub: Category;
  onToggle: (cat: Category) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sub._id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : undefined };
  const subAvailable = sub.isCurrentlyAvailable !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors ${!subAvailable ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
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
      <div className="flex gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggle(sub)} title={subAvailable ? 'Hide temporarily' : 'Make available'}>
          {subAvailable ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(sub)}>
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
              <AlertDialogAction onClick={() => onDelete(sub._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Sortable main category card
function SortableMainCategory({ mainCat, subCats, onToggleMain, onEditMain, onDeleteMain, onToggleSub, onEditSub, onDeleteSub, onSubReorder }: {
  mainCat: MainCategory;
  subCats: Category[];
  onToggleMain: (cat: MainCategory) => void;
  onEditMain: (cat: MainCategory) => void;
  onDeleteMain: (id: string) => void;
  onToggleSub: (cat: Category) => void;
  onEditSub: (cat: Category) => void;
  onDeleteSub: (id: string) => void;
  onSubReorder: (mainCatId: string, activeId: string, overId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mainCat._id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : undefined };
  const isAvailable = mainCat.isCurrentlyAvailable !== false;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSubDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onSubReorder(mainCat._id, active.id as string, over.id as string);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`glass rounded-xl overflow-hidden ${!isAvailable ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between p-4 bg-secondary/30">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </button>
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
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onToggleMain(mainCat)} title={isAvailable ? 'Hide temporarily' : 'Make available'}>
            {isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEditMain(mainCat)}>
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
                <AlertDialogAction onClick={() => onDeleteMain(mainCat._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {subCats.length > 0 && (
        <div className="p-4 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
            <SortableContext items={subCats.map(s => s._id)} strategy={verticalListSortingStrategy}>
              {subCats.map((sub) => (
                <SortableSubCategory
                  key={sub._id}
                  sub={sub}
                  onToggle={onToggleSub}
                  onEdit={onEditSub}
                  onDelete={onDeleteSub}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
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

  // Add-ons
  const [allAddOns, setAllAddOns] = useState<AddOn[]>([]);
  const [mainAddOnIds, setMainAddOnIds] = useState<string[]>([]);
  const [subAddOnIds, setSubAddOnIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mainCats, cats, addOns] = await Promise.all([
        mainCategoryApi.getAll(),
        categoryApi.getAll(),
        addOnApi.getAll(),
      ]);
      setMainCategories(mainCats);
      setCategories(cats);
      setAllAddOns(addOns);
    } catch (error) {
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Drag and drop handlers ----
  const handleMainDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...mainCategories].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex(c => c._id === active.id);
    const newIndex = sorted.findIndex(c => c._id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);

    // Optimistic update
    const updated = reordered.map((cat, i) => ({ ...cat, order: i + 1 }));
    setMainCategories(updated);

    // Persist all order changes
    try {
      await Promise.all(updated.map(cat => mainCategoryApi.update(cat._id, { order: cat.order })));
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' });
      fetchData();
    }
  };

  const handleSubReorder = async (mainCatId: string, activeId: string, overId: string) => {
    const subCats = categories
      .filter(c => {
        const id = typeof c.mainCategory === 'string' ? c.mainCategory : c.mainCategory._id;
        return id === mainCatId;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const oldIndex = subCats.findIndex(c => c._id === activeId);
    const newIndex = subCats.findIndex(c => c._id === overId);
    const reordered = arrayMove(subCats, oldIndex, newIndex);
    const updated = reordered.map((cat, i) => ({ ...cat, order: i + 1 }));

    // Optimistic update
    setCategories(prev => {
      const otherCats = prev.filter(c => {
        const id = typeof c.mainCategory === 'string' ? c.mainCategory : c.mainCategory._id;
        return id !== mainCatId;
      });
      return [...otherCats, ...updated];
    });

    try {
      await Promise.all(updated.map(cat => categoryApi.update(cat._id, { order: cat.order })));
    } catch {
      toast({ title: 'Failed to save order', variant: 'destructive' });
      fetchData();
    }
  };

  // ---- CRUD handlers (unchanged logic) ----
  const handleCreateMainCategory = async () => {
    try {
      let savedId: string;
      if (editingMain) {
        await mainCategoryApi.update(editingMain._id, { name: mainName, order: mainOrder, availability: mainAvailability, image: mainImage || undefined });
        savedId = editingMain._id;
        toast({ title: 'Category updated!' });
      } else {
        const newCat = await mainCategoryApi.create({ name: mainName, order: mainOrder, availability: mainAvailability, image: mainImage || undefined });
        savedId = newCat._id;
        toast({ title: 'Category created!' });
      }
      await addOnApi.assignToMainCategory(savedId, mainAddOnIds);
      setDialogOpen(false);
      resetMainForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to save category', description: error instanceof Error ? error.message : 'Please try again', variant: 'destructive' });
    }
  };

  const resetMainForm = () => { setEditingMain(null); setMainName(''); setMainOrder(1); setMainAvailability(defaultAvailability); setMainImage(''); setMainAddOnIds([]); };

  const handleDeleteMainCategory = async (id: string) => {
    try { await mainCategoryApi.delete(id); toast({ title: 'Category deleted!' }); fetchData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const handleToggleMainAvailability = async (cat: MainCategory) => {
    const currentlyAvailable = cat.availability?.isAvailable !== false;
    const prev = mainCategories;
    setMainCategories(p => p.map(c => c._id === cat._id ? { ...c, availability: { ...c.availability, isAvailable: !currentlyAvailable }, isCurrentlyAvailable: !currentlyAvailable, status: !currentlyAvailable ? 'Available' : 'Not Available' } : c));
    try {
      await mainCategoryApi.update(cat._id, { availability: { ...cat.availability, isAvailable: !currentlyAvailable } });
      toast({ title: currentlyAvailable ? 'Category hidden temporarily' : 'Category made available' });
    } catch { setMainCategories(prev); toast({ title: 'Failed to update', variant: 'destructive' }); }
  };

  const handleToggleSubAvailability = async (cat: Category) => {
    const currentlyAvailable = cat.availability?.isAvailable !== false;
    const prev = categories;
    setCategories(p => p.map(c => c._id === cat._id ? { ...c, availability: { ...c.availability, isAvailable: !currentlyAvailable }, isCurrentlyAvailable: !currentlyAvailable, status: !currentlyAvailable ? 'Available' : 'Not Available' } : c));
    try {
      await categoryApi.update(cat._id, { availability: { ...cat.availability, isAvailable: !currentlyAvailable } });
      toast({ title: currentlyAvailable ? 'Subcategory hidden temporarily' : 'Subcategory made available' });
    } catch { setCategories(prev); toast({ title: 'Failed to update', variant: 'destructive' }); }
  };

  const handleCreateSubCategory = async () => {
    try {
      let savedId: string;
      if (editingSub) {
        await categoryApi.update(editingSub._id, { name: subName, availability: subAvailability, image: subImage || undefined });
        savedId = editingSub._id;
        toast({ title: 'Subcategory updated!' });
      } else {
        const newCat = await categoryApi.create({ name: subName, mainCategory: selectedMainCat, availability: subAvailability, image: subImage || undefined });
        savedId = newCat._id;
        toast({ title: 'Subcategory created!' });
      }
      await addOnApi.assignToCategory(savedId, subAddOnIds);
      setSubDialogOpen(false);
      resetSubForm();
      fetchData();
    } catch { toast({ title: 'Failed to save subcategory', variant: 'destructive' }); }
  };

  const resetSubForm = () => { setEditingSub(null); setSubName(''); setSelectedMainCat(''); setSubAvailability(defaultAvailability); setSubImage(''); setSubAddOnIds([]); };

  const handleDeleteSubCategory = async (id: string) => {
    try { await categoryApi.delete(id); toast({ title: 'Subcategory deleted!' }); fetchData(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  const openEditMain = (cat: MainCategory) => {
    setEditingMain(cat); setMainName(cat.name); setMainOrder(cat.order);
    setMainAvailability(cat.availability || defaultAvailability); setMainImage(cat.image || '');
    setMainAddOnIds(cat.addOns?.map(a => a._id) || []);
    setDialogOpen(true);
  };

  const openEditSub = (cat: Category) => {
    setEditingSub(cat); setSubName(cat.name);
    setSubAvailability(cat.availability || defaultAvailability); setSubImage(cat.image || '');
    setSelectedMainCat(typeof cat.mainCategory === 'string' ? cat.mainCategory : cat.mainCategory._id);
    setSubAddOnIds(cat.addOns?.map(a => a._id) || []);
    setSubDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-secondary/30">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              {[1, 2].map(j => (
                <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedMainCategories = [...mainCategories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Organize your menu — drag to reorder categories
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
                    <SelectTrigger><SelectValue placeholder="Select main category" /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Add-Ons</Label>
                  <AddOnSelector addOns={allAddOns} selectedIds={subAddOnIds} onChange={setSubAddOnIds} />
                  <p className="text-xs text-muted-foreground">These add-ons will appear for every item in this subcategory</p>
                </div>
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
                <div className="space-y-2">
                  <Label>Add-Ons</Label>
                  <AddOnSelector addOns={allAddOns} selectedIds={mainAddOnIds} onChange={setMainAddOnIds} />
                  <p className="text-xs text-muted-foreground">These add-ons will appear for every item in this main category</p>
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
          <p className="text-muted-foreground mb-4">Start by creating your first main category</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
          <SortableContext items={sortedMainCategories.map(c => c._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sortedMainCategories.map((mainCat) => {
                const subCats = categories
                  .filter(c => {
                    const mainCatId = typeof c.mainCategory === 'string' ? c.mainCategory : c.mainCategory._id;
                    return mainCatId === mainCat._id;
                  })
                  .sort((a, b) => (a.order || 0) - (b.order || 0));

                return (
                  <SortableMainCategory
                    key={mainCat._id}
                    mainCat={mainCat}
                    subCats={subCats}
                    onToggleMain={handleToggleMainAvailability}
                    onEditMain={openEditMain}
                    onDeleteMain={handleDeleteMainCategory}
                    onToggleSub={handleToggleSubAvailability}
                    onEditSub={openEditSub}
                    onDeleteSub={handleDeleteSubCategory}
                    onSubReorder={handleSubReorder}
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

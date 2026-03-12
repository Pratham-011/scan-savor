import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { addOnApi } from '@/lib/api';
import type { AddOn } from '@/lib/api';
import { Plus, Pencil, Trash2, PlusCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

const EMPTY_FORM = { name: '', price: '' as unknown as number };

function AddOnCard({
  addOn,
  onEdit,
  onDelete,
}: {
  addOn: AddOn;
  onEdit: (addOn: AddOn) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="glass rounded-xl p-4 group hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{addOn.name}</h3>
            <p className="text-sm text-primary font-medium">+₹{addOn.price}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(addOn)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Add-On?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{addOn.name}&quot; and remove it from
                  all categories and menu items. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(addOn._id, addOn.name)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function AddOns() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchAddOns();
  }, []);

  const fetchAddOns = async () => {
    setIsLoading(true);
    try {
      const data = await addOnApi.getAll();
      setAddOns(data.sort((a, b) => a.order - b.order));
    } catch {
      toast({ title: 'Failed to load add-ons', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextOrder = () =>
    addOns.length === 0 ? 0 : Math.max(...addOns.map((a) => a.order)) + 1;

  const openCreate = () => {
    setEditingAddOn(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (addOn: AddOn) => {
    setEditingAddOn(addOn);
    setForm({ name: addOn.name, price: addOn.price });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    const price = Number(form.price);
    if (isNaN(price) || price < 0) {
      toast({ title: 'Enter a valid price (0 or more)', variant: 'destructive' });
      return;
    }
    try {
      if (editingAddOn) {
        await addOnApi.update(editingAddOn._id, { name: form.name.trim(), price });
        toast({ title: 'Add-on updated!' });
      } else {
        await addOnApi.create({ name: form.name.trim(), price, order: getNextOrder() });
        toast({ title: 'Add-on created!' });
      }
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingAddOn(null);
      fetchAddOns();
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    setAddOns((prev) => prev.filter((a) => a._id !== id));
    try {
      await addOnApi.delete(id);
      toast({
        title: 'Add-on deleted!',
        description: 'Removed from all categories and items.',
      });
      fetchAddOns();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
      fetchAddOns();
    }
  };

  const filtered = addOns.filter((a) =>
    a.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-10 max-w-sm rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Add-Ons</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {addOns.length} add-on{addOns.length !== 1 ? 's' : ''} • Assign to main
            categories, subcategories, or individual items
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Add-On
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddOn ? 'Edit' : 'Create'} Add-On</DialogTitle>
              <DialogDescription>
                {editingAddOn
                  ? 'Update the add-on details below.'
                  : 'Create a new add-on to attach to categories or items.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Extra Cheese, Chilli Sauce"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price === ('' as unknown as number) ? '' : form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price:
                        e.target.value === ''
                          ? ('' as unknown as number)
                          : parseFloat(e.target.value),
                    }))
                  }
                  placeholder="0"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} variant="gold" className="flex-1">
                  {editingAddOn ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search add-ons..."
          className="pl-10"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <PlusCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            {addOns.length === 0 ? 'No add-ons yet' : 'No add-ons found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {addOns.length === 0
              ? 'Create add-ons and assign them to categories or menu items'
              : 'Try adjusting your search'}
          </p>
          {addOns.length === 0 && (
            <Button variant="gold" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Add-On
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((addOn) => (
            <AddOnCard
              key={addOn._id}
              addOn={addOn}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

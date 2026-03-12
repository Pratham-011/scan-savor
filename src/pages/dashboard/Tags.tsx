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
import { Badge } from '@/components/ui/badge';
import { tagApi, menuItemApi } from '@/lib/api';
import type { Tag } from '@/lib/api';
import { Plus, Pencil, Trash2, Loader2, Tag as TagIcon, X, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

const EMPTY_TAG = { name: '', color: '#f59e0b' };

// Predefined colors for quick selection
const PRESET_COLORS = [
  '#f59e0b', // Orange/gold
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
];

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow valid hex color format
    if (input === '' || input === '#' || /^#[0-9A-Fa-f]{0,6}$/.test(input)) {
      onChange(input || '#f59e0b');
    }
  };

  return (
    <div className="space-y-3">
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-5 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-10 w-full rounded-md transition-all ${
              value === color
                ? 'ring-2 ring-ring ring-offset-2 scale-105'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div
            className="absolute left-3 top-0 bottom-0 w-10 rounded-md"
            style={{ backgroundColor: value }}
          />
          <Input
            type="text"
            value={value}
            onChange={handleColorInputChange}
            placeholder="#f59e0b"
            className="pl-14 font-mono"
            maxLength={7}
          />
        </div>
        <div className="relative">
          <Input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-24 cursor-pointer p-1"
          />
        </div>
      </div>
    </div>
  );
}

function TagCard({ tag, onEdit, onDelete }: {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="glass rounded-xl p-4 group hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0"
            style={{ backgroundColor: tag.color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{tag.name}</h3>
            <p
              className="text-xs text-muted-foreground font-mono truncate"
              style={{ color: tag.color }}
            >
              {tag.color}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(tag)}>
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
                <AlertDialogTitle>Delete Tag?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{tag.name}&quot;.
                  It will also be removed from all menu items that use it.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(tag._id, tag.name)}
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

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState(EMPTY_TAG);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const data = await tagApi.getAll();
      // Sort by order
      setTags(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      toast({ title: 'Failed to load tags', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get next order automatically
  const getNextOrder = () => {
    if (tags.length === 0) return 0;
    return Math.max(...tags.map(t => t.order)) + 1;
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setTagForm(EMPTY_TAG);
    setDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name, color: tag.color });
    setDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      toast({ title: 'Tag name is required', variant: 'destructive' });
      return;
    }

    // Validate color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(tagForm.color)) {
      toast({ title: 'Invalid color format. Use #RRGGBB', variant: 'destructive' });
      return;
    }

    try {
      if (editingTag) {
        await tagApi.update(editingTag._id, {
          name: tagForm.name.trim(),
          color: tagForm.color,
        });
        toast({ title: 'Tag updated!' });
      } else {
        // Auto-calculate order
        const order = getNextOrder();
        await tagApi.create({
          name: tagForm.name.trim(),
          color: tagForm.color,
          order,
        });
        toast({ title: 'Tag created!' });
      }
      setDialogOpen(false);
      setTagForm(EMPTY_TAG);
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      toast({
        title: 'Failed to save tag',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    const previousTags = tags;
    let itemsUpdatedCount = 0;

    setTags(prev => prev.filter(t => t._id !== id));

    try {
      // Remove tag from all menu items that have it
      try {
        const allItems = await menuItemApi.getAll();
        const itemsWithTag = allItems.filter(item =>
          item.tags && item.tags.some(t => t._id === id)
        );

        if (itemsWithTag.length > 0) {
          await Promise.all(
            itemsWithTag.map(item =>
              menuItemApi.update(item._id, {
                tags: (item.tags || []).filter(t => t._id !== id),
              } as any)
            )
          );
          itemsUpdatedCount = itemsWithTag.length;
          console.log(`Removed tag from ${itemsUpdatedCount} menu items`);
        }
      } catch (err) {
        console.error('Warning: Failed to remove tag from menu items:', err);
        // Continue anyway - tag deletion is the primary operation
      }

      await tagApi.delete(id);

      // Reorder remaining tags
      try {
        const updatedTags = [...tags].filter(t => t._id !== id).map((t, i) => ({ ...t, order: i }));
        await Promise.all(updatedTags.map(t => tagApi.update(t._id, { order: t.order })));
      } catch {
        // Continue even if reordering fails
      }

      toast({
        title: 'Tag deleted!',
        description: itemsUpdatedCount > 0 ? `Removed from ${itemsUpdatedCount} item${itemsUpdatedCount > 1 ? 's' : ''}` : undefined,
      });
      fetchTags();
    } catch (error) {
      setTags(previousTags);
      toast({ title: 'Failed to delete tag', variant: 'destructive' });
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-10 max-w-sm rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {tags.length} tag{tags.length !== 1 ? 's' : ''} • Organize and filter your menu items
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTag ? 'Edit' : 'Create'} Tag</DialogTitle>
              <DialogDescription>
                {editingTag ? 'Update the tag details below.' : 'Create a new tag to categorize your menu items.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={tagForm.name}
                  onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Spicy, Chef's Special, New"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-color">Color</Label>
                <ColorPicker value={tagForm.color} onChange={(color) => setTagForm(prev => ({ ...prev, color }))} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveTag} variant="gold" className="flex-1">
                  {editingTag ? 'Update' : 'Create'} Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full h-10 px-4 pl-10 rounded-md bg-secondary border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
            <TagIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            {tags.length === 0 ? 'No tags yet' : 'No tags found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {tags.length === 0
              ? 'Create your first tag to organize your menu items'
              : 'Try adjusting your search'}
          </p>
          {tags.length === 0 && (
            <Button variant="gold" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Tag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <TagCard
              key={tag._id}
              tag={tag}
              onEdit={openEditDialog}
              onDelete={handleDeleteTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

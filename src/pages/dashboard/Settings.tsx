import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { restaurantApi, Restaurant, menuApi } from '@/lib/api';
import { Loader2, Save, Upload, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    logo: '',
    banner: '',
    Instaurl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantApi.get();
        setRestaurant(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          logo: data.logo || '',
          banner: data.banner || '',
          Instaurl: data.Instaurl || '',
        });
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await restaurantApi.update(formData);
      toast({ title: 'Settings saved!' });
    } catch (error) {
      toast({ 
        title: 'Failed to save', 
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await menuApi.import(file);
      toast({ title: 'Menu imported successfully!' });
    } catch (error) {
      toast({ 
        title: 'Import failed', 
        description: error instanceof Error ? error.message : 'Please check your CSV file',
        variant: 'destructive' 
      });
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    try {
      await menuApi.export();
      toast({ title: 'Menu exported!' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your restaurant? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await restaurantApi.delete();
      toast({ title: 'Restaurant deleted' });
      navigate('/dashboard/setup');
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your restaurant details</p>
      </div>

      {/* Restaurant Details */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h2 className="font-display text-lg sm:text-xl font-semibold">Restaurant Details</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">Banner URL</Label>
            <Input
              id="banner"
              name="banner"
              value={formData.banner}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Instaurl">Instagram URL</Label>
            <Input
              id="Instaurl"
              name="Instaurl"
              value={formData.Instaurl}
              onChange={handleChange}
            />
          </div>
        </div>

        <Button onClick={handleSave} variant="gold" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Import/Export */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <h2 className="font-display text-xl font-semibold">Import / Export</h2>
        <p className="text-muted-foreground text-sm">
          Bulk import your menu from a CSV file or export your current menu.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button variant="outline" asChild>
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </label>
            </Button>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-6 space-y-6 border-destructive/50">
        <h2 className="font-display text-xl font-semibold text-destructive">Danger Zone</h2>
        <p className="text-muted-foreground text-sm">
          Permanently delete your restaurant and all associated data.
        </p>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Restaurant
        </Button>
      </div>
    </div>
  );
}

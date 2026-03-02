import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { restaurantApi, Restaurant, menuApi } from '@/lib/api';
import { Loader2, Save, Upload, Download, Trash2, Leaf, Drumstick, Sparkles, Salad, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
    locationLink: '',
    foodTypes: ['veg'] as ('jain' | 'veg' | 'non-veg' | 'vegan' | 'half-jain')[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
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
          locationLink: data.locationLink || '',
          foodTypes: data.foodTypes || ['veg'],
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

  const simulateProgress = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(0);
    const interval = setInterval(() => {
      setter(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);
    return () => { clearInterval(interval); setter(100); };
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const finish = simulateProgress(setImportProgress);
    try {
      await menuApi.import(file);
      finish();
      toast({ title: 'Menu imported successfully!' });
    } catch (error) {
      toast({ 
        title: 'Import failed', 
        description: error instanceof Error ? error.message : 'Please check your CSV file',
        variant: 'destructive' 
      });
    } finally {
      setTimeout(() => { setIsImporting(false); setImportProgress(0); }, 1000);
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    setIsExporting(true);
    const finish = simulateProgress(setExportProgress);
    try {
      await menuApi.export();
      finish();
      toast({ title: 'Menu exported!' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setTimeout(() => { setIsExporting(false); setExportProgress(0); }, 1000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await restaurantApi.delete();
      toast({ title: 'Restaurant deleted' });
      navigate('/');
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

          <div className="space-y-2">
            <Label htmlFor="locationLink">Google Maps Location Link</Label>
            <Input
              id="locationLink"
              name="locationLink"
              value={formData.locationLink}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
            />
            <p className="text-xs text-muted-foreground">Paste your Google Maps link so customers can navigate to your restaurant</p>
          </div>

          <div className="space-y-3">
            <Label>Food Types Offered</Label>
            <p className="text-xs text-muted-foreground">Select the dietary options your restaurant offers. This controls which options are available when adding menu items.</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.foodTypes.includes('veg')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, 'veg'] }));
                    } else {
                      setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== 'veg') }));
                    }
                  }}
                  className="rounded border-border"
                />
                <Leaf className="h-4 w-4 text-veg" />
                <span className="text-sm">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.foodTypes.includes('non-veg')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, 'non-veg'] }));
                    } else {
                      setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== 'non-veg') }));
                    }
                  }}
                  className="rounded border-border"
                />
                <Drumstick className="h-4 w-4 text-non-veg" />
                <span className="text-sm">Non-Veg</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.foodTypes.includes('jain')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, 'jain'] }));
                    } else {
                      setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== 'jain') }));
                    }
                  }}
                  className="rounded border-border"
                />
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Jain</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.foodTypes.includes('vegan')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, 'vegan'] }));
                    } else {
                      setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== 'vegan') }));
                    }
                  }}
                  className="rounded border-border"
                />
                <Salad className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Vegan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.foodTypes.includes('half-jain')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, foodTypes: [...prev.foodTypes, 'half-jain'] }));
                    } else {
                      setFormData(prev => ({ ...prev, foodTypes: prev.foodTypes.filter(t => t !== 'half-jain') }));
                    }
                  }}
                  className="rounded border-border"
                />
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Half Jain</span>
              </label>
            </div>
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
              disabled={isImporting}
            />
            <Button variant="outline" asChild disabled={isImporting}>
              <label htmlFor="import-file" className="cursor-pointer">
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isImporting ? 'Importing...' : 'Import CSV'}
              </label>
            </Button>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Importing menu...</span>
              <span className="font-medium">{Math.round(importProgress)}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
            {importProgress >= 100 && (
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Import complete!
              </div>
            )}
          </div>
        )}

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exporting menu...</span>
              <span className="font-medium">{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
            {exportProgress >= 100 && (
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Export complete!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-6 space-y-6 border-destructive/50">
        <h2 className="font-display text-xl font-semibold text-destructive">Danger Zone</h2>
        <p className="text-muted-foreground text-sm">
          Permanently delete your restaurant and all associated data.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Restaurant
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Restaurant?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your restaurant "{formData.name}" and all associated data including menu items, categories, and settings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Restaurant
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

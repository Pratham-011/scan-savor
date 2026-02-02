import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { restaurantApi } from '@/lib/api';
import { Loader2, Store, Leaf, Drumstick, Sparkles, Salad } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RestaurantSetup() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    logo: '',
    banner: '',
    Instaurl: '',
    foodTypes: ['veg'] as ('jain' | 'veg' | 'non-veg' | 'vegan')[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await restaurantApi.create(formData);
      toast({
        title: 'Restaurant Created!',
        description: 'Your restaurant has been set up successfully.',
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Failed to create restaurant',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-primary/10 mb-3 sm:mb-4">
          <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Set Up Your Restaurant</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Tell us about your restaurant to get started
        </p>
      </div>

      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Spice Garden"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of your restaurant..."
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
                placeholder="Mumbai, India"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="9876543210"
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
              type="url"
              placeholder="https://example.com/logo.png"
              value={formData.logo}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">Banner Image URL</Label>
            <Input
              id="banner"
              name="banner"
              type="url"
              placeholder="https://example.com/banner.png"
              value={formData.banner}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Instaurl">Instagram URL</Label>
            <Input
              id="Instaurl"
              name="Instaurl"
              type="url"
              placeholder="https://instagram.com/yourrestaurant"
              value={formData.Instaurl}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-3">
            <Label>Food Types Offered</Label>
            <p className="text-xs text-muted-foreground">Select the dietary options your restaurant offers</p>
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
            </div>
          </div>

          <Button 
            type="submit" 
            variant="gold" 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Restaurant...
              </>
            ) : (
              'Create Restaurant'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

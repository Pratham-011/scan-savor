import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { restaurantApi } from '@/lib/api';
import { Loader2, Store } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold">Set Up Your Restaurant</h1>
        <p className="text-muted-foreground mt-2">
          Tell us about your restaurant to get started
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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

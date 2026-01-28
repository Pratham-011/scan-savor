import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { restaurantApi, Restaurant } from '@/lib/api';
import { QrCode, Download, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QRCodePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Use the production frontend URL for QR codes
  const FRONTEND_URL = 'https://id-preview--06e4da2e-d5df-475a-b89a-d461d3e6b36d.lovable.app';
  const menuUrl = restaurant 
    ? `${FRONTEND_URL}/menu/${(restaurant as any).qrSlug || restaurant._id}` 
    : '';

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantApi.get();
        setRestaurant(data);
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({ title: 'Link copied!' });
  };

  // const downloadQR = () => {
  //   // Generate QR code using a free API
  //   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;
    
  //   const link = document.createElement('a');
  //   link.href = qrUrl;
  //   link.download = `${restaurant?.name || 'menu'}-qr-code.png`;
  //   link.click();
    
  //   toast({ title: 'QR Code downloading...' });
  // };
  const downloadQR = async () => {
    try {
      // Generate QR code using the free API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;
      console.log("🔗 QR Code URL:", qrUrl);
      // Fetch the image as a blob
      const response = await fetch(qrUrl);
      const blob = await response.blob();
  
      // Create a temporary object URL
      const objectUrl = URL.createObjectURL(blob);
  
      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${restaurant?.name || 'menu'}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Release memory
      URL.revokeObjectURL(objectUrl);
  
      toast({ title: 'QR Code downloading...' });
    } catch (err) {
      console.error("❌ Failed to download QR:", err);
      toast({ title: 'Failed to download QR Code' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Please set up your restaurant first.</p>
      </div>
    );
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}&color=f59e0b&bgcolor=0f0f11`;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">Your QR Code</h1>
        <p className="text-muted-foreground mt-2">
          Share this QR code with your customers to view your menu
        </p>
      </div>

      {/* QR Code Display */}
      <div className="glass rounded-3xl p-12 text-center">
        <div className="inline-block p-6 bg-white rounded-2xl mb-6">
          <img 
            src={qrImageUrl}
            alt="Menu QR Code"
            className="w-64 h-64"
          />
        </div>
        
        <h2 className="font-display text-xl font-semibold mb-2">{restaurant.name}</h2>
        
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
          <span className="text-sm truncate max-w-xs">{menuUrl}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="gold" onClick={downloadQR}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
          <Button variant="outline" onClick={copyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button variant="outline" asChild>
            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Menu
            </a>
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Tips for using your QR code</h3>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Print and display at each table for easy customer access</span>
          </li>
          <li className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Add to your marketing materials and social media</span>
          </li>
          <li className="flex items-start gap-3">
            <QrCode className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Your QR code is permanent - it will always point to your latest menu</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

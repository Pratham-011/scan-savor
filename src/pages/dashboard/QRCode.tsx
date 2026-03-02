import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { restaurantApi, Restaurant } from '@/lib/api';
import { QrCode, Download, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function QRCodePage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Use window.location.origin to get the correct URL (works for both preview and published)
  const menuUrl = restaurant 
    ? `${window.origin}/menu/${(restaurant as any).qrSlug || restaurant._id}` 
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
      <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 flex flex-col items-center">
          <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl mb-6" />
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56 mb-6" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
        <div className="glass rounded-xl p-4 sm:p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
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
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Your QR Code</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Share this QR code with your customers to view your menu
        </p>
      </div>

      {/* QR Code Display */}
      <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center">
        <div className="inline-block p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
          <img 
            src={qrImageUrl}
            alt="Menu QR Code"
            className="w-48 h-48 sm:w-64 sm:h-64"
          />
        </div>
        
        <h2 className="font-display text-lg sm:text-xl font-semibold mb-2">{restaurant.name}</h2>
        
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4 sm:mb-6 px-2">
          <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-xs">{menuUrl}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <Button variant="gold" onClick={downloadQR} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </Button>
          <Button variant="outline" onClick={copyLink} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Menu
            </a>
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="glass rounded-xl p-4 sm:p-6">
        <h3 className="font-display text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tips for using your QR code</h3>
        <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-sm">
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Print and display at each table for easy customer access</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Add to your marketing materials and social media</span>
          </li>
          <li className="flex items-start gap-2 sm:gap-3">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Your QR code is permanent - it will always point to your latest menu</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppPromptProps {
  slug: string;
  restaurantName: string;
  onClose: () => void;
}

export default function WhatsAppPrompt({
  slug,
  restaurantName,
  onClose,
}: WhatsAppPromptProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRedirect = async () => {
    setError(null);

    // Validate phone number (basic validation)
    if (!phone.trim()) {
      setError('Please enter your WhatsApp number');
      return;
    }

    // Remove non-digit characters for validation
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      
      // Redirect to WhatsApp endpoint
      const params = new URLSearchParams();
      params.append('customerPhone', phone);
      params.append('customerName', name);

      const redirectUrl = `/menu/${slug}/whatsapp?${params.toString()}`;

      // Give slight delay for analytics tracking
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
    } catch (err) {
      setError('Failed to process request. Please try again.');
      console.error('WhatsApp redirect error:', err);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && phone.trim() && name.trim()) {
      handleRedirect();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full border border-border/50 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-border/30">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient-gold">Get Menu on WhatsApp</h2>
              <p className="text-xs text-muted-foreground">{restaurantName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your details to receive the menu directly on WhatsApp
          </p>

          {/* Form */}
          <div className="space-y-3">
            {/* Phone Number */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm transition-all',
                  'border-border/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                  'placeholder:text-muted-foreground/50',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Include country code (e.g., +91 for India)
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Your Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm transition-all',
                  'border-border/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
                  'placeholder:text-muted-foreground/50',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-semibold',
                'transition-all duration-200 hover:bg-secondary',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              Skip
            </button>
            <button
              onClick={handleRedirect}
              disabled={isLoading || !phone.trim() || !name.trim()}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-green-600',
                'text-white text-sm font-semibold transition-all duration-200',
                'hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  <span>Continue on WhatsApp</span>
                </>
              )}
            </button>
          </div>

          {/* Info Footer */}
          <p className="text-xs text-muted-foreground text-center">
            We'll send the menu link to your WhatsApp number
          </p>
        </div>
      </div>
    </div>
  );
}

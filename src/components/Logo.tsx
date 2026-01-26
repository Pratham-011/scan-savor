import { QrCode } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-gold rounded-lg blur-md opacity-50" />
        <div className="relative bg-gradient-gold rounded-lg p-1.5">
          <QrCode className={`${sizes[size]} text-primary-foreground`} />
        </div>
      </div>
      {showText && (
        <span className={`font-display font-bold ${textSizes[size]} text-gradient-gold`}>
          oneQR
        </span>
      )}
    </div>
  );
}

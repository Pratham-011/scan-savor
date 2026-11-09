import { Link } from 'react-router-dom';
import { Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({
  title,
  description = 'We are putting the finishing touches on WhatsApp features. They will be available here soon.',
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center sm:p-12">
        <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-4">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <Badge variant="secondary" className="mb-3 gap-1">
          <Clock className="h-3 w-3" /> Coming soon
        </Badge>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
        <Button asChild variant="gold" className="mt-6">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

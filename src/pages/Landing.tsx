import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { 
  QrCode, 
  Smartphone, 
  LayoutDashboard, 
  Image, 
  ArrowRight, 
  Check,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="gold" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>The future of restaurant menus is here</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
              One QR Code.
              <br />
              <span className="text-gradient-gold">Infinite Possibilities.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your restaurant menu into a stunning digital experience. 
              No app downloads. No complex setup. Just scan and explore.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/menu/demo">View Demo Menu</Link>
              </Button>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-gold opacity-10 blur-3xl rounded-full" />
            <div className="relative glass rounded-2xl p-8 overflow-hidden">
              <div className="aspect-video bg-gradient-card rounded-xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex p-6 rounded-2xl bg-secondary/50 animate-pulse-glow">
                    <QrCode className="h-24 w-24 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Your premium digital menu awaits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Everything you need to <span className="text-gradient-gold">shine</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed for modern restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass glass-hover rounded-2xl p-6 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Simple, transparent <span className="text-gradient-gold">pricing</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose the plan that fits your restaurant
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`glass rounded-2xl p-8 relative ${
                  plan.popular ? 'border-primary glow-gold' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-gold rounded-full text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-primary text-sm mt-1">{plan.savings}</p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? 'gold' : 'outline'} 
                  className="w-full"
                  asChild
                >
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-gold opacity-5" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to elevate your menu?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of restaurants already using oneQR to delight their customers.
              </p>
              <Button variant="gold" size="xl" asChild>
                <Link to="/register">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} oneQR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: QrCode,
    title: 'Permanent QR Code',
    description: 'One QR code that never changes. Update your menu anytime, customers always see the latest.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Stunning menu experience optimized for smartphones. No app download required.',
  },
  {
    icon: LayoutDashboard,
    title: 'Easy Dashboard',
    description: 'Manage categories, items, prices, and availability with our intuitive admin panel.',
  },
  {
    icon: Image,
    title: 'Rich Media Support',
    description: 'Add beautiful images to your dishes. Make your menu irresistible.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security. Your menu is always online when customers need it.',
  },
  {
    icon: Zap,
    title: 'Instant Updates',
    description: 'Change prices, mark items unavailable, or add new dishes in seconds.',
  },
];

const plans = [
  {
    name: 'Monthly',
    price: '499',
    period: 'month',
    features: [
      'Unlimited menu items',
      'Custom QR code',
      'Mobile-optimized menu',
      'Real-time updates',
      'Email support',
    ],
  },
  {
    name: '6 Months',
    price: '399',
    period: 'month',
    savings: 'Save ₹600',
    popular: true,
    features: [
      'Everything in Monthly',
      'Priority support',
      'Menu analytics',
      'Custom branding',
      'CSV import/export',
    ],
  },
  {
    name: 'Yearly',
    price: '299',
    period: 'month',
    savings: 'Save ₹2,400',
    features: [
      'Everything in 6 Months',
      'Dedicated support',
      'API access',
      'White-label option',
      'Multi-location support',
    ],
  },
];

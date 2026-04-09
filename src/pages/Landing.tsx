import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { mailto, siteConfig } from '@/lib/site';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clapperboard,
  Globe2,
  LayoutDashboard,
  Megaphone,
  MessageCircleMore,
  Menu,
  PhoneCall,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';

const featuredMetrics = [
  { value: '24/7', label: 'menu access', icon: QrCode },
  { value: 'Meta', label: 'ads + retargeting', icon: Megaphone },
  { value: 'WhatsApp', label: 'broadcasts + replies', icon: MessageCircleMore },
];

const features = [
  {
    icon: QrCode,
    title: 'QR menu that feels premium',
    description: 'A polished public menu page with rich visuals, clean category flow, and a restaurant-grade first impression.',
  },
  {
    icon: ScanLine,
    title: 'Instant menu scans',
    description: 'Customers scan once and land on a fast mobile experience that works without app installs or friction.',
  },
  {
    icon: LayoutDashboard,
    title: 'Simple data collection',
    description: 'Capture customer interest, repeat visits, and menu behavior so you can make better menu and marketing decisions.',
  },
  {
    icon: Megaphone,
    title: 'Meta ads ready',
    description: 'Turn restaurant traffic into retargeting audiences and run click-to-WhatsApp campaigns from real customer intent.',
  },
  {
    icon: MessageCircleMore,
    title: 'WhatsApp automations',
    description: 'Use prompts, quick replies, and follow-ups to keep the conversation going after the scan.',
  },
  {
    icon: Clapperboard,
    title: 'Broadcast campaigns',
    description: 'Send offers, festival menus, and daily specials to segmented customer lists in a controlled broadcast flow.',
  },
  {
    icon: BarChart3,
    title: 'Live analytics',
    description: 'Track scans, conversations, and campaign performance from a single dashboard built for operators.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable by design',
    description: 'Keep the menu online, keep updates fast, and keep customer visibility organized across locations.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Scan the QR',
    description: 'Guests open the menu from a table QR or a social link.',
  },
  {
    step: '02',
    title: 'Explore the menu',
    description: 'They browse a beautiful menu page with images, categories, and live availability.',
  },
  {
    step: '03',
    title: 'Collect data',
    description: 'Every visit helps you understand what people want and when they want it.',
  },
  {
    step: '04',
    title: 'Drive growth',
    description: 'Retarget with Meta ads, broadcast updates, and WhatsApp follow-ups that convert.',
  },
];

const highlights = [
  'Beautiful menu pages',
  'Meta ads',
  'Broadcasts',
  'WhatsApp automation',
  'Customer data',
  'Fast updates',
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div id="top" className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-32 left-8 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-40 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#menu" className="transition-colors hover:text-foreground">Menu page</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">Flow</a>
            <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button variant="outline" className="hidden md:inline-flex" asChild>
              <Link to="/contact">Talk to us</Link>
            </Button>
            <Button variant="gold" className="hidden sm:inline-flex" asChild>
              <Link to="/register">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      </nav>

      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'pointer-events-auto bg-black/50 opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          className="absolute inset-0"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu overlay"
        />

        <div
          className={`absolute left-0 top-16 h-[calc(100%-4rem)] w-72 border-r border-border/50 bg-background/95 p-4 backdrop-blur-xl transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="grid gap-2">
            {[
              { href: '#top', label: 'Home' },
              { href: '#features', label: 'Features' },
              { href: '#menu', label: 'Menu page' },
              { href: '#workflow', label: 'Flow' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Contact
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-gradient-gold px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="relative pt-28">
        <section className="px-4 pb-20 pt-8 md:pt-12">
          <div className="container mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Built for QR-first restaurants that want more than a menu.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.05] md:text-7xl">
                  One platform for
                  <span className="block text-gradient-gold">menus, Meta ads, broadcasts, and data.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                  oneQr turns every table scan into a premium menu experience, a customer insight, and a growth signal.
                  Show a better menu, collect better data, and run smarter WhatsApp and Meta campaigns from one place.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="xl" variant="gold" asChild>
                  <Link to="/register">
                    Launch your menu
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/contact">Book a quick demo</Link>
                </Button>
                <Button size="xl" variant="ghost" asChild>
                  <Link to="/menu/demo">View demo menu</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {featuredMetrics.map((metric) => (
                  <div key={metric.label} className="glass rounded-2xl p-4">
                    <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                      <metric.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span key={item} className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-3xl" />
              <div className="relative space-y-4">
                <div className="glass rounded-[2rem] p-6 shadow-2xl shadow-black/20">
                  <div className="rounded-[1.5rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8">
                    <p className="text-xs uppercase tracking-[0.25em] text-primary">Growth stack</p>
                    <h3 className="mt-3 font-display text-2xl font-bold md:text-3xl">Menu + WhatsApp + Meta Ads</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      Build a beautiful QR menu, collect customer signals, and launch campaigns from one place.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {['Interactive menu', 'Broadcast engine', 'Meta audience sync'].map((item) => (
                        <span key={item} className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass hover:glow-gold rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Meta Ads growth</p>
                        <p className="text-xs text-muted-foreground">Click-to-WhatsApp flow</p>
                      </div>
                    </div>
                    <div className="h-28 rounded-xl bg-[url('/landing-dashboard.svg')] bg-cover bg-center" />
                  </div>

                  <div className="glass hover:glow-gold rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <MessageCircleMore className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Broadcasts & data</p>
                        <p className="text-xs text-muted-foreground">Customer segments and offers</p>
                      </div>
                    </div>
                    <div className="h-28 rounded-xl bg-[url('/landing-menu.svg')] bg-cover bg-center" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: TabletSmartphone, label: 'Mobile menu' },
                    { icon: Users, label: 'Customer data' },
                    { icon: WandSparkles, label: 'Smart updates' },
                  ].map((item) => (
                    <div key={item.label} className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 py-20">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-14 max-w-3xl">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">What you get</p>
              <h2 className="font-display text-3xl font-bold md:text-5xl">Everything needed to run a modern restaurant growth stack.</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="glass glass-hover group rounded-3xl p-6"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="menu" className="px-4 py-20">
          <div className="container mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-primary">Menu experience</p>
              <h2 className="font-display text-3xl font-bold md:text-5xl">A menu page that feels like a product, not a PDF.</h2>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                The public menu is designed to be fast, visual, and interactive. Images, categories, and item states work together to keep people browsing longer and ordering sooner.
              </p>

              <div className="space-y-4">
                {[
                  'High-quality dish images and category browsing',
                  'Easy menu data collection for customer insights',
                  'Built to push visitors toward WhatsApp, offers, and repeat visits',
                ].map((item) => (
                  <div key={item} className="glass flex items-start gap-3 rounded-2xl p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-7 text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="gold" asChild>
                  <Link to="/menu/demo">Open demo menu</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/contact">See contact options</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="glass rounded-[2rem] p-4 sm:row-span-2">
                <img
                  src="/landing-menu.svg"
                  alt="Interactive menu preview"
                  className="h-full min-h-[420px] w-full rounded-[1.5rem] object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
              <div className="glass rounded-[2rem] p-4">
                <img
                  src="/landing-dashboard.svg"
                  alt="Restaurant dashboard preview"
                  className="h-56 w-full rounded-[1.5rem] object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
              <div className="glass rounded-[2rem] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Interactive public page</p>
                    <p className="text-xs text-muted-foreground">Built to feel premium on mobile</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3">Animated cards</div>
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3">Photos and dishes</div>
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3">Live availability</div>
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-3">WhatsApp CTA</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 py-20">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-14 max-w-3xl">
              <p className="mb-3 text-sm uppercase tracking-[0.3em] text-primary">How it works</p>
              <h2 className="font-display text-3xl font-bold md:text-5xl">A simple flow from scan to growth.</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.step} className="glass rounded-3xl p-6">
                  <div className="mb-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {item.step}
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-semibold">{item.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="container mx-auto max-w-7xl">
            <div className="glass relative overflow-hidden rounded-[2rem] p-8 md:p-12">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-5">
                  <p className="text-sm uppercase tracking-[0.3em] text-primary">Ready to start?</p>
                  <h2 className="font-display text-3xl font-bold md:text-5xl">Build the menu, capture the customer, and grow the restaurant.</h2>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    If you want a menu that looks good, works hard, and feeds your marketing stack, oneQr is built for that exact job.
                  </p>
                </div>

                <div className="flex flex-col gap-4 lg:items-end">
                  <Button size="xl" variant="gold" asChild>
                    <Link to="/register">
                      Start free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link to="/contact">Contact sales</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-4 py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/80 to-card/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{siteConfig.supportLabel}</p>
                <p className="text-xs text-muted-foreground">Call us directly on any number below.</p>
              </div>
              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                {siteConfig.contactPhones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    <PhoneCall className="h-4 w-4 text-primary" />
                    {phone}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="max-w-md text-sm leading-7 text-muted-foreground">
              oneQr helps restaurants turn table scans into better menu browsing, smarter marketing, and cleaner customer data.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {['QR menus', 'Meta ads', 'Broadcasts', 'WhatsApp', 'Analytics'].map((item) => (
                <span key={item} className="rounded-full border border-border/60 bg-card/60 px-3 py-1">{item}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Contact</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a href={mailto('oneQr enquiry', 'Hi, I would like to know more about oneQr.')} className="block transition-colors hover:text-foreground">
                {siteConfig.contactEmail}
              </a>
              {siteConfig.contactPhones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="block transition-colors hover:text-foreground">
                  {phone}
                </a>
              ))}
              <p>{siteConfig.supportLabel}</p>
              <p>{siteConfig.address}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Quick links</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <a href="#features" className="flex items-center gap-2 transition-colors hover:text-foreground">
                <ChevronRight className="h-4 w-4 text-primary" /> Features
              </a>
              <Link to="/contact" className="flex items-center gap-2 transition-colors hover:text-foreground">
                <ChevronRight className="h-4 w-4 text-primary" /> Contact page
              </Link>
              <Link to="/register" className="flex items-center gap-2 transition-colors hover:text-foreground">
                <ChevronRight className="h-4 w-4 text-primary" /> Get started
              </Link>
              <Link to="/login" className="flex items-center gap-2 transition-colors hover:text-foreground">
                <ChevronRight className="h-4 w-4 text-primary" /> Sign in
              </Link>
            </div>
          </div>
          </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} oneQr. All rights reserved.</p>
          <p>
            Reach us at{' '}
            <a href={mailto('oneQr enquiry', 'Hi, I would like to know more about oneQr.')} className="text-foreground transition-colors hover:text-primary">
              {siteConfig.contactEmail}
            </a>
          </p>
        </div>
        </div>
      </footer>
    </div>
  );
}

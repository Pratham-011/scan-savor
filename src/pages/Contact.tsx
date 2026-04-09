import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { mailto, siteConfig } from '@/lib/site';
import { ArrowLeft, ArrowRight, Clock3, Mail, MapPin, MessageCircleMore, PhoneCall, Sparkles } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setStatusError(null);
    setIsSending(true);

    const subject = `${restaurant || 'oneQr'} enquiry from ${name || 'a visitor'}`;
    const body = `Name: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\nRestaurant: ${restaurant || 'Not provided'}\n\n${message || 'No message added.'}`;

    try {
      const response = await fetch(siteConfig.contactFormEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: name || 'Website visitor',
          email: email || siteConfig.contactEmail,
          restaurant,
          message: body,
          _subject: subject,
          _captcha: 'false',
          _next: `${siteConfig.siteUrl}/contact`,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to send email right now.');
      }

      setName('');
      setEmail('');
      setRestaurant('');
      setMessage('');
      setStatusMessage(`Your query has been sent to ${siteConfig.contactEmail}.`);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/">
            <Logo />
          </Link>
          <Button variant="ghost" onClick={handleBack} className="md:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <Link to="/">Back home</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Talk to the oneQr team
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl font-bold md:text-6xl">Contact us about menus, broadcasts, Meta ads, and WhatsApp growth.</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Use the form to send a mail directly to {siteConfig.contactEmail}. Share your restaurant details, menu goals, or campaign questions and we’ll route it to the same inbox.
              </p>
              <p className="text-sm text-muted-foreground">
                You can also call us at {siteConfig.contactPhones[0]} or {siteConfig.contactPhones[1]} for {siteConfig.supportLabel.toLowerCase()}.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Mail, label: 'Email', value: siteConfig.contactEmail, href: mailto('oneQr enquiry', 'Hi, I would like to know more about oneQr.') },
                { icon: PhoneCall, label: 'Phone 1', value: siteConfig.contactPhones[0], href: `tel:${siteConfig.contactPhones[0]}` },
                { icon: PhoneCall, label: 'Phone 2', value: siteConfig.contactPhones[1], href: `tel:${siteConfig.contactPhones[1]}` },
                { icon: MessageCircleMore, label: 'WhatsApp', value: siteConfig.supportLabel, href: `https://wa.me/${siteConfig.contactPhones[0].replace(/\D/g, '')}` },
                { icon: MapPin, label: 'Location', value: siteConfig.address, href: '#' },
              ].map((item) => (
                <a key={item.label} href={item.href} className="glass glass-hover rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6">{item.value}</p>
                </a>
              ))}
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Support window</p>
                  <p className="text-sm text-muted-foreground">{siteConfig.supportLabel}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="glass rounded-[2rem] p-6 sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-primary">Send a message</p>
              <h2 className="font-display text-3xl font-bold">Your message is sent directly to our support inbox.</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Rahul Sharma" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your email</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="rahul@restaurant.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant">Restaurant / brand name</Label>
                <Input id="restaurant" value={restaurant} onChange={(event) => setRestaurant(event.target.value)} placeholder="Spice Route Kitchen" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">What do you need help with?</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us about your menu, contact goals, Meta ads, WhatsApp broadcasts, or any other question."
                  className="min-h-[180px]"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" variant="gold" size="lg" className="sm:flex-1" disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send email'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {statusMessage && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {statusMessage}
                </p>
              )}
              {statusError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {statusError}
                </p>
              )}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
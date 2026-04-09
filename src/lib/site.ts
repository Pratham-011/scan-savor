const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const parseSiteUrls = (value?: string) => {
  if (!value) return [];
  return value
    .split(',')
    .map((url) => stripTrailingSlash(url.trim()))
    .filter(Boolean);
};

const configuredSiteUrls = parseSiteUrls(import.meta.env.VITE_SITE_URL);

const resolveSiteUrl = () => {
  if (typeof window !== 'undefined') {
    const currentOrigin = stripTrailingSlash(window.location.origin);
    if (configuredSiteUrls.includes(currentOrigin)) {
      return currentOrigin;
    }
    return currentOrigin;
  }

  return configuredSiteUrls[0] ?? 'http://localhost:8080';
};

export const siteConfig = {
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? 'oneqr26@gmail.com',
  siteUrl: resolveSiteUrl(),
  siteUrls: configuredSiteUrls,
  contactFormEndpoint:
    import.meta.env.VITE_CONTACT_FORM_ENDPOINT ??
    `https://formsubmit.co/ajax/${import.meta.env.VITE_CONTACT_EMAIL ?? 'oneqr26@gmail.com'}`,
  contactPhones: [
    import.meta.env.VITE_CONTACT_PHONE_PRIMARY ?? '+91 9892841898',
    import.meta.env.VITE_CONTACT_PHONE_SECONDARY ?? '+91 8169225516',
  ],
  supportLabel: import.meta.env.VITE_SUPPORT_LABEL ?? '24x7 customer support',
  address: import.meta.env.VITE_CONTACT_ADDRESS ?? 'India',
};

export function mailto(subject: string, body: string) {
  return `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
import { DEFAULT_SOCIAL_IMAGE, SITE_URL } from '../constants';

interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
}

function upsertMeta(
  selector: string,
  attributes: Record<string, string>
): HTMLMetaElement {
  let element = document.head.querySelector(
    selector
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });

  return element;
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const normalisedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`;

  return `${SITE_URL.replace(/\/+$/, '')}${normalisedPath}`;
}

export function setCanonical(pathOrUrl: string): void {
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = absoluteUrl(pathOrUrl);
}

export function setPageSeo(options: PageSeoOptions): void {
  const pageUrl = absoluteUrl(options.path);
  const imageUrl = absoluteUrl(
    options.image || DEFAULT_SOCIAL_IMAGE
  );

  document.title = options.title;
  setCanonical(pageUrl);

  upsertMeta('meta[name="description"]', {
    name: 'description',
    content: options.description,
  });

  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: options.noIndex
      ? 'noindex, nofollow'
      : 'index, follow',
  });

  upsertMeta('meta[property="og:title"]', {
    property: 'og:title',
    content: options.title,
  });

  upsertMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: options.description,
  });

  upsertMeta('meta[property="og:url"]', {
    property: 'og:url',
    content: pageUrl,
  });

  upsertMeta('meta[property="og:image"]', {
    property: 'og:image',
    content: imageUrl,
  });

  upsertMeta('meta[property="og:type"]', {
    property: 'og:type',
    content: options.type || 'website',
  });

  upsertMeta('meta[name="twitter:card"]', {
    name: 'twitter:card',
    content: 'summary_large_image',
  });

  upsertMeta('meta[name="twitter:title"]', {
    name: 'twitter:title',
    content: options.title,
  });

  upsertMeta('meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: options.description,
  });

  upsertMeta('meta[name="twitter:image"]', {
    name: 'twitter:image',
    content: imageUrl,
  });
}

export const updateSeo = setPageSeo;

export function titleCaseSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function replaceJsonLd(
  id: string,
  data: Record<string, unknown>
): () => void {
  document.getElementById(id)?.remove();

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);

  return () => {
    document.getElementById(id)?.remove();
  };
}
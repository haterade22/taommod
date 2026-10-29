/**
 * Structured data (JSON-LD) that tells search engines what the site is: every page carries the WebSite and
 * Organization; pages add their own items (a breadcrumb trail, a news article) through BaseLayout's
 * `structuredData` prop.
 */

export const SITE = 'https://taommod.com';
const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;

export type JsonLd = Record<string, unknown>;

/** The site and the team behind the mod, on every page. */
export function siteGraph(): JsonLd[] {
  return [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'TAOM - Tales From the Age of Men',
      url: `${SITE}/`,
      logo: `${SITE}/images/logo-navbar.webp`,
      sameAs: [
        'https://discord.gg/taom',
        'https://www.youtube.com/@haterade_industries',
        'https://www.moddb.com/mods/tales-from-the-age-of-men',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': SITE_ID,
      name: 'TAOM - Tales From the Age of Men',
      alternateName: 'TAOM',
      url: `${SITE}/`,
      description: 'A Lord of the Rings total conversion mod for Mount & Blade II: Bannerlord.',
      inLanguage: 'en',
      publisher: { '@id': ORG_ID },
    },
  ];
}

/** A breadcrumb trail: [name, site path] pairs, the last one being the current page. */
export function breadcrumbs(items: [string, string][]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: new URL(path, SITE).href,
    })),
  };
}

/** A news post. */
export function newsArticle(post: { title: string; slug: string; excerpt?: string; publishedAt?: string }): JsonLd {
  return {
    '@type': 'BlogPosting',
    headline: post.title.slice(0, 110),
    description: post.excerpt || undefined,
    datePublished: post.publishedAt || undefined,
    url: `${SITE}/news/${post.slug}/`,
    mainEntityOfPage: `${SITE}/news/${post.slug}/`,
    image: `${SITE}/images/og-banner.jpg`,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
  };
}

/** The <script type="application/ld+json"> body; "<" is escaped so page text can never close the script early. */
export function jsonLdScript(extra: JsonLd[] = []): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [...siteGraph(), ...extra] }).replace(
    /</g,
    '\\u003c',
  );
}

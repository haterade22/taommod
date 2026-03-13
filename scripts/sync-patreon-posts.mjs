import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const outputPath = path.join(rootDir, 'src', 'data', 'patreon-posts.json');
const patreonBaseUrl = 'https://www.patreon.com';
const userAgent = 'TAOM Website Sync/1.0 (https://taommod.com)';

const defaultFeed = {
  syncedAt: null,
  source: 'patreon',
  posts: [],
};

function parseDotEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadLocalEnv() {
  try {
    const contents = await fs.readFile(envPath, 'utf8');
    return parseDotEnv(contents);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

function getEnvValue(localEnv, key) {
  return process.env[key] || localEnv[key] || '';
}

async function ensureOutputFile(feed = defaultFeed) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'User-Agent': userAgent,
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJsonResponse = contentType.includes('application/json') || contentType.includes('+json');
  const body = isJsonResponse ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === 'string' ? body : JSON.stringify(body?.errors || body?.error || body, null, 2);
    throw new Error(`Patreon request failed (${response.status} ${response.statusText}): ${message}`);
  }

  return body;
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  return fetchJson(`${patreonBaseUrl}/api/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}

async function fetchCampaignId(accessToken) {
  const response = await fetchJson(`${patreonBaseUrl}/api/oauth2/v2/campaigns?fields[campaign]=creation_name,url`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response?.data?.[0]?.id || '';
}

async function fetchAllPosts(accessToken, campaignId) {
  const posts = [];
  let nextCursor = '';

  do {
    const query = new URLSearchParams();
    query.set('fields[post]', 'title,content,published_at,url,is_public,embed_url,embed_data');
    query.set('page[count]', '100');
    if (nextCursor) {
      query.set('page[cursor]', nextCursor);
    }

    const response = await fetchJson(
      `${patreonBaseUrl}/api/oauth2/v2/campaigns/${campaignId}/posts?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    posts.push(...(response?.data ?? []));
    nextCursor = response?.meta?.pagination?.cursors?.next ?? '';
  } while (nextCursor);

  return posts;
}

function slugify(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/\son[a-z]+='[^']*'/gi, '')
    .replace(/\son[a-z]+=[^\s>]+/gi, '');
}

function normalizeUrl(value) {
  if (!value) return '';
  return new URL(value, patreonBaseUrl).toString();
}

function excerptFromHtml(html) {
  const plainText = stripHtml(html);
  if (!plainText) return '';
  return plainText.length <= 220 ? plainText : `${plainText.slice(0, 217).trimEnd()}...`;
}

function normalizePost(post, index) {
  const attributes = post.attributes ?? {};
  const title = (attributes.title || `Patreon Post ${index + 1}`).trim();
  const html = sanitizeHtml(attributes.content || '');
  const slugBase = slugify(title) || `post-${post.id}`;

  return {
    id: post.id,
    slug: `${slugBase}-${post.id}`,
    title,
    excerpt: excerptFromHtml(html),
    html,
    publishedAt: attributes.published_at || null,
    patreonUrl: normalizeUrl(attributes.url),
    embedUrl: normalizeUrl(attributes.embed_url),
    embedData: attributes.embed_data || null,
    isPublic: Boolean(attributes.is_public),
  };
}

async function main() {
  const localEnv = await loadLocalEnv();
  const clientId = getEnvValue(localEnv, 'PATREON_CLIENT_ID');
  const clientSecret = getEnvValue(localEnv, 'PATREON_CLIENT_SECRET');
  const refreshToken = getEnvValue(localEnv, 'PATREON_REFRESH_TOKEN');
  const configuredAccessToken = getEnvValue(localEnv, 'PATREON_ACCESS_TOKEN');

  if (!clientId || !clientSecret || (!refreshToken && !configuredAccessToken)) {
    console.warn('[patreon-sync] Missing Patreon credentials. Keeping cached post feed.');

    try {
      await fs.access(outputPath);
    } catch {
      await ensureOutputFile();
    }

    return;
  }

  let accessToken = configuredAccessToken;

  if (!accessToken) {
    try {
      const tokenResponse = await refreshAccessToken({ clientId, clientSecret, refreshToken });

      if (tokenResponse?.access_token) {
        accessToken = tokenResponse.access_token;
      }

      if (tokenResponse?.refresh_token && tokenResponse.refresh_token !== refreshToken) {
        console.warn(
          '[patreon-sync] Patreon returned a new refresh token. Update PATREON_REFRESH_TOKEN in your secrets.',
        );
      }
    } catch (error) {
      throw new Error(
        `Unable to obtain a Patreon access token because the refresh token flow failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else if (refreshToken) {
    refreshAccessToken({ clientId, clientSecret, refreshToken })
      .then((tokenResponse) => {
        if (tokenResponse?.refresh_token && tokenResponse.refresh_token !== refreshToken) {
          console.warn(
            '[patreon-sync] Patreon returned a new refresh token. Update PATREON_REFRESH_TOKEN in your secrets.',
          );
        }
      })
      .catch((error) => {
        console.warn(
          `[patreon-sync] Refresh token check failed, but the current access token still works: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  if (!accessToken) {
    throw new Error('Unable to obtain a Patreon access token.');
  }

  let campaignId = getEnvValue(localEnv, 'PATREON_CAMPAIGN_ID');
  if (!campaignId) {
    campaignId = await fetchCampaignId(accessToken);
  }

  if (!campaignId) {
    throw new Error('Unable to resolve PATREON_CAMPAIGN_ID from Patreon.');
  }

  const rawPosts = await fetchAllPosts(accessToken, campaignId);
  const posts = rawPosts
    .map((post, index) => normalizePost(post, index))
    .filter((post) => post.isPublic)
    .sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightTime - leftTime;
    });

  console.log(`[patreon-sync] Fetched ${rawPosts.length} posts, ${posts.length} of them public.`);

  await ensureOutputFile({
    syncedAt: new Date().toISOString(),
    source: 'patreon',
    posts,
  });

  console.log(`[patreon-sync] Synced ${posts.length} public Patreon posts.`);
}

main().catch(async (error) => {
  console.error(`[patreon-sync] ${error instanceof Error ? error.message : String(error)}`);
  console.warn('[patreon-sync] Using cached Patreon feed because the latest sync failed.');

  try {
    await fs.access(outputPath);
  } catch {
    await ensureOutputFile();
  }
});

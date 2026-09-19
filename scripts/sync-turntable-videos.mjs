import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_SOURCE = 'Z:\\TAOM Turntables\\batch-turntables';
const MANIFEST_PATH = path.join('src', 'data', 'armour-turntables.json');
const DEFAULT_LIMIT = 50;
const VERIFY_CONCURRENCY = 8;
const MAX_VERIFY_ATTEMPTS = 5;

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, '').split('=');
    return [key, valueParts.join('=') || 'true'];
  }),
);

const sourceDir = args.get('source') || DEFAULT_SOURCE;
const limit = args.has('all') ? Number.POSITIVE_INFINITY : Number.parseInt(args.get('limit') || `${DEFAULT_LIMIT}`, 10);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const baseUrl = new URL(args.get('base-url') || manifest.baseUrl);
if (baseUrl.protocol !== 'https:' || baseUrl.search || baseUrl.hash) {
  throw new Error('Turntable base URL must be HTTPS without a query or fragment.');
}
if (!(limit > 0)) throw new Error('Turntable limit must be a positive number.');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'Item',
});

function walkXmlFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkXmlFiles(fullPath));
    } else if (entry.name.endsWith('.xml')) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectArmourKeys() {
  const keys = new Set();
  const armoryDir = path.join('src', 'data', 'armory');
  const cultureDirs = fs
    .readdirSync(armoryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(armoryDir, entry.name));

  for (const cultureDir of cultureDirs) {
    for (const file of walkXmlFiles(cultureDir)) {
      const xml = fs.readFileSync(file, 'utf8');
      const parsed = parser.parse(xml);
      const items = parsed?.Items?.Item || [];
      for (const item of items) {
        if (item['@_id']) keys.add(item['@_id'].toLowerCase());
        if (item['@_mesh']) keys.add(item['@_mesh'].toLowerCase());
      }
    }
  }
  return keys;
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Turntable source folder not found: ${sourceDir}`);
  process.exit(1);
}

const armourKeys = collectArmourKeys();
const matchingVideos = fs
  .readdirSync(sourceDir)
  .filter((file) => file.toLowerCase().endsWith('.mp4'))
  .filter((file) => armourKeys.has(path.basename(file, path.extname(file)).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

const selectedVideos = matchingVideos.slice(0, limit);

const uploadedVideos = [];
const failures = [];
let nextVideoIndex = 0;
let checkedVideoCount = 0;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function verifyVideo(file) {
  const url = `${baseUrl.href.replace(/\/$/, '')}/${encodeURIComponent(file)}`;

  for (let attempt = 1; attempt <= MAX_VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20_000) });
      if (response.status === 404) return false;
      if (response.ok && response.headers.get('content-type')?.toLowerCase().startsWith('video/mp4')) return true;
      if (response.status !== 429 && response.status < 500) return `HTTP ${response.status}`;
    } catch (error) {
      if (attempt === MAX_VERIFY_ATTEMPTS) return error instanceof Error ? error.message : String(error);
    }

    await delay(1_000 * 2 ** (attempt - 1));
  }

  return 'Request failed after retries';
}

async function verifyWorker() {
  while (true) {
    const index = nextVideoIndex;
    nextVideoIndex += 1;
    if (index >= selectedVideos.length) return;

    const file = selectedVideos[index];
    const result = await verifyVideo(file);
    if (result === true) uploadedVideos.push(file);
    else if (result !== false) failures.push(`${file}: ${result}`);

    checkedVideoCount += 1;
    if (checkedVideoCount % 250 === 0 || checkedVideoCount === selectedVideos.length) {
      console.log(`Checked ${checkedVideoCount}/${selectedVideos.length}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(VERIFY_CONCURRENCY, selectedVideos.length) }, () => verifyWorker()));

if (failures.length > 0) {
  throw new Error(
    `Could not verify ${failures.length} videos. Existing manifest was preserved.\n${failures.join('\n')}`,
  );
}

uploadedVideos.sort((a, b) => a.localeCompare(b));

fs.writeFileSync(
  MANIFEST_PATH,
  `${JSON.stringify({ baseUrl: baseUrl.href.replace(/\/$/, ''), files: uploadedVideos }, null, 2)}\n`,
);

console.log(`Matched ${matchingVideos.length} armour videos in ${sourceDir}`);
console.log(`Verified ${uploadedVideos.length} uploaded videos out of ${selectedVideos.length} checked`);
console.log(`Updated ${MANIFEST_PATH}; no videos copied into the website`);

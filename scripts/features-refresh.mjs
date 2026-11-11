// Checks the Features page (src/data/features.json) against the current TAOM release on GitHub and writes a report of
// what changed. Used by the "refresh the features" routine; see CLAUDE.md (Features page).
//
//   node scripts/features-refresh.mjs          download the current release, update the special resource tables, write the report
//   node scripts/features-refresh.mjs --save   afterwards: record what was checked in src/data/features-sources.json,
//                                              so the next report lists only what is new since this refresh
//
// Since 11 Nov 2026 there is one build for everyone: the newest release on the bannerlord-1.5.x line (top of its
// CHANGELOG.md, made for Bannerlord 1.5.7). The bannerlord-1.4.5 branch (Bannerlord 1.4.8) is the legacy line and is
// not shown on the page. The head of bannerlord-1.5.x is the development code (Coming soon). The downloaded mod files
// and the report go to <temp>/taom-features-refresh/ (printed at the end).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = 'haterade22/TAOM';
const BRANCH = 'bannerlord-1.5.x';
const GAME = /^v?1\.5/;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const dataDir = path.join(root, 'src', 'data');
const featuresFile = path.join(dataDir, 'features.json');
const sourcesFile = path.join(dataDir, 'features-sources.json');
const workDir = path.join(os.tmpdir(), 'taom-features-refresh');
const save = process.argv.includes('--save');

const api = async (url) => {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${url}`, {
    headers: { 'User-Agent': 'taommod-features-refresh', Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub ${url}: HTTP ${response.status}`);
  return response.json();
};
const raw = async (ref, file) => {
  const response = await fetch(`https://raw.githubusercontent.com/${REPO}/${ref}/${file}`);
  if (!response.ok) throw new Error(`${ref}/${file}: HTTP ${response.status}`);
  return response.text();
};

const gameOf = (subModule) => (subModule.match(/id="Native"[^>]*version="v?([\d.*]+)/) || [])[1] || '';
const versionOf = (subModule) => (subModule.match(/<Version value="([^"]+)"/) || [])[1] || '';

// --- Which commit is the current release? ---
// The 1.5 line's CHANGELOG.md gets one "## vX.Y.Z (date)" section per release, newest first; that release's tag is the
// build. (Reading it costs no GitHub API call: unauthenticated use allows only 60 an hour.)
async function resolveRelease() {
  const changelog = await raw(BRANCH, 'CHANGELOG.md');
  const latest = changelog.match(/^## (v\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)/m);
  if (!latest) throw new Error(`No release heading in ${BRANCH}/CHANGELOG.md`);
  const tag = (await api('tags?per_page=100')).find((t) => t.name === latest[1]);
  if (!tag) throw new Error(`Release ${latest[1]} has no tag yet`);
  const sub = await raw(tag.commit.sha, 'Main/_Module/SubModule.xml');
  if (!GAME.test(gameOf(sub))) throw new Error(`${latest[1]} is not a Bannerlord 1.5 build (${gameOf(sub)})`);
  return { ref: tag.commit.sha, label: `tag ${latest[1]}`, date: `${latest[2]}T00:00:00Z` };
}

// --- Settings (TaomSettings.cs: every Mod Options entry with its group, description and default) ---
function parseSettings(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let group = '';
  let pending = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const g = line.match(/SettingPropertyGroup\("([^"]+)"/);
    if (g) group = g[1].replace(/\{=[^}]*\}/g, '');
    const p = line.match(/SettingProperty(Bool|Integer|FloatingInteger|Dropdown|Text)\("([^"]+)"/);
    if (p) {
      let block = line;
      let j = i;
      while (!/\)\]\s*$/.test(block) && j < i + 10) block += ' ' + lines[++j].trim();
      const hint = ((block.match(/HintText = "((?:[^"\\]|\\.)*)"/) || [])[1] || '').replace(/\{=[^}]*\}/g, '');
      pending = { group, name: p[2].replace(/\{=[^}]*\}/g, ''), hint };
      i = j;
      continue;
    }
    const prop = line.match(/public\s+[\w<>.]+\s+(\w+)\s*\{[^}]*\}\s*(?:=\s*(.+?);)?$/);
    if (prop && pending) {
      out.push({ ...pending, default: normaliseDefault(prop[2] || '') });
      pending = null;
    }
  }
  return out;
}

function normaliseDefault(value) {
  if (value === 'true') return 'On';
  if (value === 'false') return 'Off';
  const n = value.match(/^\(?(?:float\))?\s*(-?[\d.]+)f?$/);
  if (n) return n[1];
  if (/^".*"$/.test(value)) return value.slice(1, -1);
  return ''; // a named constant or a dropdown: not comparable here
}

const DIAGNOSTIC = /diagnos|debug|census|test mode|probe/i;

// --- Download the release ---
async function loadBuild(build) {
  const dir = path.join(workDir, 'release');
  fs.mkdirSync(dir, { recursive: true });
  const get = async (file) => {
    const text = await raw(build.ref, file);
    fs.writeFileSync(path.join(dir, path.basename(file)), text);
    return text;
  };
  const sub = await get('Main/_Module/SubModule.xml');
  const settingsSource = await get('Main/Features/TaomSettings.cs');
  const careers = await get('Main/_Module/ModuleData/career_system/taom_careers.xml').catch(() => '');
  const tree = await api(`git/trees/${build.ref}?recursive=1`);
  const folders = tree.tree
    .map((t) => t.path)
    .filter((p) => /^Main\/Features\/[^/]+$/.test(p) && !p.endsWith('.cs'))
    .map((p) => p.split('/')[2])
    .sort();

  // The special resource tables on the page read these.
  const tableDir = path.join(dataDir, 'special-resources');
  fs.mkdirSync(tableDir, { recursive: true });
  for (const file of [
    'special_resources/special_resources_config.xml',
    'special_resources/troop_resource_costs.xml',
    'elite_emissary/elite_emissary_config.xml',
  ]) {
    fs.writeFileSync(path.join(tableDir, path.basename(file)), await raw(build.ref, `Main/_Module/ModuleData/${file}`));
  }

  const settings = parseSettings(settingsSource);
  return {
    ...build,
    modVersion: versionOf(sub),
    game: gameOf(sub),
    settings,
    groups: [...new Set(settings.map((s) => s.group))].sort(),
    folders,
    careerCount: (careers.replace(/<!--[\s\S]*?-->/g, '').match(/<Career\s/g) || []).length,
    settingCount: settings.filter((s) => !DIAGNOSTIC.test(s.group) && !DIAGNOSTIC.test(s.name)).length,
  };
}

// --- The page's released cards (Coming soon cards are checked separately) ---
const releasedCards = (features) =>
  features.sections.flatMap((section) => section.cards.filter((card) => !card.coming));

const roundedCount = (n) => `${Math.floor(n / 100) * 100}+`;

async function main() {
  const features = JSON.parse(fs.readFileSync(featuresFile, 'utf8'));
  const previous = fs.existsSync(sourcesFile) ? JSON.parse(fs.readFileSync(sourcesFile, 'utf8')) : null;
  // Before 11 Nov 2026 the file held two builds; the supporter one is the baseline for the single build.
  const before = previous?.build ?? previous?.builds?.supporter;
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });

  const b = await loadBuild(await resolveRelease());
  // The newest development code (not released yet): what the Coming soon section can draw on.
  const devSource = await raw(BRANCH, 'Main/Features/TaomSettings.cs');
  fs.mkdirSync(path.join(workDir, 'development'), { recursive: true });
  fs.writeFileSync(path.join(workDir, 'development', 'TaomSettings.cs'), devSource);
  const devSettings = parseSettings(devSource);

  if (save) {
    const snapshot = {
      ref: b.ref,
      label: b.label,
      date: b.date,
      modVersion: b.modVersion,
      game: b.game,
      groups: b.groups,
      folders: b.folders,
    };
    fs.writeFileSync(
      sourcesFile,
      JSON.stringify({ checkedAt: new Date().toISOString().slice(0, 10), build: snapshot }, null, 2) + '\n',
    );
    console.log(`Saved what was checked to ${path.relative(root, sourcesFile)}.`);
    return;
  }

  const page = features.build;
  const r = [];
  r.push('# Features refresh report', '');
  r.push(
    `Mod files are in ${workDir} (release/: TaomSettings.cs, SubModule.xml, taom_careers.xml; development/: TaomSettings.cs).`,
    '',
  );

  r.push('## Current release', '');
  r.push(
    `- Source: ${b.label}, commit ${b.ref.slice(0, 8)} (${b.date.slice(0, 10)}), TAOM ${b.modVersion}, Bannerlord ${b.game}`,
  );
  r.push(
    `- Page says: TAOM ${page.modVersion}, ${page.game}, released ${page.released}, ${page.careerCount} careers, ${page.modOptionsCount} Mod Options`,
  );
  r.push(
    `- Now: ${b.careerCount} careers, ${b.settingCount} Mod Options (excluding diagnostics) -> "${roundedCount(b.settingCount)}"`,
  );
  if (b.modVersion !== page.modVersion)
    r.push(`- **New version: ${page.modVersion} -> ${b.modVersion}.** Update modVersion and released.`);
  const game = b.game.replace(/\.\*$/, '');
  if (!page.game.endsWith(game)) r.push(`- **Game version changed: page says ${page.game}, release needs ${game}.**`);
  r.push('');

  // Commits since the last refresh (feature and balance subjects are the useful ones).
  if (before?.ref && before.ref !== b.ref) {
    try {
      const cmp = await api(`compare/${before.ref}...${b.ref}`);
      const subjects = cmp.commits
        .map((c) => c.commit.message.split('\n')[0])
        .filter((s) => /^(feat|balance)/i.test(s));
      r.push(`### Feature commits since the last refresh (${cmp.total_commits} commits in all)`, '');
      r.push(...(subjects.length ? subjects.map((s) => `- ${s}`) : ['- none']), '');
    } catch (e) {
      r.push(`(Could not list commits since the last refresh: ${e.message})`, '');
    }
  }

  // New Mod Options groups and feature folders since the last refresh: likely new features.
  if (before) {
    const newGroups = b.groups.filter((g) => !before.groups.includes(g) && !DIAGNOSTIC.test(g));
    const goneGroups = before.groups.filter((g) => !b.groups.includes(g));
    const newFolders = b.folders.filter((f) => !before.folders.includes(f));
    const goneFolders = before.folders.filter((f) => !b.folders.includes(f));
    r.push(`### New since the last refresh (${before.modVersion})`, '');
    r.push(`- New Mod Options groups: ${newGroups.join(', ') || 'none'}`);
    for (const g of newGroups) {
      for (const s of b.settings.filter((x) => x.group === g)) r.push(`  - ${s.name} = ${s.default || '?'}: ${s.hint}`);
    }
    r.push(`- Removed Mod Options groups: ${goneGroups.join(', ') || 'none'}`);
    r.push(`- New feature folders (Main/Features): ${newFolders.join(', ') || 'none'}`);
    r.push(`- Removed feature folders: ${goneFolders.join(', ') || 'none'}`, '');
  } else {
    r.push('(No earlier refresh recorded: run with --save at the end so the next report can list what is new.)', '');
  }

  // Every setting the page names, checked against the release.
  const byName = new Map(b.settings.map((s) => [s.name, s]));
  const problems = [];
  for (const card of releasedCards(features)) {
    for (const s of card.settings || []) {
      const found = byName.get(s.name);
      if (!found) problems.push(`- "${card.title}": setting "${s.name}" is not in the release (renamed or removed)`);
      else if (found.default && found.default !== s.default)
        problems.push(`- "${card.title}": "${s.name}" default is ${found.default}, page says ${s.default}`);
    }
  }
  r.push('### Settings on the page', '');
  r.push(...(problems.length ? problems : ['- all match']), '');

  // Coming soon: has a card's feature reached the release?
  const relNames = new Set(b.settings.map((s) => s.name));
  const devNames = new Set(devSettings.map((s) => s.name));
  const comingCards = features.sections.flatMap((s) => s.cards).filter((card) => card.coming);
  r.push('## Coming soon cards', '');
  if (!comingCards.length) r.push('- none');
  for (const card of comingCards) {
    const watch = card.watch || [];
    const inRel = watch.filter((n) => relNames.has(n));
    const gone = watch.filter((n) => !devNames.has(n) && !relNames.has(n));
    let state = 'still only in development';
    if (inRel.length) state = `**now in the release** (${inRel.join(', ')}): move out of Coming soon`;
    if (gone.length) state += `; no longer in the code at all: ${gone.join(', ')} (dropped or renamed?)`;
    if (!watch.length) state = 'no watch list: check by hand';
    r.push(`- ${card.title}: ${state}`);
  }
  r.push('');

  // In the development code but not in the release, and not watched by any Coming soon card yet.
  const watched = new Set(comingCards.flatMap((card) => card.watch || []));
  // A setting counts as covered when a Coming soon card watches any setting of its Mod Options group; parked
  // features and per-realm colour fields are left out.
  const watchedGroups = new Set(devSettings.filter((s) => watched.has(s.name)).map((s) => s.group));
  const newDev = devSettings.filter(
    (s) =>
      !relNames.has(s.name) &&
      !watchedGroups.has(s.group) &&
      !DIAGNOSTIC.test(s.group) &&
      !DIAGNOSTIC.test(s.name) &&
      !/^Parked/i.test(s.hint) &&
      !/Realm Colours/.test(s.group),
  );
  r.push('## In development, not on the page yet (candidates for Coming soon)', '');
  if (!newDev.length) r.push('- none');
  for (const s of newDev) r.push(`- [${s.group}] ${s.name} = ${s.default || '?'}: ${s.hint}`);
  r.push('');

  const reportFile = path.join(workDir, 'report.md');
  fs.writeFileSync(reportFile, r.join('\n'));
  console.log('Special resource tables updated.');
  console.log(`Report: ${reportFile}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

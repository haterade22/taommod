import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Gallery sources live in gallery-media/ (not deployed). This script writes web-ready copies to
// public/images/gallery/ (generated, git-ignored): a full-size WebP and a small thumbnail per image,
// and a copy of each video. File names are hex-encoded so any source filename is URL-safe.

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const videoExtensions = new Set(['.mp4', '.m4v', '.mov', '.webm']);

const FULL_WIDTH = 2560;
const THUMB_WIDTH = 800;

const projectRoot = process.cwd();
const sourceDirectory = path.join(projectRoot, 'gallery-media');
const outputDirectory = path.join(projectRoot, 'public', 'images', 'gallery');

function safeBaseName(filename) {
  const extension = path.extname(filename);
  return Buffer.from(path.basename(filename, extension), 'utf8').toString('hex');
}

function isUpToDate(sourcePath, targetPath) {
  return existsSync(targetPath) && statSync(targetPath).mtimeMs >= statSync(sourcePath).mtimeMs;
}

mkdirSync(outputDirectory, { recursive: true });

const sourceFiles = readdirSync(sourceDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => {
    const extension = path.extname(name).toLowerCase();
    return imageExtensions.has(extension) || videoExtensions.has(extension);
  });

const expectedOutputs = new Set();
let written = 0;

for (const filename of sourceFiles) {
  const sourcePath = path.join(sourceDirectory, filename);
  const extension = path.extname(filename).toLowerCase();
  const base = safeBaseName(filename);

  if (videoExtensions.has(extension)) {
    const target = `${base}${extension}`;
    expectedOutputs.add(target);
    if (!isUpToDate(sourcePath, path.join(outputDirectory, target))) {
      copyFileSync(sourcePath, path.join(outputDirectory, target));
      written++;
    }
    continue;
  }

  const outputs = [
    { name: `${base}.webp`, width: FULL_WIDTH, quality: 82 },
    { name: `${base}-thumb.webp`, width: THUMB_WIDTH, quality: 78 },
  ];

  for (const output of outputs) {
    expectedOutputs.add(output.name);
    const targetPath = path.join(outputDirectory, output.name);
    if (isUpToDate(sourcePath, targetPath)) continue;
    await sharp(sourcePath, { animated: extension === '.gif' })
      .resize({ width: output.width, withoutEnlargement: true })
      .webp({ quality: output.quality })
      .toFile(targetPath);
    written++;
  }
}

for (const entry of readdirSync(outputDirectory, { withFileTypes: true })) {
  if (entry.isFile() && !expectedOutputs.has(entry.name)) {
    rmSync(path.join(outputDirectory, entry.name));
  }
}

console.log(`[gallery] ${sourceFiles.length} source files, ${written} web files written.`);

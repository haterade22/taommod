import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const videoExtensions = new Set(['.mp4', '.m4v', '.mov', '.webm']);
const supportedExtensions = new Set([...imageExtensions, ...videoExtensions]);

const projectRoot = process.cwd();
const galleryDirectory = path.join(projectRoot, 'public', 'images', 'gallery');
const safeGalleryDirectory = path.join(galleryDirectory, '_safe');

function safeFilenameFor(filename) {
  const extension = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, extension);
  return `${Buffer.from(baseName, 'utf8').toString('hex')}${extension}`;
}

mkdirSync(safeGalleryDirectory, { recursive: true });

const sourceFiles = readdirSync(galleryDirectory, { withFileTypes: true })
  .filter((entry) => {
    const extension = path.extname(entry.name).toLowerCase();
    return entry.isFile() && supportedExtensions.has(extension);
  })
  .map((entry) => entry.name);

const expectedSafeFiles = new Set();

for (const filename of sourceFiles) {
  const sourcePath = path.join(galleryDirectory, filename);
  const safeFilename = safeFilenameFor(filename);
  const targetPath = path.join(safeGalleryDirectory, safeFilename);

  expectedSafeFiles.add(safeFilename);

  if (!existsSync(targetPath) || statSync(sourcePath).mtimeMs > statSync(targetPath).mtimeMs) {
    copyFileSync(sourcePath, targetPath);
  }
}

for (const entry of readdirSync(safeGalleryDirectory, { withFileTypes: true })) {
  if (!entry.isFile() || expectedSafeFiles.has(entry.name)) {
    continue;
  }

  rmSync(path.join(safeGalleryDirectory, entry.name));
}

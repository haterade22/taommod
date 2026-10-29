import { describe, expect, it } from 'vitest';
import { imageSize, sizeAttrs } from '../image-size';

describe('imageSize', () => {
  it('reads WebP sizes from public/', () => {
    expect(imageSize('/images/gondor_web_ready.webp')).toEqual({ width: 1920, height: 512 });
    expect(imageSize('/images/installinstructions-poster.webp')).toEqual({ width: 1280, height: 720 });
  });

  it('gives nothing for a missing file', () => {
    expect(imageSize('/images/does-not-exist.webp')).toBeNull();
    expect(sizeAttrs('/images/does-not-exist.webp')).toEqual({});
  });
});

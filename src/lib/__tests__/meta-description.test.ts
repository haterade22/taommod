import { describe, expect, it } from 'vitest';
import { metaDescription } from '../meta-description';

describe('metaDescription', () => {
  it('leaves short text alone (apart from spacing)', () => {
    expect(metaDescription('A  short\ndescription.')).toBe('A short description.');
  });

  it('keeps whole sentences that fit', () => {
    const text = `${'First sentence is here and it is fairly long so it fills about half. '.repeat(1)}Second sentence also fits nicely. Third sentence is the one that would push it far past the limit of the search result.`;
    const out = metaDescription(text);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith('.')).toBe(true);
    expect(out).toContain('Second sentence also fits nicely.');
  });

  it('cuts at a word with an ellipsis when no sentence fits', () => {
    const text = 'word '.repeat(80);
    const out = metaDescription(text);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith('word…')).toBe(true);
  });
});

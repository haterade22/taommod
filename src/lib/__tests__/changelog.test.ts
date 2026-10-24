import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseChangelog, renderBlocks, renderInline } from '../changelog';

describe('renderInline', () => {
  it('handles bold, italic, code and links, escaping HTML', () => {
    expect(renderInline('**Big** and _small_ with `a<b>` and [x](/y) & more')).toBe(
      '<strong>Big</strong> and <em>small</em> with <code>a&lt;b&gt;</code> and <a href="/y">x</a> &amp; more',
    );
  });

  it('leaves underscores inside ids alone', () => {
    expect(renderInline('`dg_uruk_*` and lord_ab1_8')).toBe('<code>dg_uruk_*</code> and lord_ab1_8');
  });
});

describe('renderBlocks', () => {
  it('nests lists and joins continuation lines', () => {
    const html = renderBlocks('- One\n  more\n  - Child\n- Two\n\nText');
    expect(html).toBe('<ul><li>One more<ul><li>Child</li></ul></li><li>Two</li></ul><p>Text</p>');
  });

  it('renders headings', () => {
    expect(renderBlocks('#### Troops\n- a')).toBe('<h4>Troops</h4><ul><li>a</li></ul>');
  });
});

describe('parseChangelog', () => {
  it('reads every version of the real CHANGELOG.md, newest first, with mod data split off', () => {
    const entries = parseChangelog(readFileSync(new URL('../../../CHANGELOG.md', import.meta.url), 'utf8'));
    expect(entries.length).toBeGreaterThanOrEqual(18);
    expect(entries.at(-1)?.version).toBe('1.0.0');
    const withMod = entries.filter((e) => e.modData);
    expect(withMod.length).toBeGreaterThanOrEqual(6);
    for (const e of entries) {
      expect(e.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(e.html + (e.modData?.html ?? '')).not.toMatch(/\*\*|^#/);
    }
  });
});

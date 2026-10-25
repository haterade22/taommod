import { describe, expect, it } from 'vitest';
import { packLords, renderLordCards, unpackLords, type LordCard } from '../lord-cards';

const lords: LordCard[] = [
  {
    name: 'Rûklash <the "Grim">',
    isLeader: true,
    alive: true,
    role: 'Infantry | Age 25',
    skills: [
      { label: 'One-Handed', value: 235 },
      { label: 'Riding', value: 0 },
      { label: 'Leadership', value: 400 },
    ],
    traits: [
      ['Valor', 2],
      ['Mercy', -1],
    ],
    biography: 'Born in Nurn & raised in Udûn.',
  },
  {
    name: 'Gothmog',
    isLeader: false,
    alive: false,
    role: 'Noble',
    skills: [
      { label: 'Riding', value: 120 },
      { label: 'One-Handed', value: 90 },
    ],
    traits: [],
    biography: '',
  },
];

describe('lord cards', () => {
  it('pack -> unpack gives back exactly the same cards (order, flags, skills, traits, text)', () => {
    const packed = JSON.parse(JSON.stringify(packLords({ clan_a: lords })));
    expect(unpackLords(packed, 'clan_a')).toEqual(lords);
    expect(packed.labels).toEqual(['One-Handed', 'Riding', 'Leadership']);
    expect(unpackLords(packed, 'missing')).toEqual([]);
  });

  it('renders the same markup from packed data as from the original data', () => {
    const packed = packLords({ clan_a: lords });
    expect(renderLordCards(unpackLords(packed, 'clan_a'))).toBe(renderLordCards(lords));
  });

  it('escapes text, caps bars at 100% and marks leader/dead/traits', () => {
    const html = renderLordCards(lords);
    expect(html).toContain('Rûklash &lt;the &quot;Grim&quot;&gt;');
    expect(html).toContain('Nurn &amp; raised');
    expect(html).toContain('style="width:100%"');
    expect(html).toContain('style="width:67.143%"');
    expect(html).toContain('<span class="leader-badge">Leader</span>');
    expect(html).toContain('<span class="dead-badge">Dead</span>');
    expect(html).toContain('<span class="trait-pill is-positive">Valor +2</span>');
    expect(html).toContain('<span class="trait-pill is-negative">Mercy -1</span>');
    expect(html.match(/<details/g)?.length).toBe(1);
  });
});

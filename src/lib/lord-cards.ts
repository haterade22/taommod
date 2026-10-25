/**
 * Lord card HTML for the faction pages' clan archive. Used on the server (LordCards.astro, for the clan shown first)
 * and in the browser (for other clans, drawn when they are opened), so both produce exactly the same markup.
 * Styles: factions/[id].astro's global block (under .clan-archive).
 */

export interface LordCard {
  name: string;
  isLeader: boolean;
  alive: boolean;
  role: string;
  skills: { label: string; value: number }[];
  traits: [string, number][];
  biography: string;
}

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Bar length: skill out of 350, at most full. Three decimals are far below a pixel. */
const barWidth = (value: number) => `${Math.round(Math.min((value / 350) * 100, 100) * 1000) / 1000}%`;

export function renderLordCards(lords: LordCard[]): string {
  return lords
    .map((lord) => {
      const badges =
        (lord.isLeader ? ' <span class="leader-badge">Leader</span>' : '') +
        (lord.alive ? '' : ' <span class="dead-badge">Dead</span>');
      const skills = lord.skills
        .map(
          (s) =>
            `<div class="skill-meter"><div class="skill-meter-top"><span>${esc(s.label)}</span> <strong>${s.value}</strong></div> ` +
            `<div class="skill-meter-track"><div class="skill-meter-fill" style="width:${barWidth(s.value)}"></div></div></div>`,
        )
        .join(' ');
      const traits = lord.traits.length
        ? `<div class="trait-list">${lord.traits
            .map(
              ([trait, value]) =>
                `<span class="trait-pill${value > 0 ? ' is-positive' : value < 0 ? ' is-negative' : ''}">${esc(trait)} ${value > 0 ? `+${value}` : value}</span>`,
            )
            .join(' ')}</div>`
        : '';
      const bio = lord.biography
        ? ` <details class="lord-biography"><summary>Biography</summary> <p>${esc(lord.biography)}</p></details>`
        : '';
      return (
        `<article class="lord-card"><header class="lord-card-header"><div><div class="lord-card-name-row">` +
        `<h3>${esc(lord.name)}</h3>${badges}</div> <p class="lord-card-role">${esc(lord.role)}</p></div></header> ` +
        `<div class="lord-skill-grid">${skills}</div> ${traits}${bio}</article>`
      );
    })
    .join('');
}

/**
 * Compact form for the page data: skill labels are the same for every lord, so they are listed once and each lord
 * carries only the numbers.
 */
export interface PackedLords {
  labels: string[];
  clans: Record<
    string,
    [name: string, flags: number, role: string, values: number[], traits: [string, number][], bio: string][]
  >;
}

export function packLords(byClan: Record<string, LordCard[]>): PackedLords {
  const labels: string[] = [];
  const index = new Map<string, number>();
  const clans: PackedLords['clans'] = {};
  for (const [clanId, lords] of Object.entries(byClan)) {
    clans[clanId] = lords.map((lord) => {
      for (const s of lord.skills) {
        if (!index.has(s.label)) {
          index.set(s.label, labels.length);
          labels.push(s.label);
        }
      }
      // Each lord keeps its own skill order: [labelIndex, value] pairs, flattened.
      const ordered = lord.skills.flatMap((s) => [index.get(s.label)!, s.value]);
      return [
        lord.name,
        (lord.isLeader ? 1 : 0) | (lord.alive ? 0 : 2),
        lord.role,
        ordered,
        lord.traits,
        lord.biography,
      ];
    });
  }
  return { labels, clans };
}

export function unpackLords(data: PackedLords, clanId: string): LordCard[] {
  return (data.clans[clanId] || []).map(([name, flags, role, ordered, traits, biography]) => {
    const skills: LordCard['skills'] = [];
    for (let i = 0; i < ordered.length; i += 2) skills.push({ label: data.labels[ordered[i]], value: ordered[i + 1] });
    return { name, isLeader: (flags & 1) === 1, alive: (flags & 2) === 0, role, skills, traits, biography };
  });
}

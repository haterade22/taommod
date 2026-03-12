// Faction troop branch descriptions
// Each branch: name, tier range, type (regular/noble/regional/unique), region (if applicable), description

export interface TroopBranch {
  name: string;
  tiers: string;
  type: 'regular' | 'noble' | 'regional' | 'unique';
  region?: string;
  status?: 'done' | 'wip';
  description: string;
}

export const FACTION_TROOPS: Record<string, TroopBranch[]> = {
  mordor: [
    {
      name: 'Snaga Troops',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        "The lowest of Mordor's filth — malnourished, cowardly goblins driven by fear and hunger. Snaga serve as expendable fodder, armed with scraps and sent to die in droves to wear the enemy down.",
    },
    {
      name: 'Mordor Orc Troops',
      tiers: 'T1–T5',
      type: 'regular',
      description:
        "The backbone of Mordor's armies, cruel and vicious but organized under dark captains. They form the bulk of Sauron's host — sword, spear, and bow wielders forged through endless wars.",
    },
    {
      name: 'Warg Rider Troops',
      tiers: 'T1–T6',
      type: 'regional',
      region: 'Nurn',
      description:
        'Swift and savage riders from the plains of Nurn, trained to fight from the backs of snarling wargs. They strike in raids and flanking maneuvers, harassing foes before the main host arrives.',
    },
    {
      name: 'Uruk Troops',
      tiers: 'T2–T6',
      type: 'regional',
      region: 'Udun',
      description:
        'Stronger and more disciplined than common orcs, the Uruks are bred for frontline warfare. They fight with heavy weapons and grim efficiency, leading charges that crush weaker armies.',
    },
    {
      name: 'Black Uruk Troops',
      tiers: 'T2–T7',
      type: 'regional',
      region: 'Seregost',
      status: 'done',
      description:
        "Elite shock troops of Barad-dûr, clad in black iron and wielding massive weapons. Their discipline and cruelty make them among Mordor's most feared orcs, standing shoulder to shoulder with human elites.",
    },
    {
      name: 'Black Numenorean Troops',
      tiers: 'T5–T9',
      type: 'regional',
      region: 'Narghil',
      description:
        "Descendants of fallen men who once served the Dark Lord, now twisted into zealots of shadow. They are cold, fanatical warriors — knights and captains devoted to the dark faith of Sauron's dominion.",
    },
    {
      name: 'Morgul Troops',
      tiers: 'T5–T9',
      type: 'unique',
      region: 'Minas Morgul',
      description:
        'The cursed soldiers of Minas Morgul, touched by the power of the Nazgûl. Shrouded in dread, they fight with maces, shields, and bows — or ride forth as ghostly knights radiating terror and death.',
    },
  ],

  gundabad: [
    {
      name: 'Snaga Troops',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        "The lowest of Gundabad's ranks — starved, filthy slaves driven into battle as expendable fodder. They fight in swarms with crude weapons and overwhelming numbers, dying by the hundreds to exhaust the enemy.",
    },
    {
      name: 'Snow Orc Troops',
      tiers: 'T1–T5',
      type: 'regular',
      description:
        "Hardier than the wretches of Mordor, the Snow Orcs are the backbone of Gundabad's armies — savage hill-fighters armed with spears, shields, and bows, bred for endurance in the frozen north.",
    },
    {
      name: 'Pale Uruk Troops',
      tiers: 'T2–T7',
      type: 'regional',
      status: 'done',
      description:
        "The elite warriors of Gundabad, pale-skinned and clad in jagged frost-forged armor. They form the disciplined core of Azog and Bolg's hosts — brutal shock troops wielding heavy blades, polearms, and maces with cold precision.",
    },
    {
      name: 'Half-Troll Troops',
      tiers: 'T4–T9',
      type: 'unique',
      description:
        'Towering beasts born of troll and orc blood, half-trolls are monstrous warriors of immense strength and endurance. Whether wielding massive two-handed mauls or crushing foes behind heavy shields, they are living engines of destruction feared by all who face them.',
    },
  ],

  dolguldur: [
    {
      name: 'Goblin Troops',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        "The lowest breed of Dol-Guldur's servants, filthy and half-starved, used as scouts and fodder. They swarm enemies in numbers, relying on ambushes and poisoned darts rather than discipline.",
    },
    {
      name: 'Guldur Orc Troops',
      tiers: 'T1–T5',
      type: 'regular',
      description:
        "The backbone of Dol-Guldur's armies — cruel, disciplined orcs forged under the Necromancer's rule. They form mixed spear and bow formations, using poisoned blades and heavy shields.",
    },
    {
      name: 'Guldur Uruk Troops',
      tiers: 'T2–T7',
      type: 'regional',
      status: 'done',
      description:
        "The heavy infantry of Dol-Guldur, disciplined and rune-scarred, forged in the fortress' dark forges. They march in silence, their armor etched with glowing runes, serving as the army's iron core.",
    },
    {
      name: 'Uruk Berserker Troops',
      tiers: 'T3–T8',
      type: 'regional',
      description:
        'Pit-born monstrosities carved with runes of rage, their flesh branded and blood boiling with shadow. They wield massive two-handed weapons and fight until death, feared even by other uruks.',
    },
    {
      name: 'Warg Rider Troops',
      tiers: 'T2–T6',
      type: 'regional',
      description:
        'Lean, feral orcs riding gaunt black wargs, trained to strike from the mist and vanish. They fight as light skirmish cavalry, hurling javelins and spreading terror among the weak.',
    },
    {
      name: "Khamul's Troops",
      tiers: 'T4–T9',
      type: 'unique',
      description:
        'Men of the East who swore their souls to Khamûl, the Ringwraith of Dol-Guldur. They are disciplined, silent soldiers — black-armored archers, infantry, and cavalry bound by sorcery and faith.',
    },
  ],
};

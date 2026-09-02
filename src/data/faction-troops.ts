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

  goblin: [
    {
      name: 'Goblin Infantry',
      tiers: 'T0–T5',
      type: 'regular',
      description:
        'Warriors, brawlers, raiders, impalers, and ravagers swarming up from the tunnels of Goblin-town. Lightly armored but numberless, they overwhelm enemies through sheer weight of bodies and brutal close-quarters fury.',
    },
    {
      name: 'Goblin Skirmishers',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        'Hunters, lurkers, sentries, and archers who haunt the high passes and ambush travelers on the mountain roads. They rely on shortbows, poisoned shafts, and the darkness of the tunnels to fight on their own terms.',
    },
    {
      name: 'Goblin Bone Breakers',
      tiers: 'T5–T6',
      type: 'regional',
      description:
        'The largest and meanest of the High Pass goblins, oversized brutes who wade into the front line and crush armored foes with two-handed mauls and sheer weight.',
    },
  ],

  mistymountainorcs: [
    {
      name: 'Misty Orc Infantry',
      tiers: 'T0–T5',
      type: 'regular',
      description:
        'Warriors, brawlers, raiders, impalers, and ravagers bred for war in the cold peaks from Mount Gram to the gates of Moria. Hardier than their goblin cousins, they hold the high places and answer the call of the Shadow.',
    },
    {
      name: 'Misty Orc Skirmishers',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        'Hunters, lurkers, sentries, and archers who patrol the cliff-edges and deep delvings of the Misty Mountains, picking off Free Peoples scouts long before they reach the orc-host.',
    },
    {
      name: 'Orc Bone Breakers',
      tiers: 'T5–T6',
      type: 'regional',
      description:
        'The shock troops of the mountain host — massive armored orcs who shatter shieldwalls and break enemy lines with crushing two-handed weapons.',
    },
  ],

  bluecraig: [
    {
      name: 'Blue Craig Infantry',
      tiers: 'T0–T5',
      type: 'regular',
      description:
        'Warriors, brawlers, raiders, impalers, and ravagers boiling out of the warrens beneath the western Ered Luin. Cut off from their Misty Mountain kin by the whole width of Eriador, they make up for poor arms with numbers and spite.',
    },
    {
      name: 'Blue Craig Skirmishers',
      tiers: 'T0–T4',
      type: 'regular',
      description:
        'Hunters, lurkers, sentries, and archers who watch the Dwarf-roads and the shores of Lune. They shoot from the crags above the Grey Havens and melt back into the rock before the Elves of Mithlond can answer.',
    },
    {
      name: 'Goblin Bone Breakers',
      tiers: 'T5–T6',
      type: 'regional',
      description:
        'Oversized brutes who anchor the Blue Craig line, crushing armoured foes with two-handed mauls where the lighter goblins cannot hold.',
    },
    {
      name: "Skarnak's Ironfang",
      tiers: 'T6',
      type: 'unique',
      description:
        "The warlord Skarnak's own guard — the heaviest-armoured goblins of the western warrens, held back until the shield line needs breaking.",
    },
  ],

  lindon: [
    {
      name: 'Mithlond Infantry',
      tiers: 'T2–T6',
      type: 'regular',
      description:
        'The Falathrim line, from Mithlond recruits through swordguards and noblemen to blademasters. Few in number but drawn from Elves who have borne arms since the First Age, they hold ground no mortal levy could.',
    },
    {
      name: 'Mithlond Archers',
      tiers: 'T2–T6',
      type: 'regular',
      description:
        'Bowmen, archers, marksmen, and marchwardens of the Grey Havens, keeping the Gulf of Lune and the roads to the Blue Mountains clear of goblin raiders.',
    },
    {
      name: 'Falathrim Cavalry',
      tiers: 'T5–T7',
      type: 'regular',
      description:
        'Outriders, lancers, royal guards, and knights. Lindon is the only Elven realm in TAOM to field both heavy horse and horse archers — the Riders of Balar shoot from the saddle at a level no other Elven culture reaches.',
    },
    {
      name: 'Elenath Guard',
      tiers: 'T8',
      type: 'unique',
      status: 'done',
      description:
        "Círdan's highest captains — Aegedhrim, Megil Mallenloth, Rochannon and Megil-Aran Elenath. Level-51 heirs of Gondolin's fallen houses, the deepest tier any TAOM roster reaches.",
    },
  ],
};

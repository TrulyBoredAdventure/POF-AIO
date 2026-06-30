'use strict';

(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const data = root.POF_DATA || {};

  const S = (name, farm, size, level, stages, breeding, beans, foods, breeds, buyer, extra = {}) => ({
    name, farm, size, level, stages, breeding, beans, foods, breeds, buyer, ...extra
  });
  const B = (name, shiny = false, note = '') => ({ name, shiny, note });

  const speciesData = {
    Rabbit: S('Rabbit', 'Manor Farm', 'Small', 17,
      [0, 12, 21, 27], { interval: 5, max: 25, success: 40 },
      { Egg: 0, Child: 5, Adolescent: 25, Adult: 21, Elder: 17 },
      ['Flowers', 'Vegetables', 'Fruit', 'Seeds'],
      [B('Common brown rabbit'), B('Rellekkan cream rabbit'), B('Piscatorian cottontail rabbit'), B('Jackalope', true)],
      'Myfi', { perk: 'Like Rabbits', shiny: 'Jackalope' }),

    Chicken: S('Chicken', 'Manor Farm', 'Small', 28,
      [25, 38, 76, 113], { interval: 50, max: 250, success: 45 },
      { Egg: 4, Child: 8, Adolescent: 40, Adult: 34, Elder: 28 },
      ['Flowers', 'Vegetables', 'Seeds'],
      [B('Common white chicken'), B('Bandosian bantam chicken'), B('Varrockian red chicken'), B('Oomlie chicken'), B('Lizard chicken', true)],
      'Henrietta', { perk: 'Headless Chicken', shiny: 'Lizard chicken' }),

    Chinchompa: S('Chinchompa', 'Manor Farm', 'Small', 54,
      [0, 504, 882, 1134], { interval: 150, max: 750, success: 60 },
      { Egg: 0, Child: 50, Adolescent: 250, Adult: 213, Elder: 175 },
      ['Variety mush'],
      [B('Cobalt chinchompa'), B('Viridian chinchompa'), B('Grey chinchompa'), B('Carnivorous chinchompa'), B('Azure chinchompa'), B('Crimson chinchompa'), B('Crystal chinchompa'), B('Golden chinchompa', true)],
      'Mieliki Tapio', { perk: 'Crystallise', shiny: 'Golden chinchompa' }),

    Sheep: S('Sheep', 'Manor Farm', 'Medium', 35,
      [0, 24, 42, 54], { interval: 100, max: 500, success: 45 },
      { Egg: 0, Child: 16, Adolescent: 80, Adult: 68, Elder: 56 },
      ['Flowers', 'Vegetables', 'Fruit'],
      [B('White sheep'), B('Black sheep', false, 'Breed between 21:00 and 09:00 game time.'), B('Springsheared sheep', false, 'Spring'), B('Summerdown sheep', false, 'Summer'), B('Fallfaced sheep', false, 'Autumn'), B('Winterwold sheep', false, 'Winter'), B('Golden sheep', true)],
      'Ralph', { perk: 'Ewe Know Me', shiny: 'Golden sheep' }),

    Spider: S('Spider', 'Manor Farm', 'Medium', 64,
      [151, 227, 454, 680], { interval: 180, max: 900, success: 50 },
      { Egg: 25, Child: 50, Adolescent: 250, Adult: 213, Elder: 175 },
      ['Seeds', 'Meat'],
      [B('Spirit spider'), B('Night spider', false, 'Breed between 21:00 and 09:00 game time.'), B('Fever spider', false, 'Spring'), B('Giant spider', false, 'Summer'), B('Corpse spider', false, 'Autumn'), B('Ice spider', false, 'Winter'), B('Araxyte spider', true)],
      'Rumbleguts', { perk: 'NopeNopeNope', shiny: 'Araxyte spider' }),

    Zygomite: S('Zygomite', 'Manor Farm', 'Medium', 81,
      [0, 1008, 1764, 2268], { interval: 500, max: 2500, success: 70 },
      { Egg: 0, Child: 187, Adolescent: 850, Adult: 722, Elder: 595 },
      ['Mushrooms'],
      [B('Gloomshroom zygomite'), B('Arcspore zygomite'), B('Daemoncap zygomite'), B('Zanarian zygomite'), B('Magical zygomite', true)],
      'Zoe', { perk: 'Uncapped Potential', shiny: 'Magical zygomite' }),

    Cow: S('Cow', 'Manor Farm', 'Large', 49,
      [0, 72, 126, 162], { interval: 300, max: 1500, success: 70 },
      { Egg: 0, Child: 34, Adolescent: 170, Adult: 144, Elder: 119 },
      ['Flowers', 'Vegetables', 'Fruit'],
      [B('Kandarin cow'), B('Chocolate cow'), B('Strawberry cow'), B('Vanilla cow'), B('Harlequin cow', true)],
      'Milkshake', { perk: 'Milky, Milky', shiny: 'Harlequin cow' }),

    Yak: S('Yak', 'Manor Farm', 'Large', 71,
      [0, 806, 1412, 1814], { interval: 400, max: 2000, success: 60 },
      { Egg: 0, Child: 150, Adolescent: 750, Adult: 638, Elder: 525 },
      ['Flowers', 'Vegetables', 'Fruit'],
      [B('Fremennik yak'), B('Spirit yak'), B('Sacred yak', true)],
      'Prezleek', { perk: "Nigel's Gift", shiny: 'Sacred yak' }),

    Dragon: S('Dragon', 'Manor Farm', 'Large', 92,
      [1008, 1512, 3024, 4536], { interval: 1000, max: 5000, success: 80 },
      { Egg: 200, Child: 400, Adolescent: 2000, Adult: 1700, Elder: 1400 },
      ['Meat', 'Fish'],
      [B('Green dragon'), B('Blue dragon'), B('Red dragon'), B('Black dragon'), B('Royal dragon', true, 'Requires all three breath traits across the parents.')],
      'Raptor', { perk: 'Dragon Ultra Combo', shiny: 'Royal dragon' }),

    Frog: S('Frog', 'Ranch Out of Time', 'Small', 42,
      [72, 108, 216, 324], { interval: 200, max: 1000, success: null },
      { Egg: 10, Child: 21, Adolescent: 108, Adult: 91, Elder: 75 },
      ['Insects'],
      [B('Common green frog'), B('Golden poison frog'), B('Phantasmal poison frog'), B('Sky-blue poison frog'), B('Cactoad', true)],
      'Anphi', { perk: 'Flycatcher', shiny: 'Cactoad' }),

    Salamander: S('Salamander', 'Ranch Out of Time', 'Small', 102,
      [480, 720, 1440, 2160], { interval: 1005, max: 5025, success: null },
      { Egg: 36, Child: 72, Adolescent: 360, Adult: 306, Elder: 252 },
      ['Flowers', 'Insects', 'Seeds'],
      [B('Green salamander'), B('Black salamander'), B('Orange salamander'), B('Red salamander'), B('Wytchfire salamander', true)],
      'Steven', { perk: 'La La La La', shiny: 'Wytchfire salamander' }),

    Jadinko: S('Jadinko', 'Ranch Out of Time', 'Medium', 76,
      [408, 612, 1224, 1836], { interval: 700, max: 3500, success: null },
      { Egg: 64, Child: 129, Adolescent: 648, Adult: 550, Elder: 453 },
      ['Insects'],
      [B('Amphibious jadinko'), B('Aquatic jadinko'), B('Camouflaged jadinko'), B('Cannibal jadinko'), B('Carrion jadinko'), B('Common jadinko'), B('Diseased jadinko'), B('Draconic jadinko'), B('Igneous jadinko'), B('Shadow jadinko'), B('Luminous jadinko', true)],
      'Papa Mambo', { perk: 'The Old Black Magic', shiny: 'Luminous jadinko' }),

    Varanusaur: S('Varanusaur', 'Ranch Out of Time', 'Medium', 97,
      [660, 990, 1980, 2970], { interval: 800, max: 4000, success: null },
      { Egg: 126, Child: 252, Adolescent: 1260, Adult: 1071, Elder: 882 },
      ['Meat'],
      [B('Feral dinosaur'), B('Ripper dinosaur'), B('Venomous dinosaur'), B('Hypnotic dinosaur', true)],
      'Laniakea', { perk: 'Envenomed', shiny: 'Hypnotic dinosaur' }),

    'Arcane apoterrasaur': S('Arcane apoterrasaur', 'Ranch Out of Time', 'Large', 98,
      [1051, 1576, 3152, 4728], { interval: 1100, max: 5500, success: null },
      { Egg: 193, Child: 387, Adolescent: 1935, Adult: 1644, Elder: 1354 }, ['Meat'],
      [B('Arcane apoterrasaur'), B('Arcane apoterrasaur iratum'), B('Arcane apoterrasaur natura'), B('Arcane apoterrasaur lucidum', true)],
      'Glout', { perk: 'Arcane Elements', shiny: 'Arcane apoterrasaur lucidum' }),

    'Brutish dinosaur': S('Brutish dinosaur', 'Ranch Out of Time', 'Large', 100,
      [1080, 1620, 3240, 4860], { interval: 1100, max: 5500, success: null },
      { Egg: 207, Child: 414, Adolescent: 2070, Adult: 1759, Elder: 1449 }, ['Meat'],
      [B('Brutish dinosaur'), B('Beach dinosaur'), B('Forest dinosaur'), B('Magnificent dinosaur', true)],
      'General Bentnoze', { perk: 'Stubborn', shiny: 'Magnificent dinosaur' }),

    Scimitops: S('Scimitops', 'Ranch Out of Time', 'Large', 104,
      [1140, 1710, 3420, 5130], { interval: 1100, max: 5500, success: null },
      { Egg: 211, Child: 423, Adolescent: 2115, Adult: 1798, Elder: 1481 }, ['Meat'],
      [B('Scimitops'), B('Scimitops blavum'), B('Scimitops palus'), B('Scimitops lucidum', true)],
      'Doric', { perk: 'Living Mountain', shiny: 'Scimitops lucidum' }),

    'Bagrada rex': S('Bagrada rex', 'Ranch Out of Time', 'Large', 106,
      [1171, 1756, 3512, 5268], { interval: 1200, max: 6000, success: null },
      { Egg: 221, Child: 443, Adolescent: 2214, Adult: 1882, Elder: 1550 }, ['Meat'],
      [B('Bagrada rex'), B('Bagrada nemus'), B('Bagrada purpura'), B('Bagrada lucidum', true)],
      'Daya', { perk: 'King of Beasts', shiny: 'Bagrada lucidum' }),

    'Spicati apoterrasaur': S('Spicati apoterrasaur', 'Ranch Out of Time', 'Large', 108,
      [1200, 1800, 3600, 5400], { interval: 1200, max: 6000, success: null },
      { Egg: 230, Child: 459, Adolescent: 2295, Adult: 1951, Elder: 1607 }, ['Meat'],
      [B('Spicati apoterrasaur'), B('Spicati apoterrasaur purpura'), B('Spicati apoterrasaur tilia'), B('Spicati apoterrasaur lucidum', true)],
      'Wizard Ilona', { perk: 'Meteoric Rise', shiny: 'Spicati apoterrasaur lucidum' }),

    Asciatops: S('Asciatops', 'Ranch Out of Time', 'Large', 110,
      [1290, 1931, 3872, 5779], { interval: 1200, max: 6000, success: null },
      { Egg: 252, Child: 504, Adolescent: 2520, Adult: 2142, Elder: 1764 }, ['Meat'],
      [B('Asciatops'), B('Asciatops acta'), B('Asciatops aurum'), B('Asciatops lucidum', true)],
      'Evil Dave', { perk: 'Strong Stomach', shiny: 'Asciatops lucidum' }),

    'Corbicula rex': S('Corbicula rex', 'Ranch Out of Time', 'Large', 112,
      [1306, 1959, 3917, 5875], { interval: 1200, max: 6000, success: null },
      { Egg: 274, Child: 547, Adolescent: 2736, Adult: 2325, Elder: 1915 }, ['Meat'],
      [B('Corbicula rex'), B('Corbicula gelum'), B('Corbicula malum'), B('Corbicula lucidum', true)],
      'Thok', { perk: 'Roar', shiny: 'Corbicula lucidum' }),

    'Oculi apoterrasaur': S('Oculi apoterrasaur', 'Ranch Out of Time', 'Large', 115,
      [1440, 2160, 4320, 6480], { interval: 1300, max: 6500, success: null },
      { Egg: 301, Child: 603, Adolescent: 3015, Adult: 2562, Elder: 2110 }, ['Meat'],
      [B('Oculi apoterrasaur'), B('Oculi apoterrasaur glacies'), B('Oculi apoterrasaur oceanum'), B('Oculi apoterrasaur lucidum', true)],
      'Odd Billy', { perk: 'Master Farmer', shiny: 'Oculi apoterrasaur lucidum' }),

    Malletops: S('Malletops', 'Ranch Out of Time', 'Large', 117,
      [1500, 2250, 4500, 6750], { interval: 1300, max: 6500, success: null },
      { Egg: 327, Child: 655, Adolescent: 3276, Adult: 2785, Elder: 2293 }, ['Meat'],
      [B('Malletops'), B('Malletops palus'), B('Malletops purpura'), B('Malletops lucidum', true)],
      'Moia', { perk: 'Armoured Hide', shiny: 'Malletops lucidum' }),

    'Pavosaurus rex': S('Pavosaurus rex', 'Ranch Out of Time', 'Large', 118,
      [1591, 2386, 4772, 7158], { interval: 1400, max: 7000, success: null },
      { Egg: 360, Child: 720, Adolescent: 3600, Adult: 3060, Elder: 2520 }, ['Meat'],
      [B('Pavosaurus rex'), B('Pavosaurus desertum'), B('Pavosaurus nemus'), B('Pavosaurus lucidum', true)],
      'Irwinsson', { perk: 'Extinction', shiny: 'Pavosaurus lucidum' })
  };

  const pens = [
    { id: 'manor-small-1', farm: 'Manor Farm', name: 'Small Pen 1', size: 'Small', capacity: 6 },
    { id: 'manor-small-2', farm: 'Manor Farm', name: 'Small Pen 2', size: 'Small', capacity: 6 },
    { id: 'manor-medium-1', farm: 'Manor Farm', name: 'Medium Pen 1', size: 'Medium', capacity: 4 },
    { id: 'manor-medium-2', farm: 'Manor Farm', name: 'Medium Pen 2', size: 'Medium', capacity: 4 },
    { id: 'manor-large-1', farm: 'Manor Farm', name: 'Large Pen 1', size: 'Large', capacity: 3 },
    { id: 'manor-large-2', farm: 'Manor Farm', name: 'Large Pen 2', size: 'Large', capacity: 3 },
    { id: 'manor-breeding', farm: 'Manor Farm', name: 'Breeding Pen', size: 'Any', capacity: 4, breeding: true },
    { id: 'ranch-small', farm: 'Ranch Out of Time', name: 'Small Dinosaur Pen', size: 'Small', capacity: 6 },
    { id: 'ranch-medium', farm: 'Ranch Out of Time', name: 'Medium Dinosaur Pen', size: 'Medium', capacity: 4 },
    { id: 'ranch-large-1', farm: 'Ranch Out of Time', name: 'Large Dinosaur Pen 1', size: 'Large', capacity: 3 },
    { id: 'ranch-large-2', farm: 'Ranch Out of Time', name: 'Large Dinosaur Pen 2', size: 'Large', capacity: 3 },
    { id: 'ranch-breeding', farm: 'Ranch Out of Time', name: 'Breeding Pen', size: 'Any', capacity: 4, breeding: true }
  ];

  const stages = ['Egg', 'Child', 'Adolescent', 'Adult', 'Elder'];
  const stageAliases = { Baby: 'Child', Young: 'Child', Adolescence: 'Adolescent' };
  const foodUnitsPerTwoHours = { Small: 1, Medium: 3, Large: 6 };
  const buyerSchedules = {
    Small: { quantity: 12, days: 1 },
    Medium: { quantity: 8, days: 2 },
    Large: { quantity: 6, days: 3 }
  };
  const farmhands = ['None', 'Babysitter', 'Callia', 'Adam Antite', 'Custom'];
  const goalsExtended = ['XP', 'Beans', 'Produce', 'Breeding log', 'Shiny', 'Breeding output', 'Totem perk', 'Low maintenance'];


  function traitAllowedInSlot(traitName, species, slot) {
    const trait = data.traits.find(item => item.name === traitName);
    return Boolean(trait && trait.slots.includes(slot) && (!trait.species || trait.species.includes(species)));
  }

  function validateIdealPairPlan(plan) {
    const errors = [];
    [['Parent A', plan.parentA], ['Parent B', plan.parentB]].forEach(([parent, traits]) => {
      traits.forEach((traitName, index) => {
        const slot = index + 1;
        if (!traitAllowedInSlot(traitName, plan.species, slot)) {
          errors.push(`${parent} slot ${slot}: ${traitName} is not obtainable for ${plan.species}.`);
        }
      });
    });
    return { ...plan, valid: errors.length === 0, validationErrors: errors };
  }

  function idealPairPlan(species, goal = 'shiny') {
    const info = speciesData[species];
    if (!info) throw new Error(`Unknown species: ${species}`);
    const common = { species, farm: info.farm, size: info.size, target: info.shiny || 'Best offspring', special: false };
    let plan;
    if (goal === 'output') plan = { ...common,
      parentA: ['Studly', 'Studly', 'Studly'], parentB: ['Studly', 'Studly', 'Studly'],
      target: 'Maximum breeding success', reason: 'Six Studly traits give the strongest general-purpose breeding-success setup.',
      note: 'Studly is obtainable in slots 1, 2, and 3. Replace one only when a species-specific unlock or another breeding goal is more important.' };
    else if (goal === 'multi') plan = { ...common,
      parentA: ['Genetic Mutation', 'Genetic Instability', 'Genetic Instability'],
      parentB: ['Genetic Mutation', 'Genetic Instability', 'Genetic Instability'],
      target: 'Three-trait offspring', reason: 'Genetic Mutation is valid in slot 1, while Genetic Instability is valid in slots 2 and 3.',
      note: 'The wiki specifically recommends Mutation in slot 1 and Instability in slot 2 when progressing from two-trait parents.' };
    else if (goal === 'maintenance') plan = { ...common,
      parentA: ['Joyful', 'Immune', 'Studly'], parentB: ['Joyful', 'Immune', 'Studly'],
      target: 'Low maintenance', reason: 'Joyful is valid in slot 1, Immune is valid in slot 2, and Studly is valid in slot 3.',
      note: 'This matches the documented food-free/low-effort combination of Studly, Joyful, and Immune while respecting slot restrictions.' };
    else if (goal === 'log') plan = { ...common,
      parentA: ['Studly', 'Good Breeding', 'Genetic Instability'], parentB: ['Studly', 'Good Breeding', 'Genetic Instability'],
      target: 'Breed variety', reason: 'Studly is valid in slot 1; Good Breeding and Genetic Instability are both valid in slots 2 and 3.',
      note: `Target missing ${species} breeds in the Breeding Log tab; Good Breeding does not affect every special breed and seasonal conditions still apply.` };
    else if (goal === 'beans') plan = { ...common,
      parentA: ['Lucky', 'Lucky', 'Fortunate'], parentB: ['Lucky', 'Lucky', 'Fortunate'],
      target: 'Bean-sale offspring', reason: 'Lucky is valid in slots 1 and 2, while Fortunate is the strongest positive bean-sale trait for slot 3.',
      note: 'Use this as a bean-sale breeding layout. It favours valuable offspring over shiny odds or special trait inheritance.' };
    else if (species === 'Dragon') plan = { ...common, special: true, target: 'Royal dragon · 13/13',
      parentA: ['Frost Breath', 'Glistening', 'Radiant'],
      parentB: ['Poisonous Breath', 'Shock Breath', 'Radiant'],
      reason: 'All three breath traits are required across the pair. Glistening is valid in slot 2 and Radiant only in slot 3.',
      note: 'The breaths may be redistributed between slots 1 and 2 because each breath is valid in all three slots; both slot 3 positions should remain Radiant.' };
    else plan = { ...common, target: `${info.shiny || 'Shiny breed'} · 20/20`,
      parentA: ['Sparkling', 'Glistening', 'Radiant'], parentB: ['Sparkling', 'Glistening', 'Radiant'],
      reason: 'This is the maximum obtainable general shiny setup: Sparkling in slot 1, Glistening in slot 2, and Radiant in slot 3 on both parents.',
      note: `Target offspring: ${info.shiny || info.breeds.find(b => b.shiny)?.name || 'the shiny breed'}. Breed-specific conditions may still apply.` };
    return validateIdealPairPlan(plan);
  }

  Object.assign(data, {
    speciesData,
    species: Object.keys(speciesData),
    pens,
    stages,
    stageAliases,
    foodUnitsPerTwoHours,
    buyerSchedules,
    farmhands,
    goalsExtended,
    farms: ['Manor Farm', 'Ranch Out of Time'],
    idealPairPlan,
    traitAllowedInSlot,
    validateIdealPairPlan
  });

  root.POF_DATA = data;
})();

'use strict';

window.POF_DATA = (() => {
  const ALL = [1, 2, 3];
  const S23 = [2, 3];
  const S12 = [1, 2];
  const S3 = [3];

  const traits = [
    { name: 'Baroo', description: 'What does this ancient word mean?', species: ['Yak'], category: 'species', slots: ALL },
    { name: 'Baroo?', description: 'Is it a question? Speak to me, oh noble yak.', species: ['Yak'], category: 'species', slots: ALL },
    { name: 'Baroo Baroo', description: "Well, that's just rude.", species: ['Yak'], category: 'species', slots: ALL },
    { name: 'Big Boned', description: 'Puts on weight more easily.', category: 'physical', slots: ALL },
    { name: 'Butterface', description: 'Weight and speed improve, attractiveness falls.', category: 'physical', slots: ALL },
    { name: 'Chatty', description: "Won't be quiet. Cosmetic.", category: 'cosmetic', slots: ALL },
    { name: 'Chaotic', description: 'Walks the path of chaos.', species: ['Chicken'], category: 'achievement', slots: ALL },
    { name: 'Charmed', description: 'Happier and healthier than other animals.', category: 'care', slots: S23, effects: { happy: 1, healthy: 1 } },
    { name: 'Chief', description: 'Commands the warren. Dominant rabbit trait.', species: ['Rabbit'], category: 'species', slots: ALL },
    { name: 'Chocolatey Goodness', description: 'Raises the chance of chocolate cow offspring.', species: ['Cow'], category: 'breed', slots: ALL },
    { name: 'Constipated', description: 'Never produces dung.', category: 'produce', slots: ALL, negative: true },
    { name: 'Curvy', description: 'Weight and attractiveness improve, speed falls.', category: 'physical', slots: ALL },
    { name: 'Enigmatic', description: 'Unknown or no confirmed effect.', category: 'unknown', slots: ALL },
    { name: 'Evil', description: 'Required for the Bad Egg achievement.', category: 'achievement', slots: [2] },
    { name: 'Exalted', description: 'Awards 3% more XP when harvesting produce.', category: 'xp', slots: S3, effects: { xp: 3 } },
    { name: 'Fearless', description: "Doesn't fear dogs. Cosmetic.", category: 'cosmetic', slots: ALL },
    { name: 'Fortunate', description: 'Worth 5% more beans when sold.', category: 'beans', slots: S3, effects: { beans: 5 } },
    { name: 'Freak of Nature', description: 'Awards more Farming XP when curing disease.', category: 'xp', slots: S3 },
    { name: 'Frost Breath', description: 'One of three dragon breaths required to unlock royal dragon offspring.', species: ['Dragon'], category: 'royal', slots: ALL, effects: { royal: 'frost' } },
    { name: 'Fussy Eater', description: 'Puts on less weight.', category: 'physical', slots: [1], negative: true },
    { name: 'Genetic Inferiority', description: 'Offspring are less likely to have multiple traits.', category: 'multi', slots: S12, negative: true, effects: { multi: -2 } },
    { name: 'Genetic Instability', description: 'Strongly raises the chance that offspring have multiple traits.', category: 'multi', slots: S23, effects: { multi: 4 } },
    { name: 'Genetic Mutation', description: 'Raises the chance that offspring have multiple traits.', category: 'multi', slots: ALL, effects: { multi: 2 } },
    { name: 'Genius', description: 'Super smart. Cosmetic.', category: 'cosmetic', slots: [2] },
    { name: 'Giver', description: 'Awards 3% more XP when gathering produce.', category: 'xp', slots: ALL, effects: { xp: 3 } },
    { name: 'Glistening', description: 'Adds 3 percentage points to the shiny chance.', category: 'shiny', slots: S23, effects: { shiny: 3 } },
    { name: 'Glorious', description: 'A glorious chinchompa.', species: ['Chinchompa'], category: 'species', slots: ALL },
    { name: 'Golden Gift', description: 'Can yield a few coins while mucking out.', category: 'produce', slots: S3 },
    { name: 'Good', description: 'Really rather pleasant. Cosmetic.', category: 'cosmetic', slots: [2] },
    { name: 'Good Breeding', description: 'Raises the chance of offspring being a different breed from the parents.', category: 'breed', slots: S23, effects: { breedVariety: 2 } },
    { name: 'Handsome', description: 'More attractive than most.', category: 'physical', slots: S12 },
    { name: 'Hyperactive', description: 'Faster than most.', category: 'physical', slots: S12 },
    { name: 'Immune', description: 'Practically immune to disease.', category: 'care', slots: S23, effects: { healthy: 3, maintenance: 4 } },
    { name: 'Incy', description: 'An involuntarily cynical spider.', species: ['Spider'], category: 'species', slots: ALL },
    { name: 'Insane', description: "Thinks it's a biscuit. Cosmetic.", category: 'cosmetic', slots: ALL },
    { name: 'Jovial', description: 'Strong happiness benefit.', category: 'care', slots: S12, effects: { happy: 2, maintenance: 2 } },
    { name: 'Joyful', description: 'Almost always happy.', category: 'care', slots: ALL, effects: { happy: 3, maintenance: 3 } },
    { name: 'Lawful', description: 'Walks the path of law.', species: ['Chicken'], category: 'achievement', slots: ALL },
    { name: 'Limited Efficiency', description: 'More materials, but lower XP and bean value; worth 3% fewer beans.', category: 'produce', slots: ALL, negative: true, effects: { beans: -3, materials: 2, xp: -2 } },
    { name: 'Lithe', description: 'Speed and attractiveness improve, weight falls.', category: 'physical', slots: ALL },
    { name: 'Lucky', description: 'Worth 2% more beans when sold.', category: 'beans', slots: ALL, effects: { beans: 2 } },
    { name: 'Loyal', description: 'Required for the Ever So Clever achievement.', category: 'achievement', slots: ALL },
    { name: 'Mysterious', description: 'Unknown or no confirmed effect.', category: 'unknown', slots: S23 },
    { name: 'Neutral', description: 'Walks a neutral path.', species: ['Chicken'], category: 'achievement', slots: ALL },
    { name: 'Nice but Dim', description: 'About 14.4% more harvest XP, but 10% fewer beans and poorer materials.', category: 'xp', slots: S3, effects: { xp: 14.4, beans: -10, materials: -2 } },
    { name: 'Nuclear', description: 'A volatile chinchompa trait used for an achievement.', species: ['Chinchompa'], category: 'achievement', slots: ALL },
    { name: 'Nightmare', description: 'Extremely unattractive.', category: 'physical', slots: ALL, negative: true },
    { name: 'Old at Heart', description: 'Ages 5% faster.', category: 'growth', slots: ALL, effects: { growth: 5 } },
    { name: 'Owsla', description: 'Guards the warren. Dominant rabbit trait.', species: ['Rabbit'], category: 'species', slots: ALL },
    { name: 'Perfected', description: 'Improves weight, speed, and attractiveness.', category: 'physical', slots: S23 },
    { name: 'Plain', description: 'Less attractive.', category: 'physical', slots: ALL, negative: true },
    { name: 'Prize Specimen', description: 'Strongly improves weight, speed, and attractiveness.', category: 'physical', slots: S3 },
    { name: 'Producer', description: 'Chance to harvest more materials.', category: 'produce', slots: ALL, effects: { materials: 3 } },
    { name: 'Poisonous Breath', description: 'One of three dragon breaths required to unlock royal dragon offspring.', species: ['Dragon'], category: 'royal', slots: ALL, effects: { royal: 'poison' } },
    { name: 'Radiant', description: 'Adds 5 percentage points to the shiny chance.', category: 'shiny', slots: S3, effects: { shiny: 5 } },
    { name: 'Ravensworn', description: 'A title-gated mystery trait.', category: 'achievement', slots: [2] },
    { name: 'Regular', description: 'Produces dung every manure cycle where applicable.', category: 'produce', slots: ALL },
    { name: 'Robust', description: 'More resistant to disease.', category: 'care', slots: S12, effects: { healthy: 1, maintenance: 1 } },
    { name: 'Shock Breath', description: 'One of three dragon breaths required to unlock royal dragon offspring.', species: ['Dragon'], category: 'royal', slots: ALL, effects: { royal: 'shock' } },
    { name: 'Sickly', description: 'Gets sick more easily.', category: 'care', slots: [1], negative: true, effects: { healthy: -2, maintenance: -2 } },
    { name: 'Slowpoke', description: 'Slower than most.', category: 'physical', slots: [1], negative: true },
    { name: 'Smelly', description: 'Less attractive.', category: 'physical', slots: [2], negative: true },
    { name: 'Sparkling', description: 'Adds 2 percentage points to the shiny chance.', category: 'shiny', slots: ALL, effects: { shiny: 2 } },
    { name: 'Stingy', description: 'Chance to harvest fewer materials.', category: 'produce', slots: [1], negative: true, effects: { materials: -3 } },
    { name: 'Strawberry Scented', description: 'Raises the chance of strawberry cow offspring.', species: ['Cow'], category: 'breed', slots: ALL },
    { name: 'Stressed', description: 'Lowers breeding success.', category: 'breeding', slots: S12, negative: true, effects: { breeding: -3 } },
    { name: 'Strong Genes', description: 'Raises the chance that offspring match a parent breed.', category: 'breed', slots: ALL, effects: { breedSame: 2 } },
    { name: 'Studly', description: 'Strongly raises breeding success.', category: 'breeding', slots: ALL, effects: { breeding: 4 } },
    { name: 'Sullen', description: 'Strong happiness penalty.', category: 'care', slots: ALL, negative: true, effects: { happy: -3, maintenance: -2 } },
    { name: 'Surly', description: 'Worth 5% fewer beans when sold.', category: 'beans', slots: [1], negative: true, effects: { beans: -5 } },
    { name: 'Taker', description: 'Awards 3% less XP when gathering produce.', category: 'xp', slots: [1], negative: true, effects: { xp: -3 } },
    { name: 'Touch of Vanilla', description: 'Raises the chance of vanilla cow offspring.', species: ['Cow'], category: 'breed', slots: ALL },
    { name: 'Unlucky for Some', description: 'Worth 3% more beans, but poorer for XP or materials.', category: 'beans', slots: S3, effects: { beans: 3, xp: -1, materials: -1 } },
    { name: 'Unstable', description: 'A volatile chinchompa trait used for an achievement.', species: ['Chinchompa'], category: 'achievement', slots: ALL },
    { name: 'Virile', description: 'Raises breeding success.', category: 'breeding', slots: S12, effects: { breeding: 2 } },
    { name: 'Wincy', description: 'A nervous spider.', species: ['Spider'], category: 'species', slots: ALL },
    { name: 'Whimsical', description: 'Unknown or cosmetic effect.', category: 'unknown', slots: ALL },
    { name: 'Young at Heart', description: 'Ages 5% more slowly.', category: 'growth', slots: [1], effects: { growth: -5 } }
  ].sort((a, b) => a.name.localeCompare(b.name));

  const species = [
    'Rabbit', 'Chicken', 'Chinchompa', 'Sheep', 'Spider', 'Zygomite', 'Cow', 'Yak', 'Dragon',
    'Frog', 'Salamander', 'Jadinko', 'Dinosaur', 'Other'
  ];

  const goals = {
    output: {
      name: 'Maximum offspring',
      summary: 'Prioritises breeding success and rejects Stressed pairs.',
      ideal: 'Studly in as many available slots as practical; Virile is the second-best breeding trait.'
    },
    shiny: {
      name: 'Shiny hunting',
      summary: 'Counts the documented shiny bonus on both parents.',
      ideal: 'Sparkling / Glistening / Radiant on both parents. The six parent traits total 20 percentage points.'
    },
    multi: {
      name: 'Three-trait progression',
      summary: 'Prioritises offspring with additional trait slots.',
      ideal: 'For two-trait parents: Genetic Mutation in slot 1 and Genetic Instability in slot 2 on both parents.'
    },
    maintenance: {
      name: 'Low maintenance',
      summary: 'Prioritises stable happiness and disease resistance.',
      ideal: 'Joyful and Immune on each parent. Use the third slot for Studly, Producer, Giver, or another goal trait.'
    },
    profit: {
      name: 'Beans, XP, and produce',
      summary: 'Balances breeding volume, sale bonuses, growth speed, XP, and materials.',
      ideal: 'Studly for more offspring, then choose Lucky/Fortunate for sale value, Giver/Exalted/Nice but Dim for XP, or Producer for materials.'
    }
  };

  const animalValueGoals = [
    { id: 'Balanced', label: 'Balanced farm value' },
    { id: 'Breeding', label: 'Breeding output' },
    { id: 'Shiny', label: 'Shiny breeding' },
    { id: 'Beans', label: 'Bean sales' },
    { id: 'XPProduce', label: 'XP and produce' },
    { id: 'BreedingLog', label: 'Breeding-log progress' },
    { id: 'LowMaintenance', label: 'Low maintenance' }
  ];

  const breedingRates = {
    Rabbit: { interval: 5, max: 25, unit: 'minutes' },
    Chicken: { interval: 60, max: 300, unit: 'minutes' },
    Chinchompa: { interval: 120, max: 600, unit: 'minutes' },
    Sheep: { interval: 120, max: 600, unit: 'minutes' },
    Spider: { interval: 360, max: 1800, unit: 'minutes' },
    Zygomite: { interval: 480, max: 2400, unit: 'minutes' },
    Cow: { interval: 300, max: 1500, unit: 'minutes' },
    Yak: { interval: 300, max: 1500, unit: 'minutes' },
    Dragon: { interval: 1080, max: 5400, unit: 'minutes' }
  };

  return { traits, species, goals, animalValueGoals, breedingRates };
})();

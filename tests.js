'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

global.window = global;
global.OCR_aa_8px_mono_pof = require(path.join(__dirname, 'vendor', 'aa_8px_mono_pof.js'));
global.OCR_aa_12px_mono = require(path.join(__dirname, 'vendor', 'aa_12px_mono.js'));
for (const file of ['data.js', 'farmdata.js', 'vision.js', 'scanner.js', 'disease.js', 'core.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), { filename: file });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('loads the complete data sets', () => {
  assert.equal(POF_DATA.traits.length, 78);
  assert.equal(POF_DATA.species.length, 23);
  assert.equal(POF_DATA.pens.length, 12);
  assert.equal(POF_DISEASES.diseases.length, 6);
  assert.equal(Object.values(POF_DATA.speciesData).reduce((sum, item) => sum + item.breeds.length, 0), 114);
});

test('creates a full default state', () => {
  const state = POF_CORE.defaultState();
  assert.equal(state.pens.length, 12);
  assert.equal(state.buyers.length, 6);
  assert.equal(state.version, 2);
});

test('migrates saved animals from Pair Planner', () => {
  const state = POF_CORE.migrate({
    savedAnimals: [{ name: 'Hazel', species: 'Rabbit', gender: 'Female', traits: ['Studly'] }]
  });
  assert.equal(state.animals.length, 1);
  assert.equal(state.animals[0].name, 'Hazel');
  assert.equal(state.animals[0].breed, 'Common brown rabbit');
  assert.match(state.history[0].text, /Migrated 1 saved animal/);
});

test('calculates small-pen food duration', () => {
  const state = POF_CORE.defaultState();
  const pen = state.pens.find(item => item.id === 'manor-small-1');
  pen.foodQuantity = 100;
  state.animals = [
    POF_CORE.normaliseAnimal({ name: 'One', species: 'Rabbit', penId: pen.id }),
    POF_CORE.normaliseAnimal({ name: 'Two', species: 'Rabbit', penId: pen.id })
  ];
  assert.equal(POF_CORE.foodHoursRemaining(state, pen), 100);
});

test('applies bean-value traits', () => {
  const animal = POF_CORE.normaliseAnimal({ species: 'Rabbit', stage: 'Adolescent', traits: ['', '', 'Fortunate'] });
  const result = POF_CORE.beanEstimate(animal);
  assert.equal(result.base, 25);
  assert.equal(result.estimate, 26);
});

test('calculates the next rabbit growth stage', () => {
  const animal = POF_CORE.normaliseAnimal({ species: 'Rabbit', stage: 'Child', lastStageAt: '2026-06-17T00:00:00.000Z' });
  assert.equal(POF_CORE.growthDurationMinutes(animal), 12);
  assert.equal(POF_CORE.nextStage(animal), 'Adolescent');
  assert.equal(POF_CORE.nextStageDue(animal).toISOString(), '2026-06-17T00:12:00.000Z');
});

test('tracks all breeding-log entries', () => {
  const stats = POF_CORE.logStats(POF_CORE.defaultState());
  assert.equal(stats.total, 114);
  assert.equal(stats.complete, 0);
});


test('includes the automatic Animal Info scanner and omits publishing instructions', () => {
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
  assert.match(app, /Scan open Animal Info/);
  assert.match(app, /scanAnimalInfo/);
  assert.match(index, />Scan Animal</);
  assert.match(readme, /Scan Animal reads the open RuneScape Animal Info window/);
  assert(!/Publish on GitHub Pages/i.test(readme));
});

test('recognises tolerant scanner text', () => {
  const parsed = POF_SCANNER.parseInspectionText([
    'Name: Clover',
    'Rabbit',
    'Female',
    'Adolescent',
    'Health: 93%',
    'Happiness: 87%',
    'Sparkling',
    'Glistenng',
    'Radiant'
  ].join('\n'));
  assert.equal(parsed.name, 'Clover');
  assert.equal(parsed.species, 'Rabbit');
  assert.equal(parsed.gender, 'Female');
  assert.deepEqual(parsed.traits, ['Sparkling', 'Glistening', 'Radiant']);
  assert(parsed.confidence >= 85);
});


test('recognises the supplied Manor and Ranch screenshot glyph fixtures', () => {
  const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'scanner-fixtures.json'), 'utf8'));
  const stageCandidates = POF_DATA.stages;
  const traitCandidates = [...POF_DATA.traits.map(item => item.name), 'No Trait'];
  const breedCandidates = Object.values(POF_DATA.speciesData).flatMap(info =>
    info.breeds.flatMap(breed => [`Breed: ${breed.name} (male)`, `Breed: ${breed.name} (female)`])
  );
  const read = (rows, candidates) => POF_VISION.recogniseMask(POF_VISION.maskFromRows(rows), candidates).text;

  assert.equal(read(fixtures.norbert.stage, stageCandidates), 'Elder');
  assert.equal(read(fixtures.norbert.breed, breedCandidates), 'Breed: Black dragon (male)');
  assert.equal(read(fixtures.norbert.trait1, traitCandidates), 'Frost Breath');
  assert.equal(read(fixtures.norbert.trait2, traitCandidates), 'Glistening');
  assert.equal(read(fixtures.norbert.trait3, traitCandidates), 'Radiant');

  assert.equal(read(fixtures.shanna.stage, stageCandidates), 'Elder');
  assert.equal(read(fixtures.shanna.breed, breedCandidates), 'Breed: Malletops (female)');
  assert.equal(read(fixtures.shanna.trait1, traitCandidates), 'Giver');
  assert.equal(read(fixtures.shanna.trait2, traitCandidates), 'No Trait');
  assert.equal(read(fixtures.shanna.trait3, traitCandidates), 'No Trait');

  assert.equal(read(fixtures.daisy.stage, stageCandidates), 'Elder');
  assert.equal(POF_VISION.recogniseBreed(POF_VISION.maskFromRows(fixtures.daisy.breed)).text, 'Breed: Cobalt chinchompa (female)');
  assert.equal(read(fixtures.daisy.trait1, traitCandidates), 'Studly');
  assert.equal(read(fixtures.daisy.trait2, traitCandidates), 'Glistening');
  assert.equal(read(fixtures.daisy.trait3, traitCandidates), 'No Trait');

  assert.equal(POF_VISION.recogniseCandidates(POF_VISION.maskFromRows(fixtures.ralph_yak.stage), stageCandidates).text, 'Elder');
  assert.equal(POF_VISION.recogniseBreed(POF_VISION.maskFromRows(fixtures.ralph_yak.breed)).text, 'Breed: Spirit yak (male)');
  assert.equal(read(fixtures.ralph_yak.trait1, traitCandidates), 'Sparkling');
  assert.equal(read(fixtures.ralph_yak.trait2, traitCandidates), 'No Trait');
  assert.equal(read(fixtures.ralph_yak.trait3, traitCandidates), 'No Trait');

  assert.equal(POF_VISION.recogniseCandidates(POF_VISION.maskFromRows(fixtures.carly_sheep.stage), stageCandidates).text, 'Elder');
  assert.equal(POF_VISION.recogniseBreed(POF_VISION.maskFromRows(fixtures.carly_sheep.breed)).text, 'Breed: Fallfaced sheep (female)');
  assert.equal(read(fixtures.carly_sheep.trait2, traitCandidates), 'No Trait');
  assert.equal(read(fixtures.carly_sheep.trait3, traitCandidates), 'No Trait');

  const percentages = Array.from({ length: 101 }, (_, value) => `${value}%`);
  assert.equal(POF_VISION.recogniseCandidates(POF_VISION.maskFromRows(fixtures.hurrick_sheep.stage), stageCandidates).text, 'Elder');
  assert.equal(POF_VISION.recogniseBreed(POF_VISION.maskFromRows(fixtures.hurrick_sheep.breed)).text, 'Breed: Black sheep (male)');
  assert.equal(POF_VISION.recogniseCandidates(POF_VISION.maskFromRows(fixtures.hurrick_sheep.health), percentages).text, '42%');
  assert.equal(POF_VISION.recogniseCandidates(POF_VISION.maskFromRows(fixtures.hurrick_sheep.happiness), percentages).text, '51%');
  assert.equal(read(fixtures.hurrick_sheep.trait1, traitCandidates), 'Whimsical');
  assert.equal(read(fixtures.hurrick_sheep.trait2, traitCandidates), 'No Trait');
  assert.equal(read(fixtures.hurrick_sheep.trait3, traitCandidates), 'No Trait');
});


test('recognises gendered sheep labels and stacked two-word traits', () => {
  assert.equal(POF_VISION.canonicaliseBreedLine('Breed: Fallfaced ewe (female)'), 'Breed: Fallfaced sheep (female)');
  assert.equal(POF_VISION.canonicaliseBreedLine('Breed: Fallfaced ram (male)'), 'Breed: Fallfaced sheep (male)');

  const rect = { x: 0, y: 0, width: 95, height: 25, mode: 'trait' };
  const image = { width: 95, height: 25, data: new Uint8ClampedArray(95 * 25 * 4) };
  const paint = (mask, offsetY) => {
    const offsetX = Math.floor((95 - mask.width) / 2);
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        if (!mask.data[x + y * mask.width]) continue;
        const index = ((offsetX + x) + (offsetY + y) * 95) * 4;
        image.data[index] = 220;
        image.data[index + 1] = 220;
        image.data[index + 2] = 210;
        image.data[index + 3] = 255;
      }
    }
  };
  paint(POF_VISION.renderTextMask(OCR_aa_8px_mono_pof, 'Genetic'), 1);
  paint(POF_VISION.renderTextMask(OCR_aa_8px_mono_pof, 'Mutation'), 13);
  const result = POF_VISION.recogniseTraitBox(image, rect, [...POF_DATA.traits.map(item => item.name), 'No Trait']);
  assert.equal(result.text, 'Genetic Mutation');
});


test('covers every supported breed in scanner candidates', () => {
  const breeds = Object.values(POF_DATA.speciesData).flatMap(info => info.breeds.map(breed => breed.name));
  const candidates = new Set(breeds.flatMap(breed => [`Breed: ${breed} (male)`, `Breed: ${breed} (female)`]));
  assert.equal(candidates.size, breeds.length * 2);
  for (const breed of breeds) {
    for (const gender of ['male', 'female']) {
      const line = `Breed: ${breed} (${gender})`;
      assert(candidates.has(line), `missing scanner candidate: ${line}`);
      const mask = POF_VISION.renderTextMask(OCR_aa_8px_mono_pof, line);
      assert(mask.width > 0 && mask.height > 0, `unrenderable scanner candidate: ${line}`);
    }
  }
});

test('captures a responsive Animal Info region and uses the dedicated POF reader', () => {
  const originalReadPanelResponsive = POF_VISION.readPanelResponsive;
  const captures = [];
  POF_VISION.readPanelResponsive = image => {
    assert(image.width >= 501);
    assert(image.height >= 333);
    return {
      fields: {
        name: 'SHANNA',
        stage: 'Elder',
        breed: 'Breed: Malletops (female)',
        health: '0%',
        happiness: '0%',
        trait1: 'Giver',
        trait2: 'No Trait',
        trait3: 'No Trait'
      },
      diagnostics: { source: 'fixture' }
    };
  };
  try {
    const rgba = Buffer.alloc(760 * 560 * 4, 255);
    const api = {
      permissionPixel: true,
      rsLinked: true,
      rsWidth: 1000,
      rsHeight: 800,
      bindRegion: () => 1,
      bindFindSubImg: () => JSON.stringify([{ x: 202, y: 27 }]),
      bindGetRegion: (_handle, x, y, width, height) => {
        captures.push({ x, y, width, height });
        return rgba.toString('base64');
      }
    };
    const result = POF_SCANNER.scanAnimalInfo(api);
    assert.equal(result.ok, true);
    assert.equal(result.origin.x, 12);
    assert.equal(result.origin.y, 24);
    assert.deepEqual(captures, [{ x: 12, y: 24, width: 760, height: 560 }]);
    assert.equal(result.diagnostics.engine, 'pof-glyph-reader-v4');
    assert.equal(result.parsed.name, 'SHANNA');
    assert.equal(result.parsed.species, 'Malletops');
    assert.equal(result.parsed.breed, 'Malletops');
    assert.equal(result.parsed.gender, 'Female');
    assert.equal(result.parsed.stage, 'Elder');
    assert.equal(result.parsed.health, 0);
    assert.equal(result.parsed.happiness, 0);
    assert.deepEqual(result.parsed.traits, ['Giver']);
  } finally {
    POF_VISION.readPanelResponsive = originalReadPanelResponsive;
  }
});

test('extracts text from Alt1 OCR JSON responses', () => {
  const response = JSON.stringify({ fragments: [{ text: 'SHA', color: 1, index: 0 }, { text: 'NNA', color: 1, index: 3 }], text: 'SHANNA' });
  assert.equal(POF_SCANNER.extractOcrText(response), 'SHANNA');
  assert.equal(POF_SCANNER.cleanOcr(response), 'SHANNA');
});

test('dedicated scanner fields stay inside valid POF values', () => {
  const traits = new Set([...POF_DATA.traits.map(item => item.name), 'No Trait']);
  const stages = new Set(POF_DATA.stages);
  const breeds = new Set(Object.values(POF_DATA.speciesData).flatMap(info => info.breeds.map(breed => breed.name)));
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'scanner-fixtures.json'), 'utf8')).daisy;
  const stage = POF_VISION.recogniseMask(POF_VISION.maskFromRows(fixture.stage), [...stages]).text;
  const breedLine = POF_VISION.recogniseBreed(POF_VISION.maskFromRows(fixture.breed)).text;
  const trait1 = POF_VISION.recogniseMask(POF_VISION.maskFromRows(fixture.trait1), [...traits]).text;
  assert(stages.has(stage));
  assert(breeds.has(breedLine.replace(/^Breed:\s*/, '').replace(/\s*\((?:male|female)\)$/, '')));
  assert(traits.has(trait1));
});

test('includes self-correcting scanner review and debug export', () => {
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(app.includes('Confirm, learn, and save'));
  assert(app.includes('scannerCorrections'));
  assert(app.includes('Export failed-scan diagnostics'));
});

test('diagnoses a complete disease symptom set', () => {
  const disease = POF_DISEASES.diseases[0];
  const selections = Object.fromEntries(Object.keys(POF_DISEASES.bodyParts).map(part => [part, disease.symptoms[part][0]]));
  const result = POF_DISEASES.diagnose(selections);
  assert.equal(result.status, 'diagnosed');
  assert.equal(result.diagnosis, disease.name);
});

test('scores the maximum shiny trait pair', () => {
  const state = POF_CORE.defaultState();
  state.goal = 'shiny';
  state.parents[0].traits = ['Sparkling', 'Glistening', 'Radiant'];
  state.parents[1].traits = ['Sparkling', 'Glistening', 'Radiant'];
  const result = POF_CORE.evaluatePair(state);
  assert.equal(result.score, 20);
  assert.equal(result.percent, 100);
  assert.equal(result.headline, 'Perfect shiny setup');
});

test('scores the optimal royal dragon trait pair against the royal maximum', () => {
  const state = POF_CORE.defaultState();
  state.goal = 'shiny';
  state.parents[0].species = 'Dragon';
  state.parents[1].species = 'Dragon';
  state.parents[0].traits = ['Frost Breath', 'Glistening', 'Radiant'];
  state.parents[1].traits = ['Poisonous Breath', 'Shock Breath', 'Radiant'];
  const result = POF_CORE.evaluatePair(state);
  assert.equal(result.score, 13);
  assert.equal(result.max, 13);
  assert.equal(result.percent, 100);
  assert.equal(result.headline, 'Optimal royal dragon setup');
  assert(!result.recommendations.some(text => /Sparkling/.test(text)));
  assert(!result.recommendations.some(text => /Glistening on both/.test(text)));
});

test('locks royal dragon scoring until all three breaths are present', () => {
  const state = POF_CORE.defaultState();
  state.goal = 'shiny';
  state.parents[0].species = 'Dragon';
  state.parents[1].species = 'Dragon';
  state.parents[0].traits = ['Sparkling', 'Glistening', 'Radiant'];
  state.parents[1].traits = ['Sparkling', 'Glistening', 'Radiant'];
  const result = POF_CORE.evaluatePair(state);
  assert.equal(result.score, 0);
  assert.equal(result.max, 13);
  assert.match(result.headline, /Royal dragon locked/);
  assert(result.recommendations.some(text => /Frost Breath/));
  assert(result.recommendations.some(text => /Poisonous Breath/));
  assert(result.recommendations.some(text => /Shock Breath/));
});


test('rates an optimal royal-dragon parent as a keeper', () => {
  const state = POF_CORE.defaultState();
  const female = POF_CORE.normaliseAnimal({
    name: 'Frost Queen', species: 'Dragon', breed: 'Black dragon', gender: 'Female', stage: 'Adult',
    traits: ['Frost Breath', 'Glistening', 'Radiant']
  });
  const male = POF_CORE.normaliseAnimal({
    name: 'Storm King', species: 'Dragon', breed: 'Black dragon', gender: 'Male', stage: 'Adult',
    traits: ['Poisonous Breath', 'Shock Breath', 'Radiant']
  });
  state.animals = [female, male];
  const result = POF_CORE.rateAnimal(state, female, 'Shiny');
  assert.equal(result.recommendation, 'Keep');
  assert.equal(result.grade, 'S');
  assert.equal(result.bestUse, 'Royal dragon breeding');
  assert(result.reasons.some(text => /all three royal-dragon breath requirements/i.test(text)));
});

test('rates a bean-trait adolescent with an active buyer as sell now', () => {
  const state = POF_CORE.defaultState();
  const animal = POF_CORE.normaliseAnimal({
    name: 'Bean Bunny', species: 'Rabbit', gender: 'Female', stage: 'Adolescent',
    traits: ['Lucky', 'Unlucky for Some', 'Fortunate']
  });
  state.animals = [animal];
  state.breedingLog[POF_CORE.logKey(animal.species, animal.breed)] = true;
  state.buyers.find(buyer => buyer.id === 'manor-small').species = 'Rabbit';
  const result = POF_CORE.rateAnimal(state, animal, 'Beans');
  assert.equal(result.recommendation, 'Sell now');
  assert(result.sellScore > result.keepScore);
  assert.equal(result.beanEstimate.estimate, 28);
});

test('rates an ordinary child as grow then sell', () => {
  const state = POF_CORE.defaultState();
  const animal = POF_CORE.normaliseAnimal({ name: 'Youngster', species: 'Rabbit', gender: 'Female', stage: 'Child' });
  state.animals = [animal];
  state.breedingLog[POF_CORE.logKey(animal.species, animal.breed)] = true;
  const result = POF_CORE.rateAnimal(state, animal, 'Balanced');
  assert.equal(result.recommendation, 'Grow then sell');
});

test('protected animals are always kept', () => {
  const state = POF_CORE.defaultState();
  const animal = POF_CORE.normaliseAnimal({ name: 'Do Not Sell', species: 'Rabbit', stage: 'Adolescent', protected: true });
  state.animals = [animal];
  const result = POF_CORE.rateAnimal(state, animal, 'Beans');
  assert.equal(result.recommendation, 'Keep');
  assert.equal(result.keepScore, 100);
  assert.equal(result.sellScore, 0);
  assert.equal(result.bestUse, 'Protected stock');
});

test('adolescents do not satisfy mature breeding pen checks', () => {
  const state = POF_CORE.defaultState();
  const pen = state.pens.find(item => item.id === 'manor-breeding');
  state.animals = [
    POF_CORE.normaliseAnimal({ species: 'Rabbit', gender: 'Female', stage: 'Adolescent', penId: pen.id }),
    POF_CORE.normaliseAnimal({ species: 'Rabbit', gender: 'Male', stage: 'Adolescent', penId: pen.id })
  ];
  assert(POF_CORE.validatePen(state, pen).some(text => /No healthy mature/.test(text)));
});


test('provides an ideal pair plan for every supported species', () => {
  for (const species of POF_DATA.species) {
    const plan = POF_DATA.idealPairPlan(species, 'shiny');
    assert.equal(plan.parentA.length, 3);
    assert.equal(plan.parentB.length, 3);
    assert.equal(plan.species, species);
  }
});

test('uses the royal dragon 13-point ideal layout', () => {
  const plan = POF_DATA.idealPairPlan('Dragon', 'shiny');
  assert.deepEqual(plan.parentA, ['Frost Breath', 'Glistening', 'Radiant']);
  assert.deepEqual(plan.parentB, ['Poisonous Breath', 'Shock Breath', 'Radiant']);
  assert.match(plan.target, /13\/13/);
});


test('every ideal pair uses obtainable trait slots for every species and goal', () => {
  const goals = ['shiny', 'output', 'multi', 'maintenance', 'log'];
  for (const species of POF_DATA.species) {
    for (const goal of goals) {
      const plan = POF_DATA.idealPairPlan(species, goal);
      assert.equal(plan.valid, true, `${species}/${goal}: ${plan.validationErrors.join('; ')}`);
      for (const traits of [plan.parentA, plan.parentB]) {
        traits.forEach((trait, index) => {
          assert.equal(POF_DATA.traitAllowedInSlot(trait, species, index + 1), true, `${species}/${goal} slot ${index + 1}: ${trait}`);
        });
      }
    }
  }
});

test('documents key restricted breeding traits correctly', () => {
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Radiant').slots, [3]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Glistening').slots, [2, 3]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Good Breeding').slots, [2, 3]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Genetic Instability').slots, [2, 3]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Immune').slots, [2, 3]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Virile').slots, [1, 2]);
  assert.deepEqual(POF_DATA.traits.find(t => t.name === 'Ravensworn').slots, [2]);
});


test('scan recommendations default ordinary adolescent and adult animals to bean sales', () => {
  const state = POF_CORE.defaultState();
  for (const stage of ['Adolescent', 'Adult', 'Elder']) {
    const animal = POF_CORE.normaliseAnimal({ species: 'Rabbit', gender: 'Female', stage, traits: ['', '', ''] });
    state.animals = [animal];
    state.breedingLog[POF_CORE.logKey(animal.species, animal.breed)] = true;
    const advice = POF_CORE.actionableAnimalRecommendation(POF_CORE.rateAnimal(state, animal, 'Balanced'));
    assert.equal(advice.label, 'Sell now for beans', stage);
  }
});

test('scan recommendations only keep animals that clear the strict breeding threshold', () => {
  const state = POF_CORE.defaultState();
  const breeder = POF_CORE.normaliseAnimal({ species: 'Dragon', breed: 'Black dragon', gender: 'Female', stage: 'Adult', traits: ['Frost Breath', 'Glistening', 'Radiant'] });
  state.animals = [breeder];
  const advice = POF_CORE.actionableAnimalRecommendation(POF_CORE.rateAnimal(state, breeder, 'Shiny'));
  assert.equal(advice.label, 'Keep for breeding');
});

test('turns animal ratings into clear scan recommendations', () => {
  const state = POF_CORE.defaultState();
  const breeder = POF_CORE.normaliseAnimal({ species: 'Dragon', breed: 'Black dragon', gender: 'Female', stage: 'Adult', traits: ['Frost Breath', 'Glistening', 'Radiant'] });
  state.animals = [breeder];
  const keep = POF_CORE.actionableAnimalRecommendation(POF_CORE.rateAnimal(state, breeder, 'Shiny'));
  assert.match(keep.label, /^Keep/);
  const child = POF_CORE.normaliseAnimal({ species: 'Rabbit', gender: 'Female', stage: 'Child' });
  state.animals = [child];
  state.breedingLog[POF_CORE.logKey(child.species, child.breed)] = true;
  const sell = POF_CORE.actionableAnimalRecommendation(POF_CORE.rateAnimal(state, child, 'Balanced'));
  assert.equal(sell.label, 'Grow then sell for beans');
});



test('Ideal Pairs includes a beans goal with valid trait slots', () => {
  for (const species of POF_DATA.species) {
    const plan = POF_DATA.idealPairPlan(species, 'beans');
    assert.equal(plan.valid, true, `${species}: ${plan.validationErrors.join('; ')}`);
    assert.deepEqual(plan.parentA, ['Lucky', 'Lucky', 'Fortunate']);
    assert.deepEqual(plan.parentB, ['Lucky', 'Lucky', 'Fortunate']);
  }
});

test('search inputs debounce renders instead of re-rendering on every keypress', () => {
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(app.includes('function scheduleSearchRender'));
  assert(app.includes('setTimeout(() =>'));
  assert(!app.includes('preserveSearchFocus'));
  assert(app.includes("scheduleSearchRender('ideal-pair-search', renderIdealPairs)"));
  assert(app.includes("scheduleSearchRender('log-search', renderLog)"));
  assert(app.includes("scheduleSearchRender('reference-search', renderReference)"));
});


test('Dashboard Needs attention metric exposes a tooltip list', () => {
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(app.includes('function attentionTooltip'));
  assert(app.includes('attentionAttributes'));
  assert(app.includes('Hover to identify'));
  assert(app.includes('class="metric ${className}" ${attributes}'));
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

console.log(`\n${passed}/${tests.length} tests passed.`);
if (passed !== tests.length) process.exitCode = 1;


test('disease dropdown labels use complete descriptions', () => {
  const terse = ['Gas','Bloodshot','Scuffed','Soggy','Sweaty','Tapping','Click','Unsteady','Swollen','Coughs'];
  for (const part of Object.keys(POF_DISEASES.bodyParts)) {
    for (const symptom of POF_DISEASES.uniqueSymptoms(part)) {
      const label = POF_DISEASES.displaySymptom(part, symptom);
      if (terse.includes(symptom)) assert.notStrictEqual(label, symptom, `${part}: ${symptom} must be expanded`);
      assert.ok(label.length >= symptom.length, `${part}: ${symptom} display label should not be shorter`);
    }
  }
});

test('dragon two-word reader prioritises Poisonous Breath over Butterface', () => {
  const mask = POF_VISION.renderTextMask(OCR_aa_8px_mono_pof, 'Poisonous Breath');
  const result = POF_VISION.recogniseTrait(mask, { species: 'Dragon', breed: 'Black dragon' });
  assert.equal(result.text, 'Poisonous Breath');
  assert.notEqual(result.text, 'Butterface');
  assert.match(result.method, /dragon|word-reader/);
});


test('Ideal Pairs goal dropdown exposes Bean Sales in the live app code', () => {
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert(app.includes("beans: 'Bean Sales'"));
  assert(app.includes("else if (goal === 'beans')"));
});

test('index script cache version matches package version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert(index.includes(`app.js?v=${pkg.version}`));
  assert(!index.includes('2.5.2'));
});

'use strict';

(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const D = () => root.POF_DATA;

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = () => new Date().toISOString();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

  function defaultPens() {
    return D().pens.map(pen => ({
      ...pen,
      species: '',
      foodType: '',
      foodQuantity: 0,
      farmhand: 'None',
      totem: false,
      goal: 'XP',
      notes: ''
    }));
  }

  function defaultBuyers() {
    return D().farms.flatMap(farm => ['Small', 'Medium', 'Large'].map(size => ({
      id: `${farm === 'Manor Farm' ? 'manor' : 'ranch'}-${size.toLowerCase()}`,
      farm,
      size,
      species: '',
      desiredBreed: '',
      desiredTrait: '',
      preferenceBonus: 0,
      outfitBonus: 0,
      remaining: D().buyerSchedules[size].quantity,
      nextResetAt: '',
      notes: ''
    })));
  }

  function defaultState() {
    return {
      version: 2,
      activeTab: 'dashboard',
      goal: 'output',
      parents: [
        { name: 'Parent A', species: 'Rabbit', breed: 'Common brown rabbit', gender: 'Female', traits: ['', '', ''] },
        { name: 'Parent B', species: 'Rabbit', breed: 'Common brown rabbit', gender: 'Male', traits: ['', '', ''] }
      ],
      animals: [],
      pens: defaultPens(),
      breedingLog: {},
      buyers: defaultBuyers(),
      timers: [],
      disease: { head: '', eyes: '', legs: '', stomach: '', text: '' },
      scannerText: '',
      history: [],
      settings: {
        compact: false,
        notificationLeadMinutes: 15,
        sound: true,
        showCompletedLog: true,
        dashboardFarm: 'All',
        animalValueGoal: 'Balanced',
        animalValueSort: 'Saved order',
        scannerAutoScan: false,
        scannerCorrections: {},
        scannerScalePercent: 100
      }
    };
  }

  function normaliseAnimal(animal = {}) {
    const species = D().speciesData[animal.species] ? animal.species : 'Rabbit';
    const speciesInfo = D().speciesData[species];
    const defaultStage = speciesInfo.stages[0] > 0 ? 'Egg' : 'Child';
    return {
      id: animal.id || uid('animal'),
      name: animal.name || species,
      species,
      breed: animal.breed || speciesInfo.breeds[0]?.name || '',
      gender: ['Female', 'Male', 'Unknown'].includes(animal.gender) ? animal.gender : 'Unknown',
      stage: D().stages.includes(animal.stage) ? animal.stage : defaultStage,
      health: clamp(animal.health ?? 100, 0, 100),
      happiness: clamp(animal.happiness ?? 100, 0, 100),
      traits: Array.from({ length: 3 }, (_, index) => animal.traits?.[index] || ''),
      diseased: Boolean(animal.diseased),
      protected: Boolean(animal.protected),
      penId: animal.penId || '',
      lastStageAt: animal.lastStageAt || '',
      notes: animal.notes || '',
      createdAt: animal.createdAt || nowIso(),
      updatedAt: nowIso()
    };
  }

  function mergePens(saved = []) {
    const map = new Map(saved.map(pen => [pen.id, pen]));
    return defaultPens().map(base => ({ ...base, ...(map.get(base.id) || {}) }));
  }

  function mergeBuyers(saved = []) {
    const map = new Map(saved.map(buyer => [buyer.id, buyer]));
    return defaultBuyers().map(base => ({ ...base, ...(map.get(base.id) || {}) }));
  }

  function migrate(oldState) {
    const state = defaultState();
    if (!oldState || typeof oldState !== 'object') return state;

    if (oldState.version === 2) {
      return {
        ...state,
        ...oldState,
        animals: (oldState.animals || []).map(normaliseAnimal),
        pens: mergePens(oldState.pens),
        buyers: mergeBuyers(oldState.buyers),
        settings: { ...state.settings, ...(oldState.settings || {}) },
        disease: { ...state.disease, ...(oldState.disease || {}) }
      };
    }

    const legacyAnimals = oldState.savedAnimals || oldState.animals || [];
    state.animals = legacyAnimals.map(animal => normaliseAnimal({
      ...animal,
      breed: animal.breed || D().speciesData[animal.species]?.breeds?.[0]?.name,
      health: 100,
      happiness: 100
    }));
    if (oldState.parents) {
      state.parents = oldState.parents.map((parent, index) => ({
        ...state.parents[index],
        ...parent,
        breed: parent.breed || D().speciesData[parent.species]?.breeds?.[0]?.name || ''
      }));
    }
    if (oldState.goal) state.goal = oldState.goal;
    if (oldState.disease) state.disease = { ...state.disease, ...oldState.disease };
    state.history.push({ id: uid('event'), at: nowIso(), type: 'migration', text: `Migrated ${state.animals.length} saved animal${state.animals.length === 1 ? '' : 's'} from POF Pair Planner.` });
    return state;
  }

  function logEvent(state, text, type = 'info') {
    state.history.unshift({ id: uid('event'), at: nowIso(), type, text });
    state.history = state.history.slice(0, 200);
  }

  function speciesInfo(species) { return D().speciesData[species] || null; }
  function penInfo(state, penId) { return state.pens.find(pen => pen.id === penId) || null; }
  function animalsInPen(state, penId) { return state.animals.filter(animal => animal.penId === penId); }

  function isAnimalCompatibleWithPen(animal, pen) {
    const info = speciesInfo(animal.species);
    if (!info || !pen) return false;
    if (info.farm !== pen.farm) return false;
    return pen.size === 'Any' || info.size === pen.size;
  }

  function validatePen(state, pen) {
    const animals = animalsInPen(state, pen.id);
    const warnings = [];
    if (animals.length > pen.capacity) warnings.push(`Over capacity by ${animals.length - pen.capacity}.`);
    const incompatible = animals.filter(animal => !isAnimalCompatibleWithPen(animal, pen));
    if (incompatible.length) warnings.push(`${incompatible.length} animal${incompatible.length === 1 ? '' : 's'} do not fit this pen.`);
    const species = [...new Set(animals.map(animal => animal.species))];
    if (species.length > 1) warnings.push('Mixed species cannot share a pen.');
    if (pen.breeding && animals.length >= 2) {
      const mature = animals.filter(animal => ['Adult', 'Elder'].includes(animal.stage) && !animal.diseased);
      const hasFemale = mature.some(animal => animal.gender === 'Female');
      const hasMale = mature.some(animal => animal.gender === 'Male');
      if (!hasFemale || !hasMale) warnings.push('No healthy mature male/female breeding pair is recorded.');
    }
    if (animals.some(animal => animal.diseased)) warnings.push('Diseased animals cannot breed.');
    if (animals.some(animal => animal.health < 50 || animal.happiness < 50)) warnings.push('Low health or happiness may reduce results.');
    return warnings;
  }

  function traitByName(name) { return D().traits.find(trait => trait.name === name); }
  function selectedTraits(animal) { return (animal.traits || []).map(traitByName).filter(Boolean); }
  function traitEffects(animal) {
    return selectedTraits(animal).reduce((total, trait) => {
      Object.entries(trait.effects || {}).forEach(([key, value]) => {
        if (typeof value === 'number') total[key] = (total[key] || 0) + value;
      });
      return total;
    }, {});
  }

  function growthDurationMinutes(animal) {
    const info = speciesInfo(animal.species);
    if (!info || animal.stage === 'Elder') return null;
    const index = D().stages.indexOf(animal.stage);
    const base = info.stages[index];
    if (!base) return null;
    const growth = traitEffects(animal).growth || 0;
    return Math.round(base * (1 - growth / 100));
  }

  function nextStage(animal) {
    const index = D().stages.indexOf(animal.stage);
    return index >= 0 && index < D().stages.length - 1 ? D().stages[index + 1] : null;
  }

  function nextStageDue(animal) {
    const duration = growthDurationMinutes(animal);
    if (!duration || !animal.lastStageAt) return null;
    const started = Date.parse(animal.lastStageAt);
    if (!Number.isFinite(started)) return null;
    return new Date(started + duration * 60000);
  }

  function formatDuration(minutes) {
    if (minutes === null || !Number.isFinite(minutes)) return 'Unknown';
    const sign = minutes < 0 ? '-' : '';
    const total = Math.abs(Math.round(minutes));
    const days = Math.floor(total / 1440);
    const hours = Math.floor((total % 1440) / 60);
    const mins = total % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (mins || !parts.length) parts.push(`${mins}m`);
    return sign + parts.join(' ');
  }

  function foodHoursRemaining(state, pen) {
    const animals = animalsInPen(state, pen.id);
    if (!animals.length || !pen.foodQuantity) return animals.length ? 0 : null;
    const info = speciesInfo(animals[0].species);
    if (!info) return null;
    const units = D().foodUnitsPerTwoHours[info.size] || 1;
    const perHour = animals.length * units / 2;
    return perHour ? Number(pen.foodQuantity) / perHour : null;
  }

  function beanEstimate(animal, buyer = {}) {
    const info = speciesInfo(animal.species);
    if (!info) return { base: 0, estimate: 0, traitBonus: 0, preferenceBonus: 0, outfitBonus: 0, stage: animal.stage || '' };
    const base = Number(info.beans[animal.stage] || 0);
    const traitBonus = traitEffects(animal).beans || 0;
    const preferenceBonus = Number(buyer.preferenceBonus || 0);
    const outfitBonus = Number(buyer.outfitBonus || 0);
    const estimate = Math.max(0, Math.round(base * (1 + (traitBonus + preferenceBonus + outfitBonus) / 100)));
    return { base, estimate, traitBonus, preferenceBonus, outfitBonus, stage: animal.stage || '' };
  }


  function breedInfo(animal) {
    const info = speciesInfo(animal.species);
    return info?.breeds?.find(breed => breed.name === animal.breed) || null;
  }

  function isShinyAnimal(animal) {
    return Boolean(breedInfo(animal)?.shiny);
  }

  function isMature(animal) {
    return ['Adult', 'Elder'].includes(animal.stage);
  }

  function valueGoalWeights(goal) {
    const weights = {
      Balanced: { breeding: 2, shiny: 1.5, multi: 1.5, maintenance: 1.2, beans: 0.8, xp: 0.45, materials: 0.45, breedVariety: 1.2, breedSame: 0.4 },
      Breeding: { breeding: 4, shiny: 0.6, multi: 1.8, maintenance: 0.8, beans: 0.2, xp: 0.1, materials: 0.1, breedVariety: 1.2, breedSame: 0.5 },
      Shiny: { breeding: 0.8, shiny: 4, multi: 0.4, maintenance: 0.5, beans: 0.2, xp: 0.1, materials: 0.1, breedVariety: 0.4, breedSame: 0.2 },
      Beans: { breeding: 0.3, shiny: 0.3, multi: 0.1, maintenance: 0.2, beans: 3, xp: -0.1, materials: -0.1, breedVariety: 0.1, breedSame: 0.1 },
      XPProduce: { breeding: 0.4, shiny: 0.2, multi: 0.1, maintenance: 0.8, beans: 0, xp: 2.2, materials: 2.2, breedVariety: 0.1, breedSame: 0.1 },
      BreedingLog: { breeding: 2, shiny: 1.4, multi: 0.8, maintenance: 0.5, beans: 0.1, xp: 0.1, materials: 0.1, breedVariety: 3, breedSame: 0.5 },
      LowMaintenance: { breeding: 0.8, shiny: 0.2, multi: 0.2, maintenance: 4, beans: 0.1, xp: 0.1, materials: 0.1, breedVariety: 0.2, breedSame: 0.2 }
    };
    return weights[goal] || weights.Balanced;
  }

  function intrinsicAnimalValue(animal, goal = 'Balanced') {
    const effects = traitEffects(animal);
    const weights = valueGoalWeights(goal);
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => { score += Number(effects[key] || 0) * weight; });

    const traits = selectedTraits(animal);
    const names = traits.map(trait => trait.name);
    const functional = traits.filter(trait => !['cosmetic', 'unknown', 'physical'].includes(trait.category));
    score += functional.length * 1.5;
    score -= traits.filter(trait => trait.negative).length * 2;

    if (animal.species === 'Dragon') {
      const breaths = new Set(names.filter(name => ['Frost Breath', 'Poisonous Breath', 'Shock Breath'].includes(name)));
      const breathWeight = goal === 'Shiny' || goal === 'BreedingLog' ? 18 : goal === 'Beans' ? 3 : 12;
      score += breaths.size * breathWeight;
      if (breaths.size >= 2) score += 5;
    }

    if (isShinyAnimal(animal)) score += goal === 'BreedingLog' ? 15 : goal === 'Beans' ? 4 : 8;
    if (animal.traits.filter(Boolean).length === 3) score += 5;
    else if (animal.traits.filter(Boolean).length === 2) score += 2;
    return score;
  }

  function matchingBuyer(state, animal) {
    return (state.buyers || []).find(buyer => buyer.species === animal.species && Number(buyer.remaining || 0) > 0) || null;
  }

  function rateAnimal(state, animal, goal = state.settings?.animalValueGoal || 'Balanced') {
    const info = speciesInfo(animal.species);
    if (!info) return null;

    const traits = selectedTraits(animal);
    const names = traits.map(trait => trait.name);
    const effects = traitEffects(animal);
    const shiny = isShinyAnimal(animal);
    const missingLog = !state.breedingLog?.[logKey(animal.species, animal.breed)];
    const buyer = matchingBuyer(state, animal);
    const beans = beanEstimate(animal, buyer || {});
    const intrinsic = intrinsicAnimalValue(animal, goal);
    const peers = (state.animals || []).filter(other => other.id !== animal.id && other.species === animal.species);
    const sameGender = peers.filter(other => animal.gender !== 'Unknown' && other.gender === animal.gender);
    const maturePeers = peers.filter(isMature);
    const oppositeMature = maturePeers.some(other => animal.gender !== 'Unknown' && other.gender !== 'Unknown' && other.gender !== animal.gender);
    const onlyMatureGender = isMature(animal) && animal.gender !== 'Unknown' && !maturePeers.some(other => other.gender === animal.gender);
    const bestSameGender = sameGender.length ? Math.max(...sameGender.map(other => intrinsicAnimalValue(other, goal))) : null;
    const weakerDuplicate = bestSameGender !== null && bestSameGender >= intrinsic + 8;
    const strongestRole = bestSameGender !== null && intrinsic >= bestSameGender + 8;

    let keep = 22 + Math.max(-25, Math.min(48, intrinsic));
    let sell = { Egg: 2, Child: 6, Adolescent: 48, Adult: 30, Elder: 20 }[animal.stage] || 5;
    const reasons = [];
    const cautions = [];

    if (animal.protected) {
      keep = 100;
      sell = 0;
      reasons.push('Protected from buyer recommendations.');
    }

    if (isMature(animal) && intrinsic >= 14) {
      keep += 8;
      reasons.push('Adult or elder animals can breed now.');
    }
    if (animal.stage === 'Adolescent') {
      sell += 12;
      reasons.push('Adolescent is the best growth stage for bean sales.');
    } else if (['Egg', 'Child'].includes(animal.stage)) {
      cautions.push('It has not reached the optimal bean-sale stage yet.');
    } else if (animal.stage === 'Elder') {
      cautions.push('Elder bean value is lower than adolescent value; keep elders mainly for breeding, perks, XP, or produce.');
    }

    const positiveBeanBonus = Math.max(0, Number(effects.beans || 0));
    const negativeBeanBonus = Math.min(0, Number(effects.beans || 0));
    sell += positiveBeanBonus * 2;
    sell += negativeBeanBonus * 1.5;
    if (positiveBeanBonus) reasons.push(`Sale traits add ${positiveBeanBonus}% bean value.`);

    if (buyer) {
      sell += 12;
      reasons.push(`An active ${info.size.toLowerCase()} buyer is set for ${animal.species}.`);
      if (buyer.desiredBreed === animal.breed || (buyer.desiredTrait && names.includes(buyer.desiredTrait)) || shiny) sell += 8;
    }

    if (missingLog) {
      const boost = goal === 'BreedingLog' ? 24 : 3;
      keep += boost;
      if (goal === 'BreedingLog') sell -= 18;
      reasons.push(`${animal.breed} is still missing from the saved breeding log.`);
    }

    if (shiny) {
      reasons.push('Shiny breed: useful for the log and as a buyer preference wildcard.');
      if (!(effects.shiny > 0)) cautions.push('Being a shiny breed does not raise future shiny odds without Sparkling, Glistening, or Radiant traits.');
    }

    const breathNames = ['Frost Breath', 'Poisonous Breath', 'Shock Breath'];
    const breaths = breathNames.filter(name => names.includes(name));
    if (animal.species === 'Dragon' && breaths.length) {
      keep += goal === 'Beans' ? 2 : 10 + breaths.length * 3;
      sell -= goal === 'Beans' ? 0 : 10;
      reasons.push(`${breaths.length}/3 royal-dragon breath trait${breaths.length === 1 ? '' : 's'} on this animal.`);
      const peerBreaths = new Set(peers.flatMap(peer => selectedTraits(peer).map(trait => trait.name)).filter(name => breathNames.includes(name)));
      const combinedBreaths = new Set([...breaths, ...peerBreaths]);
      if (combinedBreaths.size === 3) reasons.push('Saved dragon stock covers all three royal-dragon breath requirements.');
    }

    if (onlyMatureGender) {
      keep += 16;
      sell -= 15;
      reasons.push(`Only saved mature ${animal.gender.toLowerCase()} for this species.`);
    } else if (isMature(animal) && oppositeMature) {
      keep += 5;
      reasons.push('A mature opposite-gender partner is already saved.');
    }

    if (weakerDuplicate) {
      keep -= 13;
      sell += 17;
      reasons.push(`A stronger saved ${animal.gender.toLowerCase()} fills the same breeder role.`);
    } else if (strongestRole) {
      keep += 9;
      sell -= 8;
      reasons.push(`Best saved ${animal.gender.toLowerCase()} for the selected goal.`);
    }

    if (animal.diseased) cautions.push('Cure the disease before relying on it as breeding stock.');
    if (animal.health < 50 || animal.happiness < 50) cautions.push('Low health or happiness reduces its practical breeding value until care improves.');
    if (names.includes('Stressed')) cautions.push('Stressed lowers breeding success.');
    if (names.includes('Genetic Inferiority')) cautions.push('Genetic Inferiority works against multi-trait offspring.');

    const highUtilityPenalty = Math.max(0, Math.min(32, intrinsic * 0.55));
    sell -= highUtilityPenalty;
    if (goal === 'Beans') keep -= 8;
    if (goal === 'Shiny' && Number(effects.shiny || 0) >= 5) reasons.push(`Shiny traits add +${effects.shiny} percentage points when used as a parent.`);
    if (goal === 'Breeding' && Number(effects.breeding || 0) > 0) reasons.push(`Breeding traits contribute +${effects.breeding} relative breeding strength.`);
    if (goal === 'LowMaintenance' && Number(effects.maintenance || 0) > 0) reasons.push('Care traits reduce happiness or disease upkeep.');

    keep = Math.round(clamp(keep, 0, 100));
    sell = Math.round(clamp(sell, 0, 100));
    if (animal.protected) { keep = 100; sell = 0; }

    let recommendation;
    if (animal.protected) recommendation = 'Keep';
    else if (['Egg', 'Child'].includes(animal.stage)) recommendation = keep >= 68 ? 'Keep and grow' : 'Grow then sell';
    else if (keep >= 72 && keep >= sell + 6) recommendation = 'Keep';
    else if (sell >= 62 && sell >= keep + 6) recommendation = 'Sell now';
    else if (keep >= 58 && keep > sell) recommendation = 'Keep';
    else if (sell >= 54 && sell > keep) recommendation = 'Sell now';
    else recommendation = 'Situational';

    let bestUse = animal.protected ? 'Protected stock' : 'Backup stock';
    if (!animal.protected && animal.species === 'Dragon' && breaths.length) bestUse = 'Royal dragon breeding';
    else if (Number(effects.shiny || 0) >= 5) bestUse = 'Shiny breeding';
    else if (Number(effects.breeding || 0) >= 4) bestUse = 'High-output breeder';
    else if (Number(effects.multi || 0) >= 4) bestUse = 'Three-trait breeding';
    else if (Number(effects.maintenance || 0) >= 4) bestUse = 'Low-maintenance breeder';
    else if (goal === 'XPProduce' && (Number(effects.xp || 0) > 0 || Number(effects.materials || 0) > 0)) bestUse = 'XP or produce';
    else if (animal.stage === 'Adolescent') bestUse = 'Bean sale';
    else if (missingLog) bestUse = 'Breeding-log parent';
    else if (['Egg', 'Child'].includes(animal.stage)) bestUse = 'Grow to adolescent';
    if (animal.protected) bestUse = 'Protected stock';

    const grade = keep >= 85 ? 'S' : keep >= 70 ? 'A' : keep >= 55 ? 'B' : keep >= 40 ? 'C' : 'D';
    const knownFields = [animal.gender !== 'Unknown', Boolean(animal.breed), animal.traits.filter(Boolean).length === 3, Boolean(animal.stage)].filter(Boolean).length;
    const confidence = knownFields >= 4 ? 'High' : knownFields >= 3 ? 'Medium' : 'Low';

    return {
      recommendation,
      grade,
      keepScore: keep,
      sellScore: sell,
      bestUse,
      confidence,
      beanEstimate: beans,
      buyer,
      missingLog,
      shiny,
      reasons: [...new Set(reasons)].slice(0, 6),
      cautions: [...new Set(cautions)].slice(0, 5)
    };
  }

  function actionableAnimalRecommendation(rating) {
    if (!rating) return { label: 'Review manually', detail: 'Not enough valid animal data was available to calculate a recommendation.' };

    const bestUse = rating.bestUse || '';
    const breedingUse = /breeding|breeder|parent|royal dragon/i.test(bestUse);
    const exceptionalBreeder = breedingUse && (
      rating.keepScore >= 72 &&
      rating.keepScore >= rating.sellScore + 8
    );

    if (rating.bestUse === 'Protected stock') {
      return { label: 'Keep', detail: 'This animal is protected from sale recommendations.' };
    }

    if (exceptionalBreeder) {
      const needsGrowth = rating.recommendation === 'Keep and grow';
      return {
        label: needsGrowth ? 'Keep and grow for breeding' : 'Keep for breeding',
        detail: `Best use: ${bestUse}. Its breeding value is strong enough to override the normal bean-sale recommendation.`
      };
    }

    const stage = rating.beanEstimate?.stage || '';
    const young = ['Egg', 'Child'].includes(stage);
    if (young) {
      return {
        label: 'Grow then sell for beans',
        detail: `Raise it to adolescence; estimated sale value is ${rating.beanEstimate?.estimate ?? 0} beans before buyer preference changes.`
      };
    }

    return {
      label: 'Sell now for beans',
      detail: `This animal is adolescent or older and does not meet the keep-for-breeding threshold. Estimated sale value is ${rating.beanEstimate?.estimate ?? 0} beans${rating.buyer ? ' with the configured buyer' : ''}.`
    };
  }

  function logKey(species, breed) { return `${species}::${breed}`; }
  function logStats(state, farm = 'All') {
    const entries = Object.values(D().speciesData)
      .filter(info => farm === 'All' || info.farm === farm)
      .flatMap(info => info.breeds.map(breed => ({ species: info.name, breed: breed.name, complete: Boolean(state.breedingLog[logKey(info.name, breed.name)]) })));
    const complete = entries.filter(entry => entry.complete).length;
    return { complete, total: entries.length, percent: entries.length ? Math.round(complete / entries.length * 100) : 0, entries };
  }

  function upcomingTimers(state, now = Date.now()) {
    const animalTimers = state.animals.map(animal => {
      const due = nextStageDue(animal);
      return due ? {
        id: `animal:${animal.id}`,
        type: 'growth',
        label: `${animal.name} → ${nextStage(animal)}`,
        dueAt: due.toISOString(),
        animalId: animal.id
      } : null;
    }).filter(Boolean);
    const custom = (state.timers || []).filter(timer => timer.dueAt);
    return [...animalTimers, ...custom].map(timer => ({
      ...timer,
      remainingMinutes: (Date.parse(timer.dueAt) - now) / 60000
    })).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  }

  function dashboardTasks(state) {
    const tasks = [];
    state.pens.forEach(pen => {
      validatePen(state, pen).forEach(warning => tasks.push({ severity: 'warning', text: `${pen.name}: ${warning}`, tab: 'pens' }));
      const animals = animalsInPen(state, pen.id);
      const hours = foodHoursRemaining(state, pen);
      if (animals.length && (!pen.foodType || Number(pen.foodQuantity) <= 0)) tasks.push({ severity: 'danger', text: `${pen.name}: no food recorded.`, tab: 'pens' });
      else if (hours !== null && hours < 24) tasks.push({ severity: hours <= 0 ? 'danger' : 'warning', text: `${pen.name}: food estimate is ${formatDuration(hours * 60)}.`, tab: 'pens' });
    });
    state.animals.filter(animal => animal.diseased).forEach(animal => tasks.push({ severity: 'danger', text: `${animal.name} is marked diseased.`, tab: 'disease' }));
    upcomingTimers(state).filter(timer => timer.remainingMinutes <= 120).slice(0, 8).forEach(timer => tasks.push({
      severity: timer.remainingMinutes <= 0 ? 'danger' : 'info',
      text: timer.remainingMinutes <= 0 ? `${timer.label} is due.` : `${timer.label} in ${formatDuration(timer.remainingMinutes)}.`,
      tab: 'timers'
    }));
    return tasks.slice(0, 30);
  }

  function evaluatePair(state) {
    const [a, b] = state.parents;
    const effects = [a, b].map(traitEffects);
    const combined = {};
    for (const key of new Set([...Object.keys(effects[0]), ...Object.keys(effects[1])])) combined[key] = (effects[0][key] || 0) + (effects[1][key] || 0);
    const traits = [...selectedTraits(a), ...selectedTraits(b)];
    const warnings = [];
    const recommendations = [];
    const positives = [];
    if (a.species !== b.species) warnings.push('Parents are different species.');
    if (a.gender === b.gender && a.gender !== 'Unknown') warnings.push('Same-gender adoption is possible but much less reliable.');
    if (traits.some(trait => trait.name === 'Stressed')) warnings.push('Stressed lowers breeding success.');
    if (traits.some(trait => trait.name === 'Genetic Inferiority')) warnings.push('Genetic Inferiority works against multi-trait offspring.');

    let score = 0;
    let max = 24;
    let headline = '';
    if (state.goal === 'shiny') {
      const isRoyalDragonPair = a.species === 'Dragon' && b.species === 'Dragon';
      const shinyBonus = combined.shiny || 0;

      if (isRoyalDragonPair) {
        const requiredBreaths = ['Frost Breath', 'Poisonous Breath', 'Shock Breath'];
        const presentBreaths = requiredBreaths.filter(name => traits.some(trait => trait.name === name));
        const missingBreaths = requiredBreaths.filter(name => !presentBreaths.includes(name));
        const radiantCount = traits.filter(trait => trait.name === 'Radiant').length;
        const glisteningCount = traits.filter(trait => trait.name === 'Glistening').length;
        const sparklingCount = traits.filter(trait => trait.name === 'Sparkling').length;
        const royalUnlocked = missingBreaths.length === 0;

        // Three breath traits consume half of the six parent slots. With Radiant
        // restricted to slot 3 and Glistening to slots 2/3, the best remaining
        // layout is Radiant x2 + Glistening x1 for a +13 point shiny bonus.
        max = 13;
        score = royalUnlocked ? Math.min(shinyBonus, max) : 0;
        headline = !royalUnlocked
          ? `Royal dragon locked (${presentBreaths.length}/3 breaths)`
          : score >= 13
            ? 'Optimal royal dragon setup'
            : score >= 8
              ? 'Strong royal dragon setup'
              : 'Royal dragon unlocked';

        positives.push(`Royal unlock: ${presentBreaths.length}/3 breath traits present.`);
        if (royalUnlocked) positives.push(`Royal-compatible shiny bonus: +${shinyBonus} percentage points out of +13.`);
        else if (shinyBonus) positives.push(`Current shiny traits provide +${shinyBonus}, but they cannot produce a royal dragon until all three breaths are present.`);

        missingBreaths.forEach(name => recommendations.push(`Add ${name}; royal dragons require all three breath traits across the pair.`));
        if (royalUnlocked) {
          if (radiantCount < 2) recommendations.push(`Use Radiant in slot 3 on both parents (${radiantCount}/2 currently).`);
          if (glisteningCount < 1) recommendations.push('Use one Glistening in slot 2 on either parent.');
          if (sparklingCount) recommendations.push('Replace Sparkling with Glistening or Radiant for the optimal royal-dragon setup.');
          if (radiantCount >= 2 && glisteningCount >= 1 && shinyBonus >= 13) {
            positives.push('Optimal layout reached: three unique breaths, two Radiants, and one Glistening.');
          }
        }
      } else {
        score = shinyBonus;
        max = 20;
        headline = score >= 20 ? 'Perfect shiny setup' : score >= 12 ? 'Strong shiny pair' : score ? 'Partial shiny setup' : 'No shiny traits detected';
        ['Sparkling', 'Glistening', 'Radiant'].forEach(name => {
          const count = traits.filter(trait => trait.name === name).length;
          if (count < 2) recommendations.push(`Aim for ${name} on both parents.`);
          if (count) positives.push(`${name}: ${count}/2 parents.`);
        });
      }
    } else if (state.goal === 'multi') {
      score = Math.max(0, combined.multi || 0);
      max = 24;
      headline = score >= 16 ? 'Strong multi-trait pair' : score ? 'Some multi-trait support' : 'No multi-trait support';
      if (traits.filter(trait => trait.name === 'Genetic Mutation').length < 2) recommendations.push('Use Genetic Mutation on both parents.');
      if (traits.filter(trait => trait.name === 'Genetic Instability').length < 2) recommendations.push('Use Genetic Instability on both parents in slot 2 or 3.');
    } else if (state.goal === 'maintenance') {
      score = Math.max(0, combined.maintenance || 0);
      max = 20;
      headline = score >= 12 ? 'Low-maintenance pair' : score ? 'Some care support' : 'No care traits detected';
      if (!traits.some(trait => trait.name === 'Joyful')) recommendations.push('Add Joyful for happiness stability.');
      if (!traits.some(trait => trait.name === 'Immune')) recommendations.push('Add Immune for disease resistance.');
    } else if (state.goal === 'profit') {
      score = Math.max(0, (combined.beans || 0) + (combined.xp || 0) + (combined.materials || 0) + (combined.breeding || 0));
      max = 35;
      headline = score >= 20 ? 'Strong profit pair' : score ? 'Mixed profit support' : 'No profit traits detected';
      recommendations.push('Choose a main output: beans, XP, produce, or offspring volume.');
    } else {
      score = Math.max(0, combined.breeding || 0);
      max = 24;
      headline = score >= 16 ? 'Excellent breeding pair' : score >= 8 ? 'Good breeding pair' : score ? 'Some breeding support' : 'No breeding traits detected';
      if (!traits.some(trait => trait.name === 'Studly')) recommendations.push('Add Studly to one or more slots.');
      const studly = traits.filter(trait => trait.name === 'Studly').length;
      if (studly) positives.push(`${studly} Studly trait${studly === 1 ? '' : 's'} recorded.`);
    }
    return {
      percent: Math.round(clamp(score / max * 100, 0, 100)),
      headline,
      score,
      max,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
      positives: [...new Set(positives)],
      combined
    };
  }

  root.POF_CORE = {
    clone, uid, nowIso, clamp, defaultState, defaultPens, defaultBuyers, normaliseAnimal, migrate,
    logEvent, speciesInfo, penInfo, animalsInPen, isAnimalCompatibleWithPen, validatePen,
    traitByName, selectedTraits, traitEffects, growthDurationMinutes, nextStage, nextStageDue,
    formatDuration, foodHoursRemaining, beanEstimate, breedInfo, isShinyAnimal, isMature,
    intrinsicAnimalValue, matchingBuyer, rateAnimal, actionableAnimalRecommendation, logKey, logStats, upcomingTimers,
    dashboardTasks, evaluatePair
  };
})();

'use strict';

window.POF_DISEASES = (() => {
  const bodyParts = {
    head: 'Head and mouth',
    eyes: 'Eyes',
    legs: 'Legs and feet',
    stomach: 'Stomach'
  };



  const symptomDisplayLabels = {
    head: {
      'Inflamed gums': "The animal's gums appear inflamed.",
      'Nasty marks': "There are nasty-looking marks along the animal's gum line.",
      'Smelly breath': "The animal's breath smells unpleasant.",
      'Sneezing': 'The animal is sneezing.',
      'Light within throat': "A strange light is visible within the animal's throat.",
      'Lumpy nose': "The animal's nose appears unusually lumpy.",
      'Dry nose': "The animal's nose appears dry and sore.",
      'Healthy gums': "The animal's gums appear healthy.",
      'Spots at jawline': "There are visible spots around the animal's jawline."
    },
    eyes: {
      'Bloodshot': "The animal's eyes appear bloodshot.",
      'Glazed': "The animal's eyes appear glazed over.",
      'Glowing': "The animal's eyes appear to be glowing.",
      'Malice': "The animal's eyes are filled with obvious malice.",
      'Seem a little glazed over': "The animal's eyes seem a little glazed over.",
      'Eyes seem fine': "The animal's eyes appear normal.",
      'Darting Around': "The animal's eyes are darting around rapidly.",
      'Mirth': "The animal's eyes show an unusual sense of mirth."
    },
    legs: {
      'A little damp': "The animal's feet are a little damp.",
      'Scuffed': "The animal's feet appear scuffed.",
      'Soggy': "The animal's feet are soggy.",
      'Sweaty': "The animal's feet are sweaty.",
      'Warm to the touch': "The animal's feet are warm to the touch.",
      'Tapping': 'The animal keeps tapping its feet.',
      'Faintly chewed on': "The animal's feet appear faintly chewed on.",
      'Click': "The animal's legs make a clicking sound when moved.",
      'A little stiff': "The animal's legs appear a little stiff.",
      'Unsteady': 'The animal is unsteady on its feet.'
    },
    stomach: {
      'Appears to be a little bloated': "The animal's stomach appears to be a little bloated.",
      'Gas': 'The animal appears to have gas.',
      'Nausea': 'The animal appears nauseous.',
      'Off its food': 'The animal seems to be off its food.',
      'Strange noises': "The animal's stomach is making strange noises.",
      'Clicking noise': "A clicking noise can be heard from the animal's stomach.",
      'Shivering': 'The animal is shivering.',
      'Coughs': 'The animal coughs while its stomach is examined.',
      'Swollen': "The animal's stomach appears swollen."
    }
  };

  function displaySymptom(part, symptom) {
    return symptomDisplayLabels[part]?.[symptom] || symptom;
  }

  const diseases = [
    {
      name: 'Foot-in-mouth',
      treatment: 'Foot-in-mouth',
      symptoms: {
        head: [
          'Breath smells oddly like socks',
          'Inflamed gums',
          'Keeps making noises at embarrassing moments making it difficult to investigate',
          'Nasty marks',
          'Smelly breath',
          'The gums appear to be a little sore.',
          'There are some nasty looking marks along the gum line.'
        ],
        eyes: ["The animal's eyes seem normal."],
        legs: [
          'A little damp',
          'Feet are a little soggy for some reason',
          'Scuffed',
          'Soggy',
          "The animal's feet are faintly chewed on."
        ],
        stomach: [
          'Appears to be a little bloated',
          'Gas',
          "The animal's emissions smell strangely of shoes.",
          "You can't seem to spot anything immediately obvious."
        ]
      }
    },
    {
      name: 'Flu',
      treatment: 'Flu',
      symptoms: {
        head: [
          'Breath smells unpleasant',
          'Sneezing',
          'The animal appears to be suffering from a small fever.',
          'The animal coughs in your face.'
        ],
        eyes: ['The eyes are a little bloodshot.'],
        legs: ['Sweaty', "The animal's feet are clammy.", 'Warm to the touch'],
        stomach: ['Gas', 'Nausea', 'The animal seems off its food.']
      }
    },
    {
      name: 'Curse',
      treatment: 'Curse',
      symptoms: {
        head: [
          'Light within throat',
          'Lumpy nose',
          'Smells faintly of sulfur',
          'Smelly breath',
          "The animal occasionally mumbles something in a language it can't possibly speak."
        ],
        eyes: [
          'Bloodshot',
          'Glazed',
          'Glowing',
          'Malice',
          "You can't seem to spot anything immediately obvious.",
          'Seem a little glazed over'
        ],
        legs: ['Tapping', 'Faintly chewed on', "The animal's feet seem a little scuffed."],
        stomach: ['Gas', 'Off its food', 'Strange noises']
      }
    },
    {
      name: 'Dry nose',
      treatment: 'Dry nose',
      symptoms: {
        head: ['Dry nose', 'The animal refuses to let you see its nose, it seems like the nose it quite sore.'],
        eyes: [],
        legs: [],
        stomach: [
          'The animal has a bit of gas, but nothing too concerning.',
          "The animal doesn't appear to be in gastronomic distress."
        ]
      }
    },
    {
      name: 'Bone rattle',
      treatment: 'Bone rattle',
      symptoms: {
        head: [
          'Teeth click in a sinister manner',
          "The animal's breath smells normal, which is to say horrible",
          'Healthy gums'
        ],
        eyes: ['Eyes seem fine'],
        legs: ['Click', 'A little stiff'],
        stomach: ['Clicking noise', 'Shivering']
      }
    },
    {
      name: 'Wooting cough',
      treatment: 'Wooting cough',
      symptoms: {
        head: ['"hu hu huu" Cough', 'Spots at jawline'],
        eyes: ['Bloodshot', 'Darting Around', 'Mirth'],
        legs: ['Unsteady'],
        stomach: ['Coughs', 'Gas', 'Swollen']
      }
    }
  ];

  function normalise(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function editDistance(a, b) {
    const aa = normalise(a);
    const bb = normalise(b);
    const row = Array.from({ length: bb.length + 1 }, (_, index) => index);
    for (let i = 1; i <= aa.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= bb.length; j += 1) {
        const old = row[j];
        const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
        previous = old;
      }
    }
    return row[bb.length];
  }

  function symptomIndex() {
    const rows = [];
    for (const disease of diseases) {
      for (const [part, symptoms] of Object.entries(disease.symptoms)) {
        for (const symptom of symptoms) rows.push({ disease: disease.name, part, symptom });
      }
    }
    return rows;
  }

  const indexedSymptoms = symptomIndex();

  function uniqueSymptoms(part) {
    return [...new Set(diseases.flatMap(disease => disease.symptoms[part] || []))]
      .sort((a, b) => a.localeCompare(b));
  }

  function hasSymptom(disease, part, symptom) {
    const target = normalise(symptom);
    return (disease.symptoms[part] || []).some(item => normalise(item) === target);
  }

  function diagnose(selections) {
    const selected = Object.entries(selections || {})
      .filter(([part, symptom]) => bodyParts[part] && String(symptom || '').trim())
      .map(([part, symptom]) => ({ part, symptom }));

    if (!selected.length) {
      return {
        status: 'empty',
        selected,
        candidates: diseases.map(disease => disease.name),
        ranked: [],
        nextPart: 'head',
        message: 'Select or import at least one symptom.'
      };
    }

    const ranked = diseases.map(disease => {
      const matches = selected.filter(item => hasSymptom(disease, item.part, item.symptom));
      const conflicts = selected.filter(item => !hasSymptom(disease, item.part, item.symptom));
      return {
        name: disease.name,
        treatment: disease.treatment,
        matches,
        conflicts,
        score: (matches.length * 3) - (conflicts.length * 4)
      };
    }).sort((a, b) => b.score - a.score || b.matches.length - a.matches.length || a.name.localeCompare(b.name));

    const exact = ranked.filter(item => item.conflicts.length === 0 && item.matches.length === selected.length);
    const candidateNames = exact.map(item => item.name);
    const remaining = exact.length ? exact : ranked.filter(item => item.score === ranked[0].score && item.matches.length > 0);
    const nextPart = suggestNextPart(selected.map(item => item.part), remaining.map(item => item.name));

    if (exact.length === 1) {
      return {
        status: 'diagnosed',
        selected,
        candidates: candidateNames,
        ranked,
        diagnosis: exact[0].name,
        treatment: exact[0].treatment,
        nextPart: null,
        message: `Treat the animal for ${exact[0].treatment}.`
      };
    }

    if (exact.length > 1) {
      return {
        status: 'ambiguous',
        selected,
        candidates: candidateNames,
        ranked,
        nextPart,
        message: `${exact.length} diseases still match. Examine ${bodyParts[nextPart] || 'another body part'} next.`
      };
    }

    return {
      status: 'conflict',
      selected,
      candidates: remaining.map(item => item.name),
      ranked,
      nextPart,
      message: 'The selected symptoms do not form an exact disease combination. Recheck the symptom text or clear one conflicting selection.'
    };
  }

  function suggestNextPart(selectedParts, candidateNames) {
    const selected = new Set(selectedParts);
    const candidates = diseases.filter(disease => !candidateNames?.length || candidateNames.includes(disease.name));
    const choices = Object.keys(bodyParts).filter(part => !selected.has(part));
    if (!choices.length) return null;

    let best = choices[0];
    let bestScore = -Infinity;
    for (const part of choices) {
      const signatures = candidates.map(disease => (disease.symptoms[part] || []).map(normalise).sort().join('|'));
      const distinct = new Set(signatures).size;
      const covered = signatures.filter(Boolean).length;
      const uniqueCount = new Set(candidates.flatMap(disease => disease.symptoms[part] || []).map(normalise)).size;
      const score = (distinct * 10) + covered + (uniqueCount * 0.05);
      if (score > bestScore) {
        best = part;
        bestScore = score;
      }
    }
    return best;
  }

  function bestSymptomMatch(line) {
    const clean = normalise(line);
    if (!clean) return null;
    let best = null;

    for (const item of indexedSymptoms) {
      const target = normalise(item.symptom);
      if (!target) continue;
      if (clean === target || clean.includes(target) || target.includes(clean)) {
        const coverage = Math.min(clean.length, target.length) / Math.max(clean.length, target.length);
        const candidate = { ...item, distance: 0, confidence: Math.round(85 + (coverage * 15)) };
        if (!best || candidate.confidence > best.confidence) best = candidate;
        continue;
      }
      const distance = editDistance(clean, target);
      const allowed = Math.max(2, Math.min(8, Math.floor(target.length * 0.16)));
      if (distance <= allowed) {
        const confidence = Math.max(50, Math.round(100 - ((distance / Math.max(clean.length, target.length)) * 100)));
        const candidate = { ...item, distance, confidence };
        if (!best || candidate.distance < best.distance || (candidate.distance === best.distance && candidate.confidence > best.confidence)) best = candidate;
      }
    }
    return best;
  }

  function parseSymptomText(text) {
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const selections = {};
    const matches = [];
    const unmatched = [];

    for (const line of lines) {
      const match = bestSymptomMatch(line);
      if (!match) {
        unmatched.push(line);
        continue;
      }
      if (!selections[match.part] || match.confidence > (matches.find(item => item.part === match.part)?.confidence || 0)) {
        selections[match.part] = match.symptom;
      }
      matches.push({ line, ...match });
    }

    const confidence = matches.length
      ? Math.round(matches.reduce((total, item) => total + item.confidence, 0) / matches.length)
      : 0;

    return { selections, matches, unmatched, confidence };
  }

  return {
    bodyParts,
    diseases,
    uniqueSymptoms,
    displaySymptom,
    diagnose,
    parseSymptomText,
    normalise
  };
})();

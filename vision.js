'use strict';

(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;

  const FIELD_RECTS = {
    stage: { x: 68, y: 79, width: 95, height: 29, mode: 'white' },
    breed: { x: 203, y: 89, width: 298, height: 24, mode: 'white' },
    health: { x: 68, y: 177, width: 85, height: 29, mode: 'white' },
    happiness: { x: 68, y: 195, width: 85, height: 30, mode: 'white' },
    trait1: { x: 218, y: 209, width: 88, height: 42, mode: 'trait' },
    trait2: { x: 313, y: 209, width: 88, height: 42, mode: 'trait' },
    trait3: { x: 408, y: 209, width: 88, height: 42, mode: 'trait' }
  };

  const TEMPLATE_WIDTH = 12;
  const TEMPLATE_HEIGHT = 16;
  const glyphCache = new Map();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function emptyMask() {
    return { width: 0, height: 0, data: new Uint8Array(0) };
  }

  function cropMask(mask, x, y, width, height) {
    if (!mask || width <= 0 || height <= 0) return emptyMask();
    const out = new Uint8Array(width * height);
    for (let yy = 0; yy < height; yy += 1) {
      for (let xx = 0; xx < width; xx += 1) {
        out[xx + yy * width] = mask.data[(x + xx) + (y + yy) * mask.width] || 0;
      }
    }
    return { width, height, data: out };
  }

  function tightMask(mask) {
    if (!mask || !mask.width || !mask.height) return emptyMask();
    let minX = mask.width;
    let minY = mask.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        if (!mask.data[x + y * mask.width]) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) return emptyMask();
    return cropMask(mask, minX, minY, maxX - minX + 1, maxY - minY + 1);
  }

  function isTextPixel(r, g, b, mode) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (mode === 'trait') {
      return r > 110 && g > 100 && b > 90 && r - g < 40 && g - b < 40;
    }
    if (mode === 'gold') {
      return r > 110 && g > 70 && b < 180 && r - g > 20 && g - b > 15;
    }
    return min > 125 && max - min < 42;
  }

  function extractLineMask(image, rect, mode = rect.mode || 'white') {
    if (!image || !image.data || !image.width || !image.height) return emptyMask();
    const x0 = clamp(Math.round(rect.x), 0, image.width);
    const y0 = clamp(Math.round(rect.y), 0, image.height);
    const width = clamp(Math.round(rect.width), 0, image.width - x0);
    const height = clamp(Math.round(rect.height), 0, image.height - y0);
    if (!width || !height) return emptyMask();

    const raw = new Uint8Array(width * height);
    const rowCounts = new Uint16Array(height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const source = ((x0 + x) + (y0 + y) * image.width) * 4;
        const on = isTextPixel(image.data[source], image.data[source + 1], image.data[source + 2], mode);
        if (!on) continue;
        raw[x + y * width] = 1;
        rowCounts[y] += 1;
      }
    }

    const activeRows = [];
    for (let y = 0; y < height; y += 1) if (rowCounts[y]) activeRows.push(y);
    if (!activeRows.length) return emptyMask();

    const groups = [];
    let start = activeRows[0];
    let previous = activeRows[0];
    for (const y of activeRows.slice(1)) {
      if (y - previous <= 2) {
        previous = y;
      } else {
        groups.push({ start, end: previous });
        start = previous = y;
      }
    }
    groups.push({ start, end: previous });
    for (const group of groups) {
      let score = 0;
      for (let y = group.start; y <= group.end; y += 1) score += rowCounts[y];
      group.score = score;
    }
    groups.sort((a, b) => b.score - a.score);
    const best = groups[0];
    const bandStart = Math.max(0, best.start - 1);
    const bandEnd = Math.min(height - 1, best.end + 1);
    const bandHeight = bandEnd - bandStart + 1;
    const band = new Uint8Array(width * bandHeight);
    for (let y = 0; y < bandHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        band[x + y * width] = raw[x + (bandStart + y) * width];
      }
    }
    return tightMask({ width, height: bandHeight, data: band });
  }

  function extractLineMasks(image, rect, mode = rect.mode || 'white') {
    if (!image || !image.data || !image.width || !image.height) return [];
    const x0 = clamp(Math.round(rect.x), 0, image.width);
    const y0 = clamp(Math.round(rect.y), 0, image.height);
    const width = clamp(Math.round(rect.width), 0, image.width - x0);
    const height = clamp(Math.round(rect.height), 0, image.height - y0);
    if (!width || !height) return [];
    const raw = new Uint8Array(width * height);
    const rowCounts = new Uint16Array(height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const source = ((x0 + x) + (y0 + y) * image.width) * 4;
        if (!isTextPixel(image.data[source], image.data[source + 1], image.data[source + 2], mode)) continue;
        raw[x + y * width] = 1;
        rowCounts[y] += 1;
      }
    }
    const activeRows = [];
    for (let y = 0; y < height; y += 1) if (rowCounts[y]) activeRows.push(y);
    if (!activeRows.length) return [];
    const groups = [];
    let start = activeRows[0];
    let previous = activeRows[0];
    for (const y of activeRows.slice(1)) {
      if (y - previous <= 2) previous = y;
      else { groups.push({ start, end: previous }); start = previous = y; }
    }
    groups.push({ start, end: previous });
    return groups.map(group => {
      const bandStart = Math.max(0, group.start - 1);
      const bandEnd = Math.min(height - 1, group.end + 1);
      const bandHeight = bandEnd - bandStart + 1;
      const band = new Uint8Array(width * bandHeight);
      for (let y = 0; y < bandHeight; y += 1) {
        for (let x = 0; x < width; x += 1) band[x + y * width] = raw[x + (bandStart + y) * width];
      }
      return tightMask({ width, height: bandHeight, data: band });
    }).filter(mask => mask.width && mask.height);
  }

  function segmentMask(mask) {
    if (!mask || !mask.width || !mask.height) return { segments: [], gaps: [] };
    const active = new Uint8Array(mask.width);
    for (let x = 0; x < mask.width; x += 1) {
      for (let y = 0; y < mask.height; y += 1) {
        if (mask.data[x + y * mask.width]) {
          active[x] = 1;
          break;
        }
      }
    }
    const runs = [];
    const gaps = [];
    let x = 0;
    while (x < active.length) {
      while (x < active.length && !active[x]) x += 1;
      if (x >= active.length) break;
      const start = x;
      while (x + 1 < active.length && active[x + 1]) x += 1;
      const end = x;
      runs.push({ start, end });
      let gap = 0;
      x += 1;
      while (x < active.length && !active[x]) {
        gap += 1;
        x += 1;
      }
      if (x < active.length) gaps.push(gap);
    }
    return {
      segments: runs.map(run => tightMask(cropMask(mask, run.start, 0, run.end - run.start + 1, mask.height))),
      gaps
    };
  }

  function resizeMask(mask, width = TEMPLATE_WIDTH, height = TEMPLATE_HEIGHT) {
    const out = new Uint8Array(width * height);
    if (!mask || !mask.width || !mask.height) return { width, height, data: out };
    for (let y = 0; y < height; y += 1) {
      const sourceY = Math.min(mask.height - 1, Math.floor(y * mask.height / height));
      for (let x = 0; x < width; x += 1) {
        const sourceX = Math.min(mask.width - 1, Math.floor(x * mask.width / width));
        out[x + y * width] = mask.data[sourceX + sourceY * mask.width] ? 1 : 0;
      }
    }
    return { width, height, data: out };
  }

  function dilate(mask) {
    const out = new Uint8Array(mask.width * mask.height);
    for (let y = 0; y < mask.height; y += 1) {
      for (let x = 0; x < mask.width; x += 1) {
        let on = 0;
        for (let yy = Math.max(0, y - 1); yy <= Math.min(mask.height - 1, y + 1) && !on; yy += 1) {
          for (let xx = Math.max(0, x - 1); xx <= Math.min(mask.width - 1, x + 1); xx += 1) {
            if (mask.data[xx + yy * mask.width]) {
              on = 1;
              break;
            }
          }
        }
        out[x + y * mask.width] = on;
      }
    }
    return { width: mask.width, height: mask.height, data: out };
  }

  function maskCount(mask) {
    let total = 0;
    for (const value of mask.data) total += value ? 1 : 0;
    return total;
  }

  function intersectionCount(a, b) {
    let total = 0;
    const length = Math.min(a.data.length, b.data.length);
    for (let i = 0; i < length; i += 1) if (a.data[i] && b.data[i]) total += 1;
    return total;
  }

  function glyphMask(font, character) {
    if (!font || !font.chars) return emptyMask();
    const key = `${font === root.OCR_aa_8px_mono_pof ? 'pof' : 'font'}:${character}`;
    if (glyphCache.has(key)) return glyphCache.get(key);
    const glyph = font.chars.find(item => item.chr === character);
    if (!glyph) {
      glyphCache.set(key, emptyMask());
      return emptyMask();
    }
    const height = Math.max(1, Number(font.height || 18));
    const width = Math.max(1, Number(glyph.width || font.width || 10));
    const data = new Uint8Array(width * height);
    const step = font.shadow ? 4 : 3;
    for (let index = 0; index + step - 1 < glyph.pixels.length; index += step) {
      const x = Number(glyph.pixels[index]);
      const y = Number(glyph.pixels[index + 1]);
      const alpha = Number(glyph.pixels[index + 2]);
      if (alpha <= 40 || x < 0 || y < 0 || x >= width || y >= height) continue;
      data[x + y * width] = 1;
    }
    const mask = tightMask({ width, height, data });
    glyphCache.set(key, mask);
    return mask;
  }

  function glyphSimilarity(actual, template) {
    if (!actual.width || !actual.height || !template.width || !template.height) return -9;
    const a = resizeMask(actual);
    const t = resizeMask(template);
    const ad = dilate(a);
    const td = dilate(t);
    const aCount = maskCount(a);
    const tCount = maskCount(t);
    const exact = intersectionCount(a, t);
    const nearTemplate = intersectionCount(ad, t);
    const nearActual = intersectionCount(td, a);
    const f1 = (2 * exact) / Math.max(1, aCount + tCount);
    const precision = nearTemplate / Math.max(1, tCount);
    const recall = nearActual / Math.max(1, aCount);
    const actualAspect = actual.width / Math.max(1, actual.height);
    const templateAspect = template.width / Math.max(1, template.height);
    const aspectPenalty = 0.08 * Math.abs(Math.log((actualAspect + 0.000001) / (templateAspect + 0.000001)));
    return 0.35 * f1 + 0.325 * precision + 0.325 * recall - aspectPenalty;
  }

  function candidateCharacters(text) {
    const characters = [];
    const spaces = [];
    let pendingSpace = false;
    for (const character of String(text || '')) {
      if (character === ' ') {
        pendingSpace = true;
        continue;
      }
      if (characters.length) spaces.push(pendingSpace);
      characters.push(character);
      pendingSpace = false;
    }
    return { characters, spaces };
  }

  function recogniseMask(mask, candidates, font = root.OCR_aa_8px_mono_pof) {
    const { segments, gaps } = segmentMask(mask);
    const prepared = [...new Set(candidates.map(value => String(value)))].map(text => ({ text, ...candidateCharacters(text) }));
    if (!segments.length || !font) {
      return { text: '', score: -Infinity, confidence: 0, alternatives: [], segments: segments.length };
    }

    const relevant = prepared.filter(candidate => candidate.characters.length === segments.length);
    if (!relevant.length) {
      return { text: '', score: -Infinity, confidence: 0, alternatives: [], segments: segments.length };
    }
    const uniqueCharacters = [...new Set(relevant.flatMap(candidate => candidate.characters))];
    const scoreMap = segments.map(segment => {
      const scores = new Map();
      for (const character of uniqueCharacters) scores.set(character, glyphSimilarity(segment, glyphMask(font, character)));
      return scores;
    });

    const ranked = relevant.map(candidate => {
      let score = 0;
      for (let index = 0; index < candidate.characters.length; index += 1) {
        score += scoreMap[index].get(candidate.characters[index]) ?? -9;
      }
      for (let index = 0; index < candidate.spaces.length; index += 1) {
        const gap = Number(gaps[index] || 0);
        score += candidate.spaces[index]
          ? (gap >= 4 ? 0.8 : -1.5)
          : (gap <= 3 ? 0.2 : -1.0);
      }
      return { text: candidate.text, score: score / Math.max(1, candidate.characters.length) };
    }).sort((a, b) => b.score - a.score);

    const best = ranked[0];
    const second = ranked[1];
    const margin = best && second ? best.score - second.score : 1;
    const confidence = best
      ? Math.round(clamp(45 + margin * 180 + (best.score - 0.45) * 45, 0, 100))
      : 0;
    return {
      text: best ? best.text : '',
      score: best ? best.score : -Infinity,
      confidence,
      margin,
      alternatives: ranked.slice(1, 4),
      segments: segments.length,
      gaps
    };
  }


  function renderTextMask(font, text) {
    if (!font || !font.chars) return emptyMask();
    const glyphs = new Map(font.chars.map(glyph => [glyph.chr, glyph]));
    const advances = [];
    let width = 0;
    for (const character of String(text || '')) {
      if (character === ' ') {
        const advance = Math.max(1, Number(font.spacewidth || 3));
        advances.push({ character, advance, glyph: null });
        width += advance;
        continue;
      }
      const glyph = glyphs.get(character);
      const advance = Math.max(1, Number(glyph?.width || font.width || 8));
      advances.push({ character, advance, glyph });
      width += advance;
    }
    if (!width) return emptyMask();
    const height = Math.max(1, Number(font.height || 13));
    const data = new Uint8Array(width * height);
    let cursor = 0;
    const step = font.shadow ? 4 : 3;
    for (const item of advances) {
      if (item.glyph) {
        for (let index = 0; index + step - 1 < item.glyph.pixels.length; index += step) {
          const x = Number(item.glyph.pixels[index]);
          const y = Number(item.glyph.pixels[index + 1]);
          const alpha = Number(item.glyph.pixels[index + 2]);
          if (alpha <= 40 || x < 0 || y < 0 || cursor + x >= width || y >= height) continue;
          data[cursor + x + y * width] = 1;
        }
      }
      cursor += item.advance;
    }
    return tightMask({ width, height, data });
  }

  function resizeMaskTo(mask, width, height) {
    const out = new Uint8Array(Math.max(0, width * height));
    if (!mask || !mask.width || !mask.height || width <= 0 || height <= 0) return { width: Math.max(0, width), height: Math.max(0, height), data: out };
    for (let y = 0; y < height; y += 1) {
      const sourceY = Math.min(mask.height - 1, Math.floor(y * mask.height / height));
      for (let x = 0; x < width; x += 1) {
        const sourceX = Math.min(mask.width - 1, Math.floor(x * mask.width / width));
        out[x + y * width] = mask.data[sourceX + sourceY * mask.width] ? 1 : 0;
      }
    }
    return { width, height, data: out };
  }

  function columnCost(a, b, ax, bx) {
    let aCount = 0;
    let bCount = 0;
    let overlap = 0;
    for (let y = 0; y < a.height; y += 1) {
      const av = a.data[ax + y * a.width] ? 1 : 0;
      const bv = b.data[bx + y * b.width] ? 1 : 0;
      aCount += av;
      bCount += bv;
      overlap += av && bv ? 1 : 0;
    }
    if (!aCount && !bCount) return 0;
    return 1 - (2 * overlap) / Math.max(1, aCount + bCount);
  }

  function dtwLineSimilarity(actual, template) {
    if (!actual?.width || !actual?.height || !template?.width || !template?.height) return -9;
    const height = 14;
    const aWidth = Math.max(1, Math.round(actual.width * height / actual.height));
    const tWidth = Math.max(1, Math.round(template.width * height / template.height));
    const a = resizeMaskTo(actual, aWidth, height);
    const t = resizeMaskTo(template, tWidth, height);
    const inf = 1e9;
    let previous = new Float64Array(tWidth + 1);
    let current = new Float64Array(tWidth + 1);
    previous.fill(inf);
    previous[0] = 0;
    const widthRatio = Math.min(aWidth, tWidth) / Math.max(aWidth, tWidth);
    const band = Math.max(10, Math.ceil(Math.max(aWidth, tWidth) * 0.16));
    for (let i = 1; i <= aWidth; i += 1) {
      current.fill(inf);
      const expected = i * tWidth / aWidth;
      const start = Math.max(1, Math.floor(expected - band));
      const end = Math.min(tWidth, Math.ceil(expected + band));
      for (let j = start; j <= end; j += 1) {
        const cost = columnCost(a, t, i - 1, j - 1);
        const diagonal = previous[j - 1];
        const skipActual = previous[j] + 0.28;
        const skipTemplate = current[j - 1] + 0.28;
        current[j] = cost + Math.min(diagonal, skipActual, skipTemplate);
      }
      const swap = previous;
      previous = current;
      current = swap;
    }
    const normalisedCost = previous[tWidth] / Math.max(aWidth, tWidth);
    return clamp(1 - normalisedCost, -1, 1) * 0.9 + widthRatio * 0.1;
  }

  function wholeLineSimilarity(actual, template) {
    if (!actual?.width || !actual?.height || !template?.width || !template?.height) return -9;
    const targetHeight = Math.max(actual.height, template.height);
    const actualWidth = Math.max(1, Math.round(actual.width * targetHeight / actual.height));
    const templateWidth = Math.max(1, Math.round(template.width * targetHeight / template.height));
    const canvasWidth = Math.max(actualWidth, templateWidth);
    const aScaled = resizeMaskTo(actual, actualWidth, targetHeight);
    const tScaled = resizeMaskTo(template, templateWidth, targetHeight);
    const a = new Uint8Array(canvasWidth * targetHeight);
    const t = new Uint8Array(canvasWidth * targetHeight);
    const aOffset = Math.floor((canvasWidth - actualWidth) / 2);
    const tOffset = Math.floor((canvasWidth - templateWidth) / 2);
    for (let y = 0; y < targetHeight; y += 1) {
      for (let x = 0; x < actualWidth; x += 1) a[aOffset + x + y * canvasWidth] = aScaled.data[x + y * actualWidth];
      for (let x = 0; x < templateWidth; x += 1) t[tOffset + x + y * canvasWidth] = tScaled.data[x + y * templateWidth];
    }
    const am = { width: canvasWidth, height: targetHeight, data: a };
    const tm = { width: canvasWidth, height: targetHeight, data: t };
    const ad = dilate(am);
    const td = dilate(tm);
    const aCount = maskCount(am);
    const tCount = maskCount(tm);
    const exact = intersectionCount(am, tm);
    const nearTemplate = intersectionCount(ad, tm);
    const nearActual = intersectionCount(td, am);
    const f1 = (2 * exact) / Math.max(1, aCount + tCount);
    const precision = nearTemplate / Math.max(1, tCount);
    const recall = nearActual / Math.max(1, aCount);
    const widthRatio = Math.min(actual.width, template.width) / Math.max(actual.width, template.width);
    const staticScore = 0.28 * f1 + 0.31 * precision + 0.31 * recall + 0.10 * widthRatio;
    const elasticScore = dtwLineSimilarity(actual, template);
    return 0.72 * elasticScore + 0.28 * staticScore;
  }

  function recogniseWholeLine(mask, candidates, font = root.OCR_aa_8px_mono_pof) {
    if (!mask?.width || !mask?.height || !font) return { text: '', score: -Infinity, confidence: 0, alternatives: [], method: 'whole-line' };
    const ranked = [...new Set(candidates.map(value => String(value)))].map(text => ({
      text,
      score: wholeLineSimilarity(mask, renderTextMask(font, text))
    })).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const second = ranked[1];
    const margin = best && second ? best.score - second.score : 1;
    const confidence = best ? Math.round(clamp(38 + best.score * 42 + margin * 260, 0, 100)) : 0;
    return {
      text: best?.text || '',
      score: best?.score ?? -Infinity,
      confidence,
      margin,
      alternatives: ranked.slice(1, 4),
      method: 'whole-line'
    };
  }

  function recogniseCandidates(mask, candidates, font = root.OCR_aa_8px_mono_pof) {
    const segmented = recogniseMask(mask, candidates, font);
    const whole = recogniseWholeLine(mask, candidates, font);

    // Percentages are short, fixed-format strings. Character segmentation is
    // substantially more reliable for distinguishing similar digits such as
    // 4/8 than elastic whole-line matching. Prefer it whenever all visible
    // characters were segmented with a credible score.
    const percentageSet = candidates.length === 101 && candidates[0] === '0%' && candidates[100] === '100%';
    if (percentageSet && segmented.text && segmented.segments >= 2 && segmented.segments <= 4 && segmented.score >= 0.78) {
      return { ...segmented, method: 'segmented-percent', whole };
    }
    if (!segmented.text) return { ...whole, segmented };
    if (!whole.text) return { ...segmented, method: 'segmented', whole };
    if (segmented.text === whole.text) {
      return {
        ...whole,
        confidence: Math.max(whole.confidence, segmented.confidence, Math.min(100, whole.confidence + 8)),
        method: 'consensus',
        segmented
      };
    }
    const segmentedReliable = segmented.confidence >= 82 && segmented.margin >= 0.08;
    const wholeReliable = whole.confidence >= 65 && whole.margin >= 0.015;
    if (segmentedReliable && !wholeReliable) return { ...segmented, method: 'segmented', whole };
    return { ...whole, segmented };
  }


  function splitMaskWords(mask, minimumGap = 4) {
    if (!mask?.width || !mask?.height) return [];
    const active = new Uint8Array(mask.width);
    for (let x = 0; x < mask.width; x += 1) {
      for (let y = 0; y < mask.height; y += 1) {
        if (mask.data[x + y * mask.width]) { active[x] = 1; break; }
      }
    }
    const ranges = [];
    let start = 0;
    let x = 0;
    while (x < mask.width) {
      while (x < mask.width && active[x]) x += 1;
      const gapStart = x;
      while (x < mask.width && !active[x]) x += 1;
      const gap = x - gapStart;
      if (gap >= minimumGap && gapStart > start) {
        ranges.push({ start, end: gapStart - 1, gap });
        start = x;
      }
    }
    if (start < mask.width) ranges.push({ start, end: mask.width - 1, gap: 0 });
    return ranges
      .map(range => ({ ...range, mask: tightMask(cropMask(mask, range.start, 0, range.end - range.start + 1, mask.height)) }))
      .filter(item => item.mask.width && item.mask.height);
  }

  function breedRecognitionNames() {
    const data = root.POF_DATA?.speciesData || {};
    const values = [];
    for (const info of Object.values(data)) {
      for (const breed of info.breeds || []) {
        if (info.name === 'Sheep' && / sheep$/i.test(breed.name)) {
          // Animal Info displays sex-specific sheep labels (ram/ewe), not the
          // canonical database suffix "sheep". Only scan the text that can
          // actually appear in this interface, then map it back to canonical.
          const stem = breed.name.replace(/ sheep$/i, '');
          values.push({ display: `${stem} ewe`, canonical: breed.name });
          values.push({ display: `${stem} ram`, canonical: breed.name });
        } else {
          values.push({ display: breed.name, canonical: breed.name });
        }
      }
    }
    return values;
  }

  function canonicaliseBreedLine(value) {
    const text = String(value || '');
    const match = text.match(/^Breed:\s*(.+?)\s*\((male|female)\)$/i);
    if (!match) return text;
    const alias = breedRecognitionNames().find(item => item.display.toLowerCase() === match[1].toLowerCase());
    return alias ? `Breed: ${alias.canonical} (${match[2].toLowerCase()})` : text;
  }

  function recogniseBreed(mask) {
    const aliases = breedRecognitionNames();
    const attempts = [];

    // The in-game POF font commonly leaves only a 3 px gap between words.
    // Try multiple gap thresholds and retain the strongest valid full breed sequence.
    for (const minimumGap of [3, 4, 5]) {
      const words = splitMaskWords(mask, minimumGap);
      if (words.length < 3) continue;
      const actualBreedWords = words.slice(1, -1).map(word => word.mask);
      const rankedBreeds = aliases
        .map(item => ({ text: item.display, canonical: item.canonical, parts: item.display.split(/\s+/).filter(Boolean) }))
        .filter(candidate => candidate.parts.length === actualBreedWords.length)
        .map(candidate => {
          const wordScores = candidate.parts.map((part, index) => wholeLineSimilarity(actualBreedWords[index], renderTextMask(root.OCR_aa_8px_mono_pof, part)));
          const score = wordScores.reduce((sum, value) => sum + value, 0) / Math.max(1, wordScores.length);
          return { text: candidate.text, canonical: candidate.canonical, score, wordScores };
        })
        .sort((a, b) => b.score - a.score);
      const bestBreed = rankedBreeds[0];
      const nextBreed = rankedBreeds[1];
      if (!bestBreed) continue;
      const breedMargin = nextBreed ? bestBreed.score - nextBreed.score : 1;
      const genderMask = words[words.length - 1].mask;
      const gender = recogniseWholeLine(genderMask, ['(male)', '(female)']);
      attempts.push({
        text: gender.text ? `Breed: ${bestBreed.canonical} ${gender.text}` : '',
        score: Math.min(bestBreed.score, gender.score),
        confidence: Math.min(
          Math.round(clamp(38 + bestBreed.score * 42 + breedMargin * 260, 0, 100)),
          gender.confidence
        ),
        margin: Math.min(breedMargin, gender.margin || 0),
        alternatives: rankedBreeds.slice(1, 4).map(item => ({ text: item.text, score: item.score })),
        method: `breed-word-reader-gap-${minimumGap}`,
        breed: { text: bestBreed.text, score: bestBreed.score, margin: breedMargin },
        gender,
        words: words.map(word => ({ start: word.start, end: word.end, width: word.mask.width }))
      });
    }

    const fullLine = recogniseWholeLine(mask, breedCandidates());
    attempts.push({ ...fullLine, text: canonicaliseBreedLine(fullLine.text), method: 'breed-full-line' });
    // Multiple segmentation profiles often agree on the correct breed while
    // one profile accidentally merges two words and produces a high-confidence
    // unrelated one-word breed. Rank by cross-profile consensus first, then by
    // confidence. This prevents labels such as "Black ram" becoming Cactoad.
    const votes = new Map();
    for (const attempt of attempts) {
      if (!/^Breed:\s.+\s\((?:male|female)\)$/.test(attempt.text || '')) continue;
      const entry = votes.get(attempt.text) || { count: 0, bestConfidence: 0, bestMargin: -Infinity, bestScore: -Infinity };
      entry.count += 1;
      entry.bestConfidence = Math.max(entry.bestConfidence, attempt.confidence || 0);
      entry.bestMargin = Math.max(entry.bestMargin, attempt.margin || -Infinity);
      entry.bestScore = Math.max(entry.bestScore, attempt.score || -Infinity);
      votes.set(attempt.text, entry);
    }
    attempts.sort((a, b) => {
      const aValid = /^Breed:\s.+\s\((?:male|female)\)$/.test(a.text || '') ? 1 : 0;
      const bValid = /^Breed:\s.+\s\((?:male|female)\)$/.test(b.text || '') ? 1 : 0;
      if (aValid !== bValid) return bValid - aValid;
      const av = votes.get(a.text) || { count: 0, bestConfidence: 0 };
      const bv = votes.get(b.text) || { count: 0, bestConfidence: 0 };
      const aRank = (av.count >= 2 ? 1000 : 0) + av.count * 25 + av.bestConfidence;
      const bRank = (bv.count >= 2 ? 1000 : 0) + bv.count * 25 + bv.bestConfidence;
      return bRank - aRank || (b.confidence || 0) - (a.confidence || 0) || (b.margin || 0) - (a.margin || 0) || (b.score || -9) - (a.score || -9);
    });
    const best = attempts[0] || { text: '', score: -Infinity, confidence: 0, alternatives: [] };
    const consensus = votes.get(best.text);
    if (consensus && consensus.count >= 2) best.confidence = Math.max(best.confidence || 0, Math.min(100, consensus.bestConfidence + 8));
    return { ...best, attempts: attempts.slice(1).map(item => ({ text: item.text, confidence: item.confidence, method: item.method })) };
  }

  function recogniseTraitBox(image, rect, candidates) {
    const lines = extractLineMasks(image, rect, rect.mode || 'trait');
    const fallbackMask = extractLineMask(image, rect, rect.mode || 'trait');
    const fallback = recogniseCandidates(fallbackMask, candidates);

    // Empty slots display the exact phrase "No Trait". Give that result a
    // dedicated whole-line check so a weak match against a real trait cannot
    // override an obvious empty slot, especially in slots 2 and 3.
    const noTrait = recogniseWholeLine(fallbackMask, ['No Trait']);
    if (noTrait.score >= 0.60 && noTrait.confidence >= 58) {
      return { ...noTrait, text: 'No Trait', method: 'dedicated-no-trait', lineCount: lines.length };
    }
    if (lines.length !== 2) return { ...fallback, lineCount: lines.length, method: fallback.method || 'single-line' };

    const twoWord = [...new Set(candidates.map(value => String(value)))]
      .map(text => ({ text, parts: text.split(/\s+/).filter(Boolean) }))
      .filter(candidate => candidate.parts.length === 2)
      .map(candidate => {
        const first = wholeLineSimilarity(lines[0], renderTextMask(root.OCR_aa_8px_mono_pof, candidate.parts[0]));
        const second = wholeLineSimilarity(lines[1], renderTextMask(root.OCR_aa_8px_mono_pof, candidate.parts[1]));
        return { text: candidate.text, score: (first + second) / 2, lineScores: [first, second] };
      })
      .sort((a, b) => b.score - a.score);
    const best = twoWord[0];
    const next = twoWord[1];
    if (!best) return { ...fallback, lineCount: lines.length };
    const margin = next ? best.score - next.score : 1;
    const confidence = Math.round(clamp(38 + best.score * 42 + margin * 260, 0, 100));
    const stacked = {
      text: best.text,
      score: best.score,
      confidence,
      margin,
      alternatives: twoWord.slice(1, 4),
      method: 'stacked-two-word-trait',
      lineCount: 2,
      lineScores: best.lineScores
    };
    return confidence >= 58 && margin >= 0.012 ? stacked : { ...fallback, stacked };
  }

  function cleanName(value) {
    return String(value || '')
      .replace(/[^A-Za-z0-9 '\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function readName(image) {
    const ocr = root.OCR;
    const font = root.OCR_aa_12px_mono;
    if (!ocr || !font || typeof ocr.findReadLine !== 'function') {
      return { text: '', confidence: 0, source: 'custom-name-font-unavailable' };
    }
    let data = image;
    try {
      if (typeof ImageData !== 'undefined' && !(image instanceof ImageData)) {
        data = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
      }
    } catch (_) {
      data = image;
    }
    const attempts = [];
    const colors = [[240, 190, 121], [255, 203, 5], [224, 177, 113]];
    const points = [[253, 74], [250, 73], [256, 75]];
    for (const color of colors) {
      for (const [x, y] of points) {
        try {
          const result = ocr.findReadLine(data, font, [color], x, y);
          const text = cleanName(result && result.text);
          if (text) attempts.push(text);
        } catch (_) {
          // Keep trying the alternate foreground colours and nearby baselines.
        }
      }
    }
    if (!attempts.length) return { text: '', confidence: 0, source: 'custom-name-font' };
    const votes = new Map();
    for (const attempt of attempts) {
      const canonical = attempt.toUpperCase();
      votes.set(canonical, (votes.get(canonical) || 0) + 1);
    }
    const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
    return {
      text: ranked[0][0],
      confidence: Math.round(clamp(50 + ranked[0][1] * 8, 0, 100)),
      source: 'custom-name-font',
      attempts
    };
  }

  function breedCandidates() {
    const candidates = [];
    for (const item of breedRecognitionNames()) {
      candidates.push(`Breed: ${item.display} (male)`);
      candidates.push(`Breed: ${item.display} (female)`);
    }
    return candidates;
  }

  function readPanel(image) {
    const stages = [...new Set([...(root.POF_DATA?.stages || []), 'Baby'])];
    const traits = [...(root.POF_DATA?.traits || []).map(trait => trait.name), 'No Trait'];
    const percentages = Array.from({ length: 101 }, (_, value) => `${value}%`);
    const diagnostics = {};
    const fields = {};

    const name = readName(image);
    fields.name = name.text && name.text.length >= 2 && name.confidence >= 55 ? name.text : '';
    diagnostics.name = name;

    const definitions = [
      ['stage', stages],
      ['breed', breedCandidates()],
      ['health', percentages],
      ['happiness', percentages],
      ['trait1', traits],
      ['trait2', traits],
      ['trait3', traits]
    ];
    for (const [key, candidates] of definitions) {
      const rect = FIELD_RECTS[key];
      const mask = extractLineMask(image, rect, rect.mode);
      let recognised;
      if (key === 'breed') {
        recognised = recogniseBreed(mask);
      } else if (key.startsWith('trait')) {
        recognised = recogniseTraitBox(image, rect, candidates);
      } else {
        recognised = recogniseCandidates(mask, candidates);
      }
      const minimumConfidence = key === 'breed' ? 58 : key === 'stage' ? 55 : key.startsWith('trait') ? 60 : 55;
      const accepted = recognised.confidence >= minimumConfidence ? recognised.text : '';
      fields[key] = accepted === 'Baby' ? 'Child' : accepted;
      diagnostics[key] = {
        ...recognised,
        maskWidth: mask.width,
        maskHeight: mask.height,
        rect
      };
    }
    return { fields, diagnostics };
  }

  function maskFromRows(rows) {
    const clean = rows.map(row => String(row));
    const width = Math.max(0, ...clean.map(row => row.length));
    const height = clean.length;
    const data = new Uint8Array(width * height);
    clean.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) data[x + y * width] = row[x] === '#' ? 1 : 0;
    });
    return tightMask({ width, height, data });
  }

  root.POF_VISION = {
    FIELD_RECTS,
    extractLineMask,
    extractLineMasks,
    segmentMask,
    resizeMask,
    glyphSimilarity,
    recogniseMask,
    recogniseWholeLine,
    recogniseCandidates,
    recogniseTraitBox,
    recogniseBreed,
    breedRecognitionNames,
    canonicaliseBreedLine,
    splitMaskWords,
    renderTextMask,
    wholeLineSimilarity,
    dtwLineSimilarity,
    readName,
    readPanel,
    maskFromRows,
    candidateCharacters
  };
})();

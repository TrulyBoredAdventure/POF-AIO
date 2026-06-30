'use strict';

(() => {
  const STORAGE_KEY = 'pof-aio-v2';
  const LEGACY_KEY = 'pof-pair-planner-v1';
  const INSTALL_URL = 'alt1://addapp/https://TrulyBoredAdventure.github.io/POF-AIO/appconfig.json';
  const C = window.POF_CORE;
  const D = window.POF_DATA;

  let state = loadState();
  let animalDraft = C.normaliseAnimal({ name: '', species: 'Rabbit' });
  let editingAnimalId = null;
  let scannerResult = null;
  let scannerScan = null;
  let scannerBusy = false;
  let scannerAutoTimer = null;
  let lastScannerFingerprint = '';
  let logFarm = 'All';
  let logSearch = '';
  let logHideComplete = false;
  let referenceSearch = '';
  let referenceSpecies = 'All';
  let idealPairFarm = 'All';
  let idealPairGoal = 'shiny';
  let idealPairSearch = '';
  const notified = new Set();
  const pendingConfirmations = new Map();
  const searchRenderTimers = new Map();

  function loadState() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (current) return C.migrate(current);
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      return C.migrate(legacy);
    } catch (_) {
      return C.defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function commit(message, type = 'info', rerender = true) {
    if (message) C.logEvent(state, message, type);
    saveState();
    if (rerender) renderActive();
  }

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  const opt = (value, label, selected) => `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`;
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const localDateTime = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const toIso = value => value ? new Date(value).toISOString() : '';
  const formatTime = iso => iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
  const speciesInfo = name => D.speciesData[name];
  const traitsForSlot = (species, slot) => D.traits.filter(trait => trait.slots.includes(slot) && (!trait.species || trait.species.includes(species)));

  function toast(message) {
    const node = $('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 2400);
  }

  function requireSecondClick(key, button, promptText = 'Click again to confirm', timeoutMs = 5000) {
    const now = Date.now();
    const pendingUntil = pendingConfirmations.get(key) || 0;
    if (pendingUntil > now) {
      pendingConfirmations.delete(key);
      return true;
    }
    pendingConfirmations.set(key, now + timeoutMs);
    const original = button.textContent;
    button.textContent = promptText;
    button.classList.add('confirm-armed');
    setTimeout(() => {
      if ((pendingConfirmations.get(key) || 0) <= Date.now()) {
        pendingConfirmations.delete(key);
        if (button.isConnected) {
          button.textContent = original;
          button.classList.remove('confirm-armed');
        }
      }
    }, timeoutMs + 50);
    return false;
  }

  function scheduleSearchRender(inputId, renderFn) {
    // Do not re-render the whole tab on every keystroke. Alt1 destroys and
    // recreates the input node during a render, which causes one-letter-at-a-time
    // typing. Debouncing keeps focus on the live input while the user types, then
    // refreshes the filtered results after a short pause.
    const input = $(inputId);
    const cursor = input?.selectionStart ?? null;
    clearTimeout(searchRenderTimers.get(inputId));
    searchRenderTimers.set(inputId, setTimeout(() => {
      renderFn();
      const next = $(inputId);
      if (!next) return;
      next.focus({ preventScroll: true });
      if (cursor !== null && typeof next.setSelectionRange === 'function') {
        const position = Math.min(cursor, next.value.length);
        next.setSelectionRange(position, position);
      }
    }, 225));
  }

  function setTab(tab) {
    state.activeTab = tab;
    saveState();
    document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(panel => { panel.hidden = panel.id !== tab; });
    renderActive();
  }

  function renderActive() {
    const renderers = {
      dashboard: renderDashboard,
      animals: renderAnimals,
      pens: renderPens,
      breeding: renderBreeding,
      'ideal-pairs': renderIdealPairs,
      disease: renderDisease,
      log: renderLog,
      buyers: renderBuyers,
      timers: renderTimers,
      reference: renderReference,
      scanner: renderScanner,
      settings: renderSettings,
      credits: renderCredits
    };
    updateHeader();
    (renderers[state.activeTab] || renderDashboard)();
  }

  function updateHeader() {
    const alt = window.POF_SCANNER.alt1Status();
    $('environment').textContent = alt.detected ? `Alt1 · ${alt.rsWidth || '?'}×${alt.rsHeight || '?'}` : 'Browser mode';
    $('environment').className = `environment ${alt.detected ? 'connected' : ''}`;
    $('add-app').hidden = alt.detected;
    $('add-app').href = INSTALL_URL;
    $('app-version').textContent = '2.6.2';
  }

  function metric(label, value, detail, className = '', attributes = '') {
    return `<article class="metric ${className}" ${attributes}><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
  }

  function attentionTooltip(tasks) {
    if (!tasks.length) return 'No urgent issues recorded.';
    return tasks.map(task => task.text).join('\n');
  }

  function renderDashboard() {
    const farmFilter = state.settings.dashboardFarm || 'All';
    const animals = state.animals.filter(animal => farmFilter === 'All' || speciesInfo(animal.species)?.farm === farmFilter);
    const pens = state.pens.filter(pen => farmFilter === 'All' || pen.farm === farmFilter);
    const log = C.logStats(state, farmFilter);
    const timers = C.upcomingTimers(state);
    const due = timers.filter(timer => timer.remainingMinutes <= 0).length;
    const tasks = C.dashboardTasks(state).filter(task => {
      if (farmFilter === 'All') return true;
      return !task.text.includes('Ranch') && !task.text.includes('Manor') ? true : task.text.includes(farmFilter.split(' ')[0]);
    });
    const attentionList = attentionTooltip(tasks);
    const attentionAttributes = `title="${esc(attentionList)}" aria-label="${esc(`Needs attention: ${attentionList}`)}"`;
    const penCards = pens.map(pen => {
      const occupants = C.animalsInPen(state, pen.id);
      const warnings = C.validatePen(state, pen);
      const hours = C.foodHoursRemaining(state, pen);
      return `<button class="pen-summary ${warnings.length ? 'has-warning' : ''}" data-go-tab="pens">
        <span><strong>${esc(pen.name)}</strong><em>${esc(pen.farm)}</em></span>
        <span>${occupants.length}/${pen.capacity} animals</span>
        <small>${occupants.length ? `${esc(occupants[0].species)} · food ${hours === null ? 'not set' : C.formatDuration(hours * 60)}` : 'Empty'}</small>
      </button>`;
    }).join('');

    $('dashboard').innerHTML = `
      <section class="hero-card">
        <div><span class="eyebrow">Farm command centre</span><h2>Player-Owned Farm overview</h2><p>Track both farms, surface problems, and keep the breeding log, buyers, food, and growth timers together.</p></div>
        <div class="segmented dashboard-farm-selector" role="group" aria-label="Farm filter">${['All', ...D.farms].map(farm => `<button data-dashboard-farm="${esc(farm)}" class="${farm === farmFilter ? 'active' : ''}">${farm === 'All' ? 'All farms' : esc(farm)}</button>`).join('')}</div>
      </section>
      <section class="metrics-grid">
        ${metric('Animals', animals.length, `${animals.filter(a => a.protected).length} protected`)}
        ${metric('Needs attention', tasks.length, tasks.length ? 'Hover to identify' : 'No urgent issues', `attention-tooltip ${tasks.length ? 'warn' : 'good'}`, attentionAttributes)}
        ${metric('Breeding log', `${log.percent}%`, `${log.complete}/${log.total} breeds`)}
        ${metric('Timers due', due, `${timers.length} active`, due ? 'warn' : '')}
      </section>
      <section class="dashboard-grid">
        <article class="panel-card">
          <div class="section-heading"><div><span class="eyebrow">Priority list</span><h2>What needs attention</h2></div><button class="ghost compact" data-go-tab="timers">Timers</button></div>
          <div class="task-list">${tasks.length ? tasks.map(task => `<button class="task ${task.severity}" data-go-tab="${task.tab}"><span>${esc(task.text)}</span><b>Open</b></button>`).join('') : '<div class="empty-state"><strong>No urgent issues recorded.</strong><p>Add animals and pen food levels to make the dashboard useful.</p></div>'}</div>
        </article>
        <article class="panel-card">
          <div class="section-heading"><div><span class="eyebrow">Paddocks</span><h2>Pen status</h2></div><button class="secondary compact" data-go-tab="pens">Manage</button></div>
          <div class="pen-summary-grid">${penCards}</div>
        </article>
      </section>
      <section class="panel-card">
        <div class="section-heading"><div><span class="eyebrow">Recent activity</span><h2>Farm history</h2></div><button class="ghost compact" id="clear-history">Clear</button></div>
        <div class="history-list">${state.history.length ? state.history.slice(0, 12).map(item => `<div><span>${esc(item.text)}</span><time>${esc(formatTime(item.at))}</time></div>`).join('') : '<p class="muted-copy">No activity recorded yet.</p>'}</div>
      </section>`;

    document.querySelectorAll('[data-dashboard-farm]').forEach(button => button.addEventListener('click', () => {
      state.settings.dashboardFarm = button.dataset.dashboardFarm;
      commit('', 'info');
    }));
    $('clear-history')?.addEventListener('click', () => {
      state.history = [];
      commit('', 'info');
    });
  }

  function resetAnimalDraft(species = 'Rabbit') {
    animalDraft = C.normaliseAnimal({ name: '', species, breed: speciesInfo(species).breeds[0].name });
    editingAnimalId = null;
  }

  function animalForm() {
    const info = speciesInfo(animalDraft.species);
    const speciesOptions = D.species.map(name => opt(name, `${name} · ${speciesInfo(name).farm}`, animalDraft.species)).join('');
    const breedOptions = info.breeds.map(breed => opt(breed.name, breed.shiny ? `${breed.name} (shiny)` : breed.name, animalDraft.breed)).join('');
    const penOptions = state.pens.filter(pen => C.isAnimalCompatibleWithPen(animalDraft, pen)).map(pen => opt(pen.id, `${pen.farm} — ${pen.name}`, animalDraft.penId)).join('');
    const traitRows = [1, 2, 3].map(slot => `<label class="field"><span>Trait ${slot}</span><select data-animal-trait="${slot - 1}"><option value="">Empty / unknown</option>${traitsForSlot(animalDraft.species, slot).map(trait => opt(trait.name, trait.name, animalDraft.traits[slot - 1])).join('')}</select></label>`).join('');
    return `<form id="animal-form" class="editor-card">
      <div class="section-heading"><div><span class="eyebrow">${editingAnimalId ? 'Edit record' : 'New record'}</span><h2>${editingAnimalId ? esc(animalDraft.name) : 'Add an animal'}</h2></div>${editingAnimalId ? '<button type="button" id="cancel-animal" class="ghost compact">Cancel</button>' : ''}</div>
      <div class="form-grid three">
        <label class="field"><span>Name</span><input id="animal-name" value="${esc(animalDraft.name)}" placeholder="Optional nickname"></label>
        <label class="field"><span>Species</span><select id="animal-species">${speciesOptions}</select></label>
        <label class="field"><span>Breed</span><select id="animal-breed">${breedOptions}</select></label>
        <label class="field"><span>Gender</span><select id="animal-gender">${['Female','Male','Unknown'].map(v => opt(v,v,animalDraft.gender)).join('')}</select></label>
        <label class="field"><span>Growth stage</span><select id="animal-stage">${D.stages.filter((stage, index) => !(index === 0 && info.stages[0] === 0)).map(v => opt(v,v,animalDraft.stage)).join('')}</select></label>
        <label class="field"><span>Pen</span><select id="animal-pen"><option value="">Unassigned</option>${penOptions}</select></label>
        <label class="field"><span>Health</span><input id="animal-health" type="number" min="0" max="100" value="${animalDraft.health}"></label>
        <label class="field"><span>Happiness</span><input id="animal-happiness" type="number" min="0" max="100" value="${animalDraft.happiness}"></label>
        <label class="field"><span>Stage started</span><input id="animal-stage-time" type="datetime-local" value="${esc(localDateTime(animalDraft.lastStageAt))}"></label>
      </div>
      <div class="form-grid three">${traitRows}</div>
      <div class="form-grid two">
        <label class="field"><span>Notes</span><textarea id="animal-notes" rows="2" placeholder="Buyer target, ownership, trade note…">${esc(animalDraft.notes)}</textarea></label>
        <div class="check-stack"><label><input id="animal-diseased" type="checkbox"${animalDraft.diseased ? ' checked' : ''}> Diseased</label><label><input id="animal-protected" type="checkbox"${animalDraft.protected ? ' checked' : ''}> Protect from buyer recommendations</label></div>
      </div>
      <div class="form-actions"><button class="primary" type="submit">${editingAnimalId ? 'Save changes' : 'Add animal'}</button><button class="secondary" type="button" id="animal-start-now">Set stage start to now</button></div>
    </form>`;
  }

  function renderAnimals() {
    const valueGoal = state.settings.animalValueGoal || 'Balanced';
    const valueSort = state.settings.animalValueSort || 'Saved order';
    const rated = state.animals.map((animal, index) => ({ animal, index, rating: C.rateAnimal(state, animal, valueGoal) }));
    if (valueSort === 'Keep first') rated.sort((a,b) => b.rating.keepScore - a.rating.keepScore || a.index - b.index);
    else if (valueSort === 'Sell first') rated.sort((a,b) => b.rating.sellScore - a.rating.sellScore || a.index - b.index);
    else if (valueSort === 'Highest beans') rated.sort((a,b) => b.rating.beanEstimate.estimate - a.rating.beanEstimate.estimate || a.index - b.index);

    const cards = rated.length ? rated.map(({ animal, rating }) => {
      const info = speciesInfo(animal.species);
      const due = C.nextStageDue(animal);
      const tone = rating.recommendation.startsWith('Keep') ? 'keep' : rating.recommendation.includes('Sell') ? 'sell' : rating.recommendation === 'Situational' ? 'situational' : 'grow';
      const details = rating.reasons.map(reason => `<li>${esc(reason)}</li>`).join('');
      const cautions = rating.cautions.map(reason => `<li>${esc(reason)}</li>`).join('');
      const buyerLine = rating.buyer ? `Current buyer estimate: ${rating.beanEstimate.estimate} beans` : `Base stage estimate: ${rating.beanEstimate.estimate} beans`;
      return `<article class="animal-card ${animal.diseased ? 'diseased' : ''}">
        <div class="animal-title"><div><span class="eyebrow">${esc(info.farm)} · ${esc(info.size)}</span><h3>${esc(animal.name || animal.species)}</h3><p>${esc(animal.breed)} · ${esc(animal.gender)} · ${esc(animal.stage)}</p></div><div class="status-pills">${animal.protected ? '<span>Protected</span>' : ''}${animal.diseased ? '<span class="bad">Diseased</span>' : ''}</div></div>
        <div class="bar-row"><label>Health <b>${animal.health}%</b><i><span style="width:${animal.health}%"></span></i></label><label>Happiness <b>${animal.happiness}%</b><i><span style="width:${animal.happiness}%"></span></i></label></div>
        <div class="chips">${animal.traits.filter(Boolean).map(trait => `<span>${esc(trait)}</span>`).join('') || '<em>No traits recorded</em>'}</div>
        <section class="animal-value ${tone}">
          <div class="value-heading"><div><span>Individual value · ${esc(valueGoal)}</span><strong>${esc(rating.recommendation)}</strong></div><b class="value-grade">${rating.grade}</b></div>
          <div class="value-bars"><label><span>Keep ${rating.keepScore}</span><progress max="100" value="${rating.keepScore}"></progress></label><label><span>Sell ${rating.sellScore}</span><progress max="100" value="${rating.sellScore}"></progress></label></div>
          <p><strong>Best use:</strong> ${esc(rating.bestUse)} · ${esc(buyerLine)}</p>
          <details><summary>Why this rating · ${esc(rating.confidence)} confidence</summary><ul>${details || '<li>No strong contextual signal was found.</li>'}</ul>${cautions ? `<h4>Watch for</h4><ul class="cautions">${cautions}</ul>` : ''}<small>Farm-utility and bean guidance only; this does not estimate player-to-player GP value.</small></details>
        </section>
        <dl class="mini-details"><div><dt>Pen</dt><dd>${esc(C.penInfo(state, animal.penId)?.name || 'Unassigned')}</dd></div><div><dt>Next stage</dt><dd>${due ? esc(formatTime(due.toISOString())) : 'No timer'}</dd></div></dl>
        <div class="card-actions"><button class="secondary" data-edit-animal="${animal.id}">Edit</button><button class="ghost" data-use-parent="0" data-animal-id="${animal.id}">Parent A</button><button class="ghost" data-use-parent="1" data-animal-id="${animal.id}">Parent B</button><button type="button" class="ghost danger" data-delete-animal="${animal.id}">Delete</button></div>
      </article>`;
    }).join('') : '<div class="empty-state full"><strong>No animals saved.</strong><p>Add breeding stock, animals being raised, or buyer candidates using the form above.</p></div>';

    $('animals').innerHTML = `${animalForm()}
      <section class="toolbar-card animal-value-toolbar"><div><span class="eyebrow">Keep or sell advisor</span><h2>Individual animal ratings</h2><p>Ratings compare each animal with your saved stock, breeding log, and configured buyers.</p></div><label class="field"><span>Primary goal</span><select id="animal-value-goal">${D.animalValueGoals.map(goal => opt(goal.id,goal.label,valueGoal)).join('')}</select></label><label class="field"><span>Sort ratings</span><select id="animal-value-sort">${['Saved order','Keep first','Sell first','Highest beans'].map(v => opt(v,v,valueSort)).join('')}</select></label></section>
      <section class="section-heading"><div><span class="eyebrow">Local library</span><h2>Animals (${state.animals.length})</h2></div><button class="secondary compact" data-go-tab="scanner">Scan Animal</button></section><div class="animal-grid">${cards}</div>`;

    $('animal-value-goal').addEventListener('change', event => { state.settings.animalValueGoal = event.target.value; commit('', 'info'); });
    $('animal-value-sort').addEventListener('change', event => { state.settings.animalValueSort = event.target.value; commit('', 'info'); });
    $('animal-species').addEventListener('change', event => {
      animalDraft.species = event.target.value;
      animalDraft.breed = speciesInfo(animalDraft.species).breeds[0].name;
      animalDraft.traits = ['', '', ''];
      animalDraft.penId = '';
      const info = speciesInfo(animalDraft.species);
      if (info.stages[0] === 0 && animalDraft.stage === 'Egg') animalDraft.stage = 'Child';
      renderAnimals();
    });
    $('animal-breed').addEventListener('change', e => { animalDraft.breed = e.target.value; });
    $('animal-gender').addEventListener('change', e => { animalDraft.gender = e.target.value; });
    $('animal-stage').addEventListener('change', e => { animalDraft.stage = e.target.value; });
    $('animal-pen').addEventListener('change', e => { animalDraft.penId = e.target.value; });
    document.querySelectorAll('[data-animal-trait]').forEach(select => select.addEventListener('change', e => { animalDraft.traits[num(e.target.dataset.animalTrait)] = e.target.value; }));
    $('animal-start-now').addEventListener('click', () => { animalDraft.lastStageAt = C.nowIso(); renderAnimals(); });
    $('cancel-animal')?.addEventListener('click', () => { resetAnimalDraft(); renderAnimals(); });
    $('animal-form').addEventListener('submit', event => {
      event.preventDefault();
      Object.assign(animalDraft, {
        name: $('animal-name').value.trim() || animalDraft.species,
        breed: $('animal-breed').value,
        gender: $('animal-gender').value,
        stage: $('animal-stage').value,
        penId: $('animal-pen').value,
        health: num($('animal-health').value),
        happiness: num($('animal-happiness').value),
        lastStageAt: toIso($('animal-stage-time').value),
        notes: $('animal-notes').value.trim(),
        diseased: $('animal-diseased').checked,
        protected: $('animal-protected').checked
      });
      const record = C.normaliseAnimal(animalDraft);
      if (record.penId && C.animalsInPen(state, record.penId).filter(a => a.id !== record.id).length >= C.penInfo(state, record.penId).capacity) {
        toast('That pen is already at capacity.');
        return;
      }
      if (editingAnimalId) {
        const index = state.animals.findIndex(a => a.id === editingAnimalId);
        state.animals[index] = record;
        commit(`Updated ${record.name}.`);
      } else {
        state.animals.push(record);
        commit(`Added ${record.name} to the animal library.`);
      }
      resetAnimalDraft(record.species);
      renderAnimals();
    });
    document.querySelectorAll('[data-edit-animal]').forEach(button => button.addEventListener('click', () => {
      editingAnimalId = button.dataset.editAnimal;
      animalDraft = C.clone(state.animals.find(a => a.id === editingAnimalId));
      renderAnimals();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    document.querySelectorAll('[data-delete-animal]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const animal = state.animals.find(a => a.id === button.dataset.deleteAnimal);
      if (!animal) return;
      const card = button.closest('.animal-card, .panel-card, article, section') || button.parentElement;
      let confirmBox = card.querySelector(`[data-delete-confirm-box="${animal.id}"]`);
      if (confirmBox) { confirmBox.remove(); return; }
      confirmBox = document.createElement('div');
      confirmBox.className = 'inline-confirm';
      confirmBox.dataset.deleteConfirmBox = animal.id;
      confirmBox.innerHTML = `<strong>Delete ${esc(animal.name)}?</strong><span>This cannot be undone.</span><div class="form-actions"><button type="button" class="danger-button" data-confirm-delete="${esc(animal.id)}">Yes, delete</button><button type="button" class="ghost" data-cancel-delete>Cancel</button></div>`;
      button.insertAdjacentElement('afterend', confirmBox);
      confirmBox.querySelector('[data-cancel-delete]').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); confirmBox.remove(); });
      confirmBox.querySelector('[data-confirm-delete]').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        state.animals = state.animals.filter(a => a.id !== animal.id);
        if (editingAnimalId === animal.id) resetAnimalDraft(animal.species);
        commit(`Deleted ${animal.name}.`, 'warning');
        toast(`${animal.name} was deleted.`);
      });
    }));
  }

  function renderPens() {
    const cards = state.pens.map(pen => {
      const animals = C.animalsInPen(state, pen.id);
      const warnings = C.validatePen(state, pen);
      const selectedInfo = pen.species ? speciesInfo(pen.species) : (animals[0] ? speciesInfo(animals[0].species) : null);
      const allowedSpecies = D.species.filter(name => {
        const info = speciesInfo(name);
        return info.farm === pen.farm && (pen.size === 'Any' || info.size === pen.size);
      });
      const available = state.animals.filter(animal => !animal.penId && C.isAnimalCompatibleWithPen(animal, pen));
      const foodTypes = selectedInfo?.foods || [];
      const hours = C.foodHoursRemaining(state, pen);
      return `<article class="pen-card ${warnings.length ? 'has-warning' : ''}">
        <div class="section-heading"><div><span class="eyebrow">${esc(pen.farm)} · ${esc(pen.size)}</span><h2>${esc(pen.name)}</h2></div><strong class="capacity">${animals.length}/${pen.capacity}</strong></div>
        <div class="form-grid two">
          <label class="field"><span>Planned species</span><select data-pen-id="${pen.id}" data-pen-field="species"><option value="">Not set</option>${allowedSpecies.map(name => opt(name,name,pen.species)).join('')}</select></label>
          <label class="field"><span>Goal</span><select data-pen-id="${pen.id}" data-pen-field="goal">${D.goalsExtended.map(v => opt(v,v,pen.goal)).join('')}</select></label>
          <label class="field"><span>Food type</span><select data-pen-id="${pen.id}" data-pen-field="foodType"><option value="">Not recorded</option>${foodTypes.map(v => opt(v,v,pen.foodType)).join('')}</select></label>
          <label class="field"><span>Food quantity</span><input data-pen-id="${pen.id}" data-pen-field="foodQuantity" type="number" min="0" max="1000" value="${num(pen.foodQuantity)}"></label>
          <label class="field"><span>Farmhand</span><select data-pen-id="${pen.id}" data-pen-field="farmhand">${D.farmhands.map(v => opt(v,v,pen.farmhand)).join('')}</select></label>
          <label class="check-field"><input data-pen-id="${pen.id}" data-pen-field="totem" type="checkbox"${pen.totem ? ' checked' : ''}><span>Farm totem installed</span></label>
        </div>
        <div class="food-estimate"><strong>${hours === null ? 'No food estimate' : `${C.formatDuration(hours * 60)} remaining`}</strong><span>${animals.length ? 'Based on recorded quantity and current occupancy.' : 'Add animals to calculate usage.'}</span></div>
        <div class="pen-animals">${animals.length ? animals.map(animal => `<div><span><strong>${esc(animal.name)}</strong><small>${esc(animal.species)} · ${esc(animal.stage)}</small></span><button class="icon-button" data-remove-pen-animal="${animal.id}">Remove</button></div>`).join('') : '<p class="muted-copy">No animals assigned.</p>'}</div>
        <div class="inline-add"><select id="add-${pen.id}"><option value="">Add an unassigned animal…</option>${available.map(animal => opt(animal.id, `${animal.name} · ${animal.species}`, '')).join('')}</select><button class="secondary" data-add-pen-animal="${pen.id}">Add</button></div>
        ${warnings.length ? `<ul class="warning-list">${warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('');
    $('pens').innerHTML = `<section class="section-heading"><div><span class="eyebrow">Farm layout</span><h2>Pens and food</h2></div><p>Food estimates use the species pen-size consumption rate and the number of animals currently recorded.</p></section><div class="pen-grid">${cards}</div>`;

    document.querySelectorAll('[data-pen-field]').forEach(input => input.addEventListener('change', () => {
      const pen = state.pens.find(p => p.id === input.dataset.penId);
      const field = input.dataset.penField;
      pen[field] = input.type === 'checkbox' ? input.checked : input.type === 'number' ? num(input.value) : input.value;
      if (field === 'species') {
        const foods = speciesInfo(pen.species)?.foods || [];
        if (!foods.includes(pen.foodType)) pen.foodType = foods[0] || '';
      }
      commit('', 'info');
    }));
    document.querySelectorAll('[data-add-pen-animal]').forEach(button => button.addEventListener('click', () => {
      const pen = C.penInfo(state, button.dataset.addPenAnimal);
      const select = $(`add-${pen.id}`);
      const animal = state.animals.find(a => a.id === select.value);
      if (!animal) return;
      if (C.animalsInPen(state, pen.id).length >= pen.capacity) return toast('That pen is full.');
      animal.penId = pen.id;
      if (!pen.species) pen.species = animal.species;
      commit(`Assigned ${animal.name} to ${pen.name}.`);
    }));
    document.querySelectorAll('[data-remove-pen-animal]').forEach(button => button.addEventListener('click', () => {
      const animal = state.animals.find(a => a.id === button.dataset.removePenAnimal);
      animal.penId = '';
      commit(`Removed ${animal.name} from its pen.`);
    }));
  }

  function parentCard(parent, index) {
    const info = speciesInfo(parent.species);
    return `<article class="parent-card">
      <div class="section-heading"><div><span class="eyebrow">Parent ${index ? 'B' : 'A'}</span><h2>${esc(parent.name)}</h2></div></div>
      <div class="form-grid two">
        <label class="field"><span>Name</span><input data-parent-index="${index}" data-parent-field="name" value="${esc(parent.name)}"></label>
        <label class="field"><span>Load saved</span><select id="parent-saved-${index}"><option value="">Choose animal…</option>${state.animals.map(a => opt(a.id, `${a.name} · ${a.species}`, '')).join('')}</select></label>
        <label class="field"><span>Species</span><select data-parent-index="${index}" data-parent-field="species">${D.species.map(name => opt(name,name,parent.species)).join('')}</select></label>
        <label class="field"><span>Breed</span><select data-parent-index="${index}" data-parent-field="breed">${info.breeds.map(b => opt(b.name,b.name,parent.breed)).join('')}</select></label>
        <label class="field"><span>Gender</span><select data-parent-index="${index}" data-parent-field="gender">${['Female','Male','Unknown'].map(v => opt(v,v,parent.gender)).join('')}</select></label>
        <button class="secondary align-end" data-load-parent="${index}">Load animal</button>
      </div>
      <div class="form-grid three">${[1,2,3].map(slot => `<label class="field"><span>Trait ${slot}</span><select data-parent-index="${index}" data-parent-trait="${slot - 1}"><option value="">Empty</option>${traitsForSlot(parent.species,slot).map(t => opt(t.name,t.name,parent.traits[slot - 1])).join('')}</select></label>`).join('')}</div>
    </article>`;
  }

  function renderBreeding() {
    const result = C.evaluatePair(state);
    $('breeding').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">Breeding advisor</span><h2>Pair evaluator</h2><p>Compare two saved or manually entered parents against a selected breeding goal.</p></div><label class="field goal-select"><span>Goal</span><select id="pair-goal">${Object.entries(D.goals).map(([key,value]) => opt(key,value.name,state.goal)).join('')}</select></label></section>
      <div class="parents-grid">${parentCard(state.parents[0],0)}${parentCard(state.parents[1],1)}</div>
      <section class="result-card"><div class="score-block"><div><span class="eyebrow">Pair rating</span><h2>${esc(result.headline)}</h2><p>Score ${result.score} of ${result.max}</p></div><div class="score-ring" style="--score:${result.percent}"><strong>${result.percent}</strong><span>/100</span></div></div>
      <div class="progress"><span style="width:${result.percent}%"></span></div>
      ${result.positives.length ? `<div class="result-group positive"><h3>What works</h3><ul>${result.positives.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}
      ${result.recommendations.length ? `<div class="result-group recommend"><h3>Recommended changes</h3><ul>${result.recommendations.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}
      ${result.warnings.length ? `<div class="result-group warning"><h3>Warnings</h3><ul>${result.warnings.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : ''}</section>`;

    $('pair-goal').addEventListener('change', e => { state.goal = e.target.value; commit('', 'info'); });
    document.querySelectorAll('[data-parent-field]').forEach(input => input.addEventListener('change', () => {
      const parent = state.parents[num(input.dataset.parentIndex)];
      const field = input.dataset.parentField;
      parent[field] = input.value;
      if (field === 'species') {
        parent.breed = speciesInfo(parent.species).breeds[0].name;
        parent.traits = ['', '', ''];
      }
      commit('', 'info');
    }));
    document.querySelectorAll('[data-parent-trait]').forEach(input => input.addEventListener('change', () => {
      state.parents[num(input.dataset.parentIndex)].traits[num(input.dataset.parentTrait)] = input.value;
      commit('', 'info');
    }));
    document.querySelectorAll('[data-load-parent]').forEach(button => button.addEventListener('click', () => {
      const index = num(button.dataset.loadParent);
      const animal = state.animals.find(a => a.id === $(`parent-saved-${index}`).value);
      if (!animal) return;
      state.parents[index] = { name: animal.name, species: animal.species, breed: animal.breed, gender: animal.gender, traits: [...animal.traits] };
      commit(`Loaded ${animal.name} as Parent ${index ? 'B' : 'A'}.`);
    }));
  }


  function idealGoalAlignment(goal) {
    const map = {
      shiny: {
        label: 'Shiny hunting', valueGoal: 'Shiny', pairGoal: 'Shiny', penGoal: 'Shiny',
        summary: 'Prioritises Sparkling, Glistening, and Radiant to raise shiny-offspring odds.'
      },
      output: {
        label: 'Breeding output', valueGoal: 'Breeding', pairGoal: 'General breeding', penGoal: 'Breeding',
        summary: 'Prioritises Studly so the pair produces more offspring attempts over time.'
      },
      multi: {
        label: 'Three-trait progression', valueGoal: 'Breeding', pairGoal: 'Multi-trait', penGoal: 'Breeding',
        summary: 'Prioritises Genetic Mutation and Genetic Instability to push offspring toward three trait slots.'
      },
      maintenance: {
        label: 'Low maintenance', valueGoal: 'LowMaintenance', pairGoal: 'Low maintenance', penGoal: 'Low maintenance',
        summary: 'Prioritises Joyful, Immune, and Studly for practical low-effort breeding stock.'
      },
      log: {
        label: 'Breeding log', valueGoal: 'BreedingLog', pairGoal: 'Breeding log', penGoal: 'Breeding log',
        summary: 'Prioritises breed variety and breeding attempts for missing normal or shiny log entries.'
      },
      beans: {
        label: 'Bean Sales', valueGoal: 'Beans', pairGoal: 'Beans, XP, and produce', penGoal: 'Beans',
        summary: 'Prioritises offspring volume and bean-sale traits so saved animals align with the bean-sales recommendation flow.'
      }
    };
    return map[goal] || map.shiny;
  }

  function idealTraitCoverage(plan) {
    const required = [...new Set([...plan.parentA, ...plan.parentB])];
    return required.map(trait => {
      const matches = state.animals.filter(animal => animal.species === plan.species && (animal.traits || []).includes(trait));
      return { trait, count: matches.length, names: matches.slice(0, 3).map(animal => animal.name || 'Unnamed') };
    });
  }

  function renderIdealPairs() {
    const goalLabels = {
      shiny: 'Shiny hunting',
      output: 'Breeding output',
      multi: 'Three-trait progression',
      maintenance: 'Low maintenance',
      log: 'Breeding log',
      beans: 'Bean Sales'
    };
    const alignment = idealGoalAlignment(idealPairGoal);
    const plans = Object.values(D.speciesData)
      .filter(info => idealPairFarm === 'All' || info.farm === idealPairFarm)
      .filter(info => `${info.name} ${info.shiny || ''} ${info.breeds.map(b => b.name).join(' ')}`.toLowerCase().includes(idealPairSearch.toLowerCase()))
      .map(info => D.idealPairPlan(info.name, idealPairGoal));

    const cards = plans.map(plan => {
      const coverage = idealTraitCoverage(plan);
      const ownedCount = coverage.filter(item => item.count).length;
      const coverageRows = coverage.map(item => `<span class="coverage-pill ${item.count ? 'owned' : 'missing'}">${item.count ? '✓' : '✗'} ${esc(item.trait)}${item.count ? ` · ${item.count}` : ''}</span>`).join('');
      return `<article class="ideal-pair-card ${plan.special ? 'special' : ''}">
        <header><div><span class="eyebrow">${esc(plan.farm)} · ${esc(plan.size)}</span><h3>${esc(plan.species)}</h3></div><span class="status-pill ${plan.special ? 'good' : ''}">${esc(plan.target)}</span></header>
        <div class="ideal-parent-grid">
          <section><strong>Parent A</strong><div class="trait-slots">${plan.parentA.map((trait, i) => `<span><b>${i + 1}</b>${esc(trait)}</span>`).join('')}</div></section>
          <section><strong>Parent B</strong><div class="trait-slots">${plan.parentB.map((trait, i) => `<span><b>${i + 1}</b>${esc(trait)}</span>`).join('')}</div></section>
        </div>
        <p>${esc(plan.reason)}</p>
        <div class="trait-coverage"><strong>Saved trait coverage: ${ownedCount}/${coverage.length}</strong><div>${coverageRows}</div></div>
        ${plan.note ? `<small>${esc(plan.note)}</small>` : ''}
        ${plan.valid ? '<small class="pair-valid">All six trait placements are obtainable.</small>' : `<small class="pair-invalid">${plan.validationErrors.map(esc).join(' ')}</small>`}
      </article>`;
    }).join('');

    $('ideal-pairs').innerHTML = `
      <section class="hero-card"><div><span class="eyebrow">Breeding reference</span><h2>Ideal breeding pairs</h2><p>Recommended six-trait layouts for every supported species. The selected goal aligns with the rest of the app and does not add another planner workflow.</p></div></section>
      <section class="toolbar-card ideal-pair-toolbar">
        <label class="search grow"><span>Search animal or breed</span><input id="ideal-pair-search" value="${esc(idealPairSearch)}" placeholder="Dragon, chinchompa, Malletops…"></label>
        <label class="field"><span>Goal</span><select id="ideal-pair-goal">${Object.entries(goalLabels).map(([value,label]) => opt(value,label,idealPairGoal)).join('')}</select></label>
        <div class="segmented" role="group" aria-label="Farm filter">${['All', ...D.farms].map(farm => `<button data-ideal-farm="${esc(farm)}" class="${farm === idealPairFarm ? 'active' : ''}">${farm === 'All' ? 'All' : esc(farm === 'Manor Farm' ? 'Manor' : 'Ranch')}</button>`).join('')}</div>
      </section>
      <section class="panel-card goal-alignment-card">
        <div class="section-heading"><div><span class="eyebrow">Goal alignment</span><h2>${esc(alignment.label)}</h2></div></div>
        <p>${esc(alignment.summary)}</p>
        <div class="goal-alignment-grid">
          <span><b>Animals / Scan recommendation</b>${esc(alignment.valueGoal)}</span>
          <span><b>Pair evaluator</b>${esc(alignment.pairGoal)}</span>
          <span><b>Pen planning</b>${esc(alignment.penGoal)}</span>
        </div>
      </section>
      <section class="section-heading"><div><span class="eyebrow">${esc(goalLabels[idealPairGoal] || 'Shiny hunting')}</span><h2>${plans.length} animal types</h2></div></section>
      <div class="ideal-pair-list">${cards || '<div class="empty-state"><strong>No matching animals.</strong><p>Change the farm filter or search.</p></div>'}</div>`;

    $('ideal-pair-search').addEventListener('input', event => { idealPairSearch = event.target.value; scheduleSearchRender('ideal-pair-search', renderIdealPairs); });
    $('ideal-pair-goal').addEventListener('change', event => { idealPairGoal = event.target.value; renderIdealPairs(); });
    document.querySelectorAll('[data-ideal-farm]').forEach(button => button.addEventListener('click', () => { idealPairFarm = button.dataset.idealFarm; renderIdealPairs(); }));
  }

  function renderDisease() {
    const d = state.disease;
    const diagnosis = window.POF_DISEASES.diagnose(d);
    const fields = Object.entries(window.POF_DISEASES.bodyParts).map(([part,label]) => `<label class="field"><span>${esc(label)}</span><select data-disease-part="${part}"><option value="">Not examined</option>${window.POF_DISEASES.uniqueSymptoms(part).map(symptom => opt(symptom,window.POF_DISEASES.displaySymptom(part,symptom),d[part])).join('')}</select></label>`).join('');
    let result = '<div class="diagnosis-result empty"><span class="eyebrow">Disease helper</span><h2>Inspect the animal</h2><p>Select one or more observed symptoms.</p></div>';
    if (diagnosis.status === 'diagnosed') result = `<div class="diagnosis-result diagnosed"><span class="eyebrow">Diagnosis</span><h2>${esc(diagnosis.diagnosis)}</h2><p>Choose <strong>${esc(diagnosis.treatment)}</strong> in the in-game treatment list.</p></div>`;
    if (diagnosis.status === 'ambiguous') result = `<div class="diagnosis-result ambiguous"><span class="eyebrow">More information needed</span><h2>${diagnosis.candidates.length} possible diseases</h2><div class="chips">${diagnosis.candidates.map(v => `<span>${esc(v)}</span>`).join('')}</div><p>${esc(diagnosis.message)}</p></div>`;
    if (diagnosis.status === 'conflict') result = `<div class="diagnosis-result conflict"><span class="eyebrow">Conflicting symptoms</span><h2>No exact match</h2><p>${esc(diagnosis.message)}</p></div>`;
    const parsed = d.text ? window.POF_DISEASES.parseSymptomText(d.text) : null;
    $('disease').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">All six illnesses</span><h2>Disease diagnoser</h2><p>Rank matching diseases without guessing when the symptoms are ambiguous.</p></div><button id="clear-disease" class="secondary">Clear symptoms</button></section>
      <div class="disease-grid"><section class="editor-card"><div class="form-grid two">${fields}</div><label class="field"><span>Pasted OCR or examination text</span><textarea id="disease-text" rows="7" placeholder="Paste symptom lines here…">${esc(d.text)}</textarea></label><div class="form-actions"><button id="apply-disease-text" class="primary">Apply matched symptoms</button></div>${parsed ? `<p class="scan-summary">Matched ${parsed.matches.length} line${parsed.matches.length === 1 ? '' : 's'} at ${parsed.confidence}% average confidence.</p>` : ''}</section>${result}</div>
      <section class="panel-card"><div class="section-heading"><div><span class="eyebrow">Animal records</span><h2>Mark an animal cured</h2></div></div><div class="inline-list">${state.animals.filter(a => a.diseased).map(a => `<button class="secondary" data-cure-animal="${a.id}">${esc(a.name)}</button>`).join('') || '<p class="muted-copy">No saved animals are marked diseased.</p>'}</div></section>`;
    document.querySelectorAll('[data-disease-part]').forEach(select => select.addEventListener('change', () => { d[select.dataset.diseasePart] = select.value; commit('', 'info'); }));
    $('disease-text').addEventListener('input', e => { d.text = e.target.value; saveState(); });
    $('apply-disease-text').addEventListener('click', () => {
      const parsedNow = window.POF_DISEASES.parseSymptomText($('disease-text').value);
      d.text = $('disease-text').value;
      Object.assign(d, parsedNow.selections);
      commit('Applied disease symptom text.');
    });
    $('clear-disease').addEventListener('click', () => { state.disease = { head:'',eyes:'',legs:'',stomach:'',text:'' }; commit('Cleared disease symptoms.'); });
    document.querySelectorAll('[data-cure-animal]').forEach(button => button.addEventListener('click', () => {
      const animal = state.animals.find(a => a.id === button.dataset.cureAnimal);
      animal.diseased = false;
      commit(`Marked ${animal.name} as cured.`);
    }));
  }

  function renderLog() {
    const groups = Object.values(D.speciesData).filter(info => logFarm === 'All' || info.farm === logFarm).map(info => {
      const breeds = info.breeds.filter(breed => {
        const matches = `${info.name} ${breed.name}`.toLowerCase().includes(logSearch.toLowerCase());
        const complete = Boolean(state.breedingLog[C.logKey(info.name, breed.name)]);
        return matches && (!logHideComplete || !complete);
      });
      if (!breeds.length) return '';
      const done = info.breeds.filter(b => state.breedingLog[C.logKey(info.name,b.name)]).length;
      return `<article class="log-card"><header><div><span class="eyebrow">${esc(info.farm)} · ${esc(info.size)}</span><h3>${esc(info.name)}</h3></div><strong>${done}/${info.breeds.length}</strong></header><div class="log-breeds">${breeds.map(breed => {
        const key = C.logKey(info.name, breed.name);
        return `<label class="log-entry ${state.breedingLog[key] ? 'complete' : ''}"><input type="checkbox" data-log-key="${esc(key)}"${state.breedingLog[key] ? ' checked' : ''}><span>${esc(breed.name)}${breed.shiny ? '<b>Shiny</b>' : ''}</span>${breed.note ? `<small>${esc(breed.note)}</small>` : ''}</label>`;
      }).join('')}</div></article>`;
    }).join('');
    const stats = C.logStats(state, logFarm);
    $('log').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">Manor and Ranch</span><h2>Breeding log</h2><p>${stats.complete} of ${stats.total} breeds complete.</p></div><div class="score-ring" style="--score:${stats.percent}"><strong>${stats.percent}</strong><span>%</span></div></section>
      <section class="toolbar-card"><div class="segmented">${['All',...D.farms].map(v => `<button data-log-farm="${v}" class="${v===logFarm?'active':''}">${v==='All'?'All':esc(v.replace('Ranch Out of Time','Ranch'))}</button>`).join('')}</div><label class="search"><span>Search</span><input id="log-search" value="${esc(logSearch)}" placeholder="Species or breed"></label><label class="check-field"><input id="hide-complete" type="checkbox"${logHideComplete?' checked':''}><span>Hide completed</span></label></section>
      <div class="log-grid">${groups || '<div class="empty-state full"><strong>No matching breeds.</strong></div>'}</div>`;
    document.querySelectorAll('[data-log-farm]').forEach(button => button.addEventListener('click', () => { logFarm = button.dataset.logFarm; renderLog(); }));
    $('log-search').addEventListener('input', e => { logSearch = e.target.value; scheduleSearchRender('log-search', renderLog); });
    $('hide-complete').addEventListener('change', e => { logHideComplete = e.target.checked; renderLog(); });
    document.querySelectorAll('[data-log-key]').forEach(box => box.addEventListener('change', () => {
      state.breedingLog[box.dataset.logKey] = box.checked;
      const [species,breed] = box.dataset.logKey.split('::');
      commit(`${box.checked ? 'Completed' : 'Reopened'} breeding log entry: ${species} — ${breed}.`);
    }));
  }

  function renderBuyers() {
    const cards = state.buyers.map(buyer => {
      const speciesChoices = D.species.filter(name => { const info = speciesInfo(name); return info.farm === buyer.farm && info.size === buyer.size; });
      const info = speciesInfo(buyer.species);
      const candidates = state.animals.filter(animal => animal.species === buyer.species && !animal.protected).map(animal => ({ animal, estimate: C.beanEstimate(animal,buyer) })).sort((a,b) => b.estimate.estimate - a.estimate.estimate);
      return `<article class="buyer-card"><div class="section-heading"><div><span class="eyebrow">${esc(buyer.farm)} · ${esc(buyer.size)}</span><h2>${esc(info?.buyer || 'Buyer contract')}</h2></div><strong>${buyer.remaining} left</strong></div>
        <div class="form-grid two">
          <label class="field"><span>Species</span><select data-buyer-id="${buyer.id}" data-buyer-field="species"><option value="">Not set</option>${speciesChoices.map(v => opt(v,v,buyer.species)).join('')}</select></label>
          <label class="field"><span>Desired breed</span><select data-buyer-id="${buyer.id}" data-buyer-field="desiredBreed"><option value="">Any / unknown</option>${(info?.breeds || []).map(b => opt(b.name,b.name,buyer.desiredBreed)).join('')}</select></label>
          <label class="field"><span>Desired trait</span><select data-buyer-id="${buyer.id}" data-buyer-field="desiredTrait"><option value="">Any / unknown</option>${D.traits.map(t => opt(t.name,t.name,buyer.desiredTrait)).join('')}</select></label>
          <label class="field"><span>Remaining quantity</span><input type="number" min="0" data-buyer-id="${buyer.id}" data-buyer-field="remaining" value="${buyer.remaining}"></label>
          <label class="field"><span>Preference bonus %</span><input type="number" data-buyer-id="${buyer.id}" data-buyer-field="preferenceBonus" value="${buyer.preferenceBonus}"></label>
          <label class="field"><span>Outfit/other bonus %</span><input type="number" data-buyer-id="${buyer.id}" data-buyer-field="outfitBonus" value="${buyer.outfitBonus}"></label>
          <label class="field"><span>Next reset</span><input type="datetime-local" data-buyer-id="${buyer.id}" data-buyer-field="nextResetAt" value="${esc(localDateTime(buyer.nextResetAt))}"></label>
        </div>
        <div class="candidate-list">${buyer.species ? (candidates.length ? candidates.map(({animal,estimate}) => `<div><span><strong>${esc(animal.name)}</strong><small>${esc(animal.stage)} · base ${estimate.base} · traits ${estimate.traitBonus >= 0 ? '+' : ''}${estimate.traitBonus}%</small></span><b>${estimate.estimate} beans</b><button class="secondary compact" data-sell-animal="${animal.id}" data-buyer="${buyer.id}">Record sale</button></div>`).join('') : '<p class="muted-copy">No unprotected matching animals are saved.</p>') : '<p class="muted-copy">Select the requested species to rank sale candidates.</p>'}</div>
      </article>`;
    }).join('');
    $('buyers').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">Bean planner</span><h2>Buyers and sale estimates</h2><p>Adolescent base values and bean-affecting traits are calculated locally. Enter the current preference or outfit bonus when applicable.</p></div></section><div class="buyer-grid">${cards}</div>`;
    document.querySelectorAll('[data-buyer-field]').forEach(input => input.addEventListener('change', () => {
      const buyer = state.buyers.find(b => b.id === input.dataset.buyerId);
      const field = input.dataset.buyerField;
      buyer[field] = input.type === 'number' ? num(input.value) : field === 'nextResetAt' ? toIso(input.value) : input.value;
      if (field === 'species') { buyer.desiredBreed = ''; buyer.desiredTrait = ''; }
      commit('', 'info');
    }));
    document.querySelectorAll('[data-sell-animal]').forEach(button => button.addEventListener('click', () => {
      const animal = state.animals.find(a => a.id === button.dataset.sellAnimal);
      const buyer = state.buyers.find(b => b.id === button.dataset.buyer);
      const estimate = C.beanEstimate(animal,buyer).estimate;
      if (!confirm(`Record ${animal.name} sold for about ${estimate} beans and remove it from the library?`)) return;
      state.animals = state.animals.filter(a => a.id !== animal.id);
      buyer.remaining = Math.max(0, num(buyer.remaining) - 1);
      commit(`Sold ${animal.name} to ${speciesInfo(animal.species).buyer} for approximately ${estimate} beans.`, 'sale');
    }));
  }

  function renderTimers() {
    const timers = C.upcomingTimers(state);
    $('timers').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">Growth and reminders</span><h2>Timer centre</h2><p>Animal timers use the recorded stage start, species growth duration, and Old/Young at Heart traits.</p></div><button id="request-notifications" class="secondary">Enable notifications</button></section>
      <form id="timer-form" class="toolbar-card"><label class="field"><span>Reminder label</span><input id="timer-label" required placeholder="Farm run, trapper, buyer reset…"></label><label class="field"><span>Due</span><input id="timer-due" type="datetime-local" required></label><button class="primary align-end">Add reminder</button></form>
      <div class="timer-list">${timers.length ? timers.map(timer => `<article class="timer-row ${timer.remainingMinutes <= 0 ? 'due' : ''}"><div><span class="eyebrow">${timer.type === 'growth' ? 'Animal growth' : 'Reminder'}</span><h3>${esc(timer.label)}</h3><p>${esc(formatTime(timer.dueAt))}</p></div><strong>${timer.remainingMinutes <= 0 ? 'Due now' : C.formatDuration(timer.remainingMinutes)}</strong><div class="card-actions">${timer.type === 'growth' ? `<button class="primary compact" data-advance-animal="${timer.animalId}">Advance stage</button>` : `<button class="ghost danger compact" data-delete-timer="${timer.id}">Delete</button>`}</div></article>`).join('') : '<div class="empty-state full"><strong>No active timers.</strong><p>Set a stage start on an animal or add a custom reminder.</p></div>'}</div>`;
    $('timer-form').addEventListener('submit', event => {
      event.preventDefault();
      const timer = { id: C.uid('timer'), type: 'custom', label: $('timer-label').value.trim(), dueAt: toIso($('timer-due').value) };
      state.timers.push(timer);
      commit(`Added timer: ${timer.label}.`);
    });
    $('request-notifications').addEventListener('click', async () => {
      if (!('Notification' in window)) return toast('Notifications are not supported in this browser.');
      const permission = await Notification.requestPermission();
      toast(permission === 'granted' ? 'Notifications enabled.' : 'Notification permission was not granted.');
    });
    document.querySelectorAll('[data-advance-animal]').forEach(button => button.addEventListener('click', () => {
      const animal = state.animals.find(a => a.id === button.dataset.advanceAnimal);
      const next = C.nextStage(animal);
      if (!next) return;
      animal.stage = next;
      animal.lastStageAt = next === 'Elder' ? '' : C.nowIso();
      commit(`${animal.name} advanced to ${next}.`, 'growth');
    }));
    document.querySelectorAll('[data-delete-timer]').forEach(button => button.addEventListener('click', () => {
      state.timers = state.timers.filter(t => t.id !== button.dataset.deleteTimer);
      commit('Deleted a custom timer.');
    }));
  }

  function renderReference() {
    const speciesCards = Object.values(D.speciesData).filter(info => referenceSpecies === 'All' || info.farm === referenceSpecies).filter(info => `${info.name} ${info.foods.join(' ')} ${info.breeds.map(b=>b.name).join(' ')}`.toLowerCase().includes(referenceSearch.toLowerCase())).map(info => `<article class="reference-card"><header><div><span class="eyebrow">${esc(info.farm)} · ${esc(info.size)} · Level ${info.level}</span><h3>${esc(info.name)}</h3></div><span>${info.breeds.length} breeds</span></header><p><strong>Food:</strong> ${esc(info.foods.join(', '))}</p><p><strong>To elder:</strong> ${esc(C.formatDuration(info.stages.reduce((a,b)=>a+b,0)))}</p><p><strong>Buyer:</strong> ${esc(info.buyer)} · <strong>Totem:</strong> ${esc(info.perk || '—')}</p><div class="chips">${info.breeds.map(b => `<span>${esc(b.name)}${b.shiny?' ★':''}</span>`).join('')}</div></article>`).join('');
    const traitCards = D.traits.filter(trait => `${trait.name} ${trait.description} ${(trait.species||[]).join(' ')}`.toLowerCase().includes(referenceSearch.toLowerCase())).map(trait => `<article class="trait-row ${trait.negative?'negative':''}"><div><strong>${esc(trait.name)}</strong><span>Slots ${trait.slots.join(', ')}</span></div><p>${esc(trait.description)}</p><footer>${trait.species ? esc(trait.species.join(', ')) : 'All species'}</footer></article>`).join('');
    $('reference').innerHTML = `<section class="toolbar-card"><label class="search grow"><span>Search reference</span><input id="reference-search" value="${esc(referenceSearch)}" placeholder="Species, breed, food, trait…"></label><div class="segmented">${['All',...D.farms].map(v=>`<button data-reference-farm="${v}" class="${v===referenceSpecies?'active':''}">${v==='All'?'All':esc(v.replace('Ranch Out of Time','Ranch'))}</button>`).join('')}</div></section><section class="section-heading"><div><span class="eyebrow">Animals</span><h2>Species reference</h2></div></section><div class="reference-grid">${speciesCards || '<p class="muted-copy">No matching species.</p>'}</div><section class="section-heading"><div><span class="eyebrow">Traits</span><h2>Trait guide</h2></div></section><div class="trait-list">${traitCards || '<p class="muted-copy">No matching traits.</p>'}</div>`;
    $('reference-search').addEventListener('input', e => { referenceSearch = e.target.value; scheduleSearchRender('reference-search', renderReference); });
    document.querySelectorAll('[data-reference-farm]').forEach(button => button.addEventListener('click', () => { referenceSpecies = button.dataset.referenceFarm; renderReference(); }));
  }

  function scannedAnimal(parsed) {
    return C.normaliseAnimal({
      name: parsed.name || parsed.breed || parsed.species,
      species: parsed.species,
      breed: parsed.breed,
      gender: parsed.gender,
      stage: parsed.stage,
      health: parsed.health ?? 100,
      happiness: parsed.happiness ?? 100,
      traits: parsed.traits,
      diseased: parsed.diseased,
      lastStageAt: parsed.stage && parsed.stage !== 'Elder' ? C.nowIso() : ''
    });
  }

  function importScannedAnimal(parsed) {
    if (!parsed?.species) return null;
    const incoming = scannedAnimal(parsed);
    const key = String(incoming.name || '').trim().toLowerCase();
    const existing = key && state.animals.find(animal => animal.species === incoming.species && String(animal.name || '').trim().toLowerCase() === key);
    if (existing) {
      const preserved = { id: existing.id, protected: existing.protected, penId: existing.penId, notes: existing.notes, createdAt: existing.createdAt };
      Object.assign(existing, incoming, preserved, { updatedAt: C.nowIso() });
      return { animal: existing, updated: true };
    }
    state.animals.push(incoming);
    return { animal: incoming, updated: false };
  }

  function correctionKey(field, value) {
    return `${field}|${String(value || '').trim().toLowerCase()}`;
  }

  function applyScannerCorrections(result) {
    if (!result?.parsed) return result;
    const corrections = state.settings.scannerCorrections || {};
    const parsed = { ...result.parsed, traits: [...(result.parsed.traits || [])] };
    const raw = result.fields || {};
    const apply = (field, current) => corrections[correctionKey(field, raw[field] || current)] ?? current;
    parsed.name = apply('name', parsed.name);
    parsed.stage = apply('stage', parsed.stage);
    parsed.breed = apply('breed', parsed.breed);
    parsed.gender = apply('gender', parsed.gender);
    parsed.health = Number(apply('health', parsed.health));
    parsed.happiness = Number(apply('happiness', parsed.happiness));
    parsed.traits = [0, 1, 2].map(i => apply(`trait${i + 1}`, parsed.traits[i] || 'No Trait')).map(v => v === 'No Trait' ? '' : v);
    return { ...result, parsed };
  }

  function scannerFieldConfidence(field) {
    const value = scannerScan?.diagnostics?.[field]?.confidence;
    return Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : null;
  }

  function scannerDraftFromResult() {
    const p = scannerScan?.parsed || scannerResult || {};
    return {
      name: p.name || '', species: p.species || '', breed: p.breed || '', gender: p.gender || 'Unknown',
      stage: p.stage || '', health: p.health ?? 100, happiness: p.happiness ?? 100,
      traits: [...(p.traits || []), '', '', ''].slice(0, 3)
    };
  }

  function saveConfirmedScannerDraft(draft) {
    const original = scannerScan?.fields || {};
    state.settings.scannerCorrections ||= {};
    const remember = (field, corrected, fallback) => {
      const raw = original[field] || fallback;
      if (raw !== undefined && raw !== null && String(raw).trim()) state.settings.scannerCorrections[correctionKey(field, raw)] = corrected;
    };
    remember('name', draft.name, scannerScan?.parsed?.name);
    remember('stage', draft.stage, scannerScan?.parsed?.stage);
    remember('breed', draft.breed, scannerScan?.parsed?.breed);
    remember('gender', draft.gender, scannerScan?.parsed?.gender);
    remember('health', draft.health, scannerScan?.parsed?.health);
    remember('happiness', draft.happiness, scannerScan?.parsed?.happiness);
    draft.traits.forEach((trait, i) => remember(`trait${i + 1}`, trait || 'No Trait', scannerScan?.parsed?.traits?.[i] || 'No Trait'));
    const info = speciesInfo(draft.species);
    if (!info || !info.breeds.some(b => b.name === draft.breed)) return toast('Choose a valid species and breed before saving.');
    const imported = importScannedAnimal(draft);
    state.scannerText = window.POF_SCANNER.buildInspectionText({
      name: draft.name, stage: draft.stage, breed: `${draft.breed} (${draft.gender.toLowerCase()})`,
      health: `${draft.health}%`, happiness: `${draft.happiness}%`, trait1: draft.traits[0] || 'No Trait', trait2: draft.traits[1] || 'No Trait', trait3: draft.traits[2] || 'No Trait'
    });
    commit(`${imported.updated ? 'Updated' : 'Imported'} ${imported.animal.name}; confirmed scanner corrections were learned.`, 'scan');
  }

  function exportScannerDebug() {
    if (!scannerScan) return toast('Run a scan before exporting diagnostics.');
    const payload = {
      appVersion: '2.4.3', timestamp: new Date().toISOString(), layout: scannerScan.layout,
      origin: scannerScan.origin, fields: scannerScan.fields, parsed: scannerScan.parsed,
      diagnostics: scannerScan.diagnostics, rawText: scannerScan.rawText,
      scalePercent: state.settings.scannerScalePercent || 100
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `pof-scanner-debug-${Date.now()}.json`; link.click(); URL.revokeObjectURL(link.href);
    toast('Scanner diagnostics exported.');
  }

  function scannerFingerprint(result) {
    const parsed = result?.parsed;
    if (!parsed) return '';
    return [parsed.name, parsed.species, parsed.breed, parsed.gender, parsed.stage, parsed.health, parsed.happiness, ...(parsed.traits || [])].join('|').toLowerCase();
  }

  function executeAnimalInfoScan({ save = false, quiet = false } = {}) {
    if (scannerBusy) return null;
    scannerBusy = true;
    try {
      const result = applyScannerCorrections(window.POF_SCANNER.scanAnimalInfo());
      scannerScan = result;
      if (result.rawText) {
        state.scannerText = result.rawText;
        scannerResult = result.parsed;
        lastScannerFingerprint = scannerFingerprint(result);
      }
      if (save && result.ok && result.parsed?.species) {
        const imported = importScannedAnimal(result.parsed);
        C.logEvent(state, `${imported.updated ? 'Updated' : 'Imported'} ${imported.animal.name} from the open Animal Info window.`, 'scan');
      }
      saveState();
      if (state.activeTab === 'scanner') renderScanner();
      if (!quiet) {
        if (save && result.ok && result.parsed?.species) toast(`${result.parsed.name || result.parsed.breed || result.parsed.species} scanned and saved.`);
        else if (save && !result.ok) toast(result.error || 'The scan was incomplete and was not saved.');
        else if (result.ok) toast('Animal Info scanned successfully.');
        else if (result.partial) toast('Animal Info found, but some fields need correction.');
        else toast(result.error || 'Animal Info scan failed.');
      }
      return result;
    } catch (error) {
      scannerScan = { ok: false, error: error?.message || 'Unexpected scanner error.' };
      if (state.activeTab === 'scanner') renderScanner();
      if (!quiet) toast(scannerScan.error);
      return scannerScan;
    } finally {
      scannerBusy = false;
    }
  }

  function syncScannerAutoScan() {
    if (scannerAutoTimer) clearInterval(scannerAutoTimer);
    scannerAutoTimer = null;
    if (!state.settings.scannerAutoScan) return;
    scannerAutoTimer = setInterval(() => {
      if (state.activeTab !== 'scanner' || scannerBusy) return;
      try {
        const previous = lastScannerFingerprint;
        const result = applyScannerCorrections(window.POF_SCANNER.scanAnimalInfo());
        const next = scannerFingerprint(result);
        if (!result.rawText || !next || next === previous) return;
        scannerScan = result;
        state.scannerText = result.rawText;
        scannerResult = result.parsed;
        lastScannerFingerprint = next;
        saveState();
        renderScanner();
      } catch (_) { /* wait for the next scan interval */ }
    }, 2000);
  }

  function renderScanner() {
    if (!scannerScan) scannerResult = window.POF_SCANNER.parseInspectionText(state.scannerText || '');
    const status = window.POF_SCANNER.alt1Status();
    const draft = scannerDraftFromResult();
    const info = speciesInfo(draft.species);
    const breeds = info?.breeds?.map(b => b.name) || [];
    const validTraits = D.traits.map(t => t.name);
    const scannedForRating = C.normaliseAnimal({ ...draft, id: '__scanner_preview__' });
    const scanRating = draft.species && draft.breed ? C.rateAnimal(state, scannedForRating, state.settings.animalValueGoal || 'Balanced') : null;
    const scanAdvice = C.actionableAnimalRecommendation(scanRating);
    const recommendationTone = scanAdvice.label.startsWith('Keep') ? 'keep' : scanAdvice.label.includes('sell') || scanAdvice.label.includes('Sell') ? 'sell' : 'situational';
    const recommendationHtml = scanRating ? `<section id="scan-animal-recommendation" class="scan-recommendation ${recommendationTone}"><span class="eyebrow">Recommended action</span><h3>${esc(scanAdvice.label)}</h3><p>${esc(scanAdvice.detail)}</p><div class="scan-score-row"><span>Keep ${scanRating.keepScore}/100</span><span>Sell ${scanRating.sellScore}/100</span><span>Grade ${scanRating.grade}</span></div></section>` : `<section id="scan-animal-recommendation" class="scan-recommendation situational"><span class="eyebrow">Recommended action</span><h3>Complete the scan</h3><p>A valid species and breed are required before the keep-or-sell recommendation can be calculated.</p></section>`;
    const conf = field => { const n = scannerFieldConfidence(field); return n === null ? '<span class="confidence unknown">Manual</span>' : `<span class="confidence ${n >= 80 ? 'high' : n >= 60 ? 'medium' : 'low'}">${n}%</span>`; };
    const scanState = scannerScan
      ? `<div class="scan-status ${scannerScan.ok ? 'good' : scannerScan.partial ? 'warn' : 'bad'}"><strong>${scannerScan.ok ? 'Scan complete—review before saving' : scannerScan.partial ? 'Partial scan—correct highlighted fields' : 'Scan not completed'}</strong><span>${esc(scannerScan.error || `Panel at ${scannerScan.origin?.x ?? '—'}, ${scannerScan.origin?.y ?? '—'}`)}</span></div>`
      : `<div class="scan-status"><strong>Ready to scan</strong><span>Open Check Animals → Animal Info, then scan.</span></div>`;
    const availability = !status.detected ? 'Open this app inside Alt1.' : !status.permissionPixel ? 'Enable Screen pixels permission.' : !status.rsLinked ? 'Link Alt1 to RuneScape.' : `Capture ready at ${status.rsWidth}×${status.rsHeight}.`;

    $('scanner').innerHTML = `
      <section class="hero-card compact-hero"><div><span class="eyebrow">Self-correcting reader</span><h2>Scan Animal</h2><p>${availability} Every scan is previewed; confirmed corrections are remembered locally.</p></div></section>
      <section class="panel-card automatic-scanner">
        <div class="section-heading"><div><span class="eyebrow">Automatic import</span><h2>Scan and review</h2></div><span class="status-pill ${status.permissionPixel && status.rsLinked ? 'good' : 'warn'}">${status.permissionPixel && status.rsLinked ? 'Capture ready' : 'Unavailable'}</span></div>
        ${scanState}
        <div class="form-actions"><button id="scan-animal-info" class="primary"${status.permissionPixel && status.rsLinked ? '' : ' disabled'}>Scan open Animal Info</button><button id="export-scan-debug" class="secondary"${scannerScan ? '' : ' disabled'}>Export failed-scan diagnostics</button></div>
        <label class="check-field"><input id="scanner-auto-scan" type="checkbox"${state.settings.scannerAutoScan ? ' checked' : ''}><span>Auto-scan every 2 seconds</span></label>
      </section>
      <section class="editor-card scanner-review">
        <div class="section-heading"><div><span class="eyebrow">Editable confirmation</span><h2>Review every field</h2></div><span class="status-pill">${Object.keys(state.settings.scannerCorrections || {}).length} learned corrections</span></div>
        <div class="form-grid two">
          <label class="field"><span>Name ${conf('name')}</span><input id="scan-edit-name" value="${esc(draft.name)}" placeholder="Animal name"></label>
          <label class="field"><span>Stage ${conf('stage')}</span><select id="scan-edit-stage">${D.stages.map(v => opt(v, v, draft.stage)).join('')}</select></label>
          <label class="field"><span>Species</span><select id="scan-edit-species"><option value="">Select species</option>${Object.keys(D.speciesData).map(v => opt(v, v, draft.species)).join('')}</select></label>
          <label class="field"><span>Breed ${conf('breed')}</span><select id="scan-edit-breed">${breeds.map(v => opt(v, v, draft.breed)).join('')}</select></label>
          <label class="field"><span>Gender ${conf('breed')}</span><select id="scan-edit-gender">${['Female','Male','Unknown'].map(v => opt(v,v,draft.gender)).join('')}</select></label>
          <label class="field"><span>Health ${conf('health')}</span><input id="scan-edit-health" type="number" min="0" max="100" value="${draft.health}"></label>
          <label class="field"><span>Happiness ${conf('happiness')}</span><input id="scan-edit-happiness" type="number" min="0" max="100" value="${draft.happiness}"></label>
          ${[0,1,2].map(i => `<label class="field"><span>Trait ${i+1} ${conf(`trait${i+1}`)}</span><select id="scan-edit-trait-${i}"><option value="">No Trait</option>${validTraits.map(v => opt(v,v,draft.traits[i])).join('')}</select></label>`).join('')}
        </div>
        ${recommendationHtml}
        <div class="form-actions"><button id="confirm-scan-animal" class="primary">Confirm, learn, and save</button><button id="clear-learned-scanner" class="ghost">Clear learned corrections</button></div>
        <p class="helper-copy">Low-confidence fields are not trusted silently. Correct them here; the scanner remembers the exact misread-to-correct mapping in local storage for later scans.</p>
      </section>
      <details class="panel-card"><summary>Manual text fallback</summary><label class="field"><span>Inspection text</span><textarea id="scanner-text" rows="10">${esc(state.scannerText || '')}</textarea></label><div class="form-actions"><button id="paste-inspection-text" class="secondary">Paste clipboard</button><button id="clear-inspection-text" class="ghost">Clear</button></div></details>`;

    const updateScanRecommendation = () => {
      const species = $('scan-edit-species').value;
      const breed = $('scan-edit-breed').value;
      const animal = C.normaliseAnimal({
        id: '__scanner_preview__', name: $('scan-edit-name').value.trim(), species, breed,
        gender: $('scan-edit-gender').value, stage: $('scan-edit-stage').value,
        health: Math.max(0,Math.min(100,num($('scan-edit-health').value))),
        happiness: Math.max(0,Math.min(100,num($('scan-edit-happiness').value))),
        traits: [0,1,2].map(i => $(`scan-edit-trait-${i}`).value)
      });
      const box = $('scan-animal-recommendation');
      if (!box || !species || !breed) return;
      const rating = C.rateAnimal(state, animal, state.settings.animalValueGoal || 'Balanced');
      const advice = C.actionableAnimalRecommendation(rating);
      const tone = advice.label.startsWith('Keep') ? 'keep' : /sell/i.test(advice.label) ? 'sell' : 'situational';
      box.className = `scan-recommendation ${tone}`;
      box.innerHTML = `<span class="eyebrow">Recommended action</span><h3>${esc(advice.label)}</h3><p>${esc(advice.detail)}</p><div class="scan-score-row"><span>Keep ${rating.keepScore}/100</span><span>Sell ${rating.sellScore}/100</span><span>Grade ${rating.grade}</span></div>`;
    };

    $('scan-animal-info').addEventListener('click', () => executeAnimalInfoScan());
    $('export-scan-debug').addEventListener('click', exportScannerDebug);
    $('scanner-auto-scan').addEventListener('change', e => { state.settings.scannerAutoScan = e.target.checked; saveState(); syncScannerAutoScan(); });
    $('scan-edit-species').addEventListener('change', e => {
      const selected = e.target.value; const list = speciesInfo(selected)?.breeds || [];
      $('scan-edit-breed').innerHTML = list.map((b,i) => opt(b.name,b.name,i===0 ? b.name : '')).join('');
      updateScanRecommendation();
    });
    ['scan-edit-name','scan-edit-stage','scan-edit-breed','scan-edit-gender','scan-edit-health','scan-edit-happiness','scan-edit-trait-0','scan-edit-trait-1','scan-edit-trait-2'].forEach(id => {
      $(id).addEventListener('input', updateScanRecommendation);
      $(id).addEventListener('change', updateScanRecommendation);
    });
    $('confirm-scan-animal').addEventListener('click', () => {
      const draft = {
        name: $('scan-edit-name').value.trim(), species: $('scan-edit-species').value, breed: $('scan-edit-breed').value,
        gender: $('scan-edit-gender').value, stage: $('scan-edit-stage').value,
        health: Math.max(0,Math.min(100,num($('scan-edit-health').value))), happiness: Math.max(0,Math.min(100,num($('scan-edit-happiness').value))),
        traits: [0,1,2].map(i => $(`scan-edit-trait-${i}`).value)
      };
      if (draft.name.length < 2) return toast('Enter a valid animal name.');
      saveConfirmedScannerDraft(draft);
    });
    $('clear-learned-scanner').addEventListener('click', () => { state.settings.scannerCorrections = {}; saveState(); renderScanner(); toast('Learned scanner corrections cleared.'); });
    $('scanner-text').addEventListener('input', e => { state.scannerText = e.target.value; scannerResult = window.POF_SCANNER.parseInspectionText(e.target.value); saveState(); });
    $('paste-inspection-text').addEventListener('click', async () => { try { state.scannerText = await navigator.clipboard.readText(); scannerScan = null; saveState(); renderScanner(); } catch (_) { toast('Clipboard access was blocked.'); } });
    $('clear-inspection-text').addEventListener('click', () => { state.scannerText=''; scannerScan=null; scannerResult=null; saveState(); renderScanner(); });
  }


  function renderCredits() {
    $('credits').innerHTML = `
      <section class="hero-card compact-hero">
        <div>
          <span class="eyebrow">Credits</span>
          <h2>POF AIO</h2>
          <p>Created and maintained for the RuneScape Alt1 community.</p>
        </div>
      </section>
      <section class="panel-card credit-card">
        <h3>Created by</h3>
        <p class="credit-name">Truly Bored Adventure</p>
        <p><strong>RSN:</strong> Truly Bored</p>
      </section>`;
  }

  function renderSettings() {
    const dataSize = new Blob([JSON.stringify(state)]).size;
    $('settings').innerHTML = `<section class="hero-card compact-hero"><div><span class="eyebrow">POF AIO 2.6.1</span><h2>Settings and data</h2><p>All records are stored locally in the Alt1 browser or normal browser profile.</p></div></section>
      <div class="settings-grid"><section class="panel-card"><h3>Alt1 installation</h3><label class="field"><span>Install address</span><input id="install-address" readonly value="${esc(INSTALL_URL)}"></label><button id="copy-install" class="secondary">Copy address</button></section>
      <section class="panel-card"><h3>Notifications</h3><label class="field"><span>Lead time in minutes</span><input id="notification-lead" type="number" min="0" value="${state.settings.notificationLeadMinutes}"></label><label class="check-field"><input id="sound-setting" type="checkbox"${state.settings.sound?' checked':''}><span>Play a short sound for due timers</span></label></section>
      <section class="panel-card"><h3>Backup</h3><p>${state.animals.length} animals · ${state.history.length} history entries · ${(dataSize/1024).toFixed(1)} KB</p><div class="form-actions"><button id="export-data" class="primary">Export JSON</button><label class="file-button secondary">Import JSON<input id="import-data" type="file" accept="application/json"></label></div></section>
      <section class="panel-card danger-zone"><h3>Reset</h3><p>Resetting removes local animals, pens, logs, timers, buyers, and settings.</p><button id="reset-all" type="button" class="danger-button">Reset all local data</button><div id="reset-confirm-host"></div></section></div>`;
    $('copy-install').addEventListener('click', async () => { await navigator.clipboard.writeText(INSTALL_URL); toast('Install address copied.'); });
    $('notification-lead').addEventListener('change', e => { state.settings.notificationLeadMinutes = Math.max(0,num(e.target.value)); commit('', 'info', false); });
    $('sound-setting').addEventListener('change', e => { state.settings.sound = e.target.checked; commit('', 'info', false); });
    $('export-data').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state,null,2)], { type:'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pof-aio-backup-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast('Backup exported.');
    });
    $('import-data').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try { state = C.migrate(JSON.parse(await file.text())); commit('Imported a POF AIO backup.'); }
      catch (_) { toast('That file is not a valid POF AIO backup.'); }
    });
    $('reset-all').addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const host = $('reset-confirm-host');
      if (host.firstElementChild) { host.innerHTML = ''; return; }
      host.innerHTML = `<div class="inline-confirm"><strong>Erase all local POF AIO data?</strong><span>Animals, pens, logs, buyers, timers, scanner learning, and settings will be removed. This cannot be undone.</span><div class="form-actions"><button type="button" id="confirm-reset-all" class="danger-button">Yes, erase everything</button><button type="button" id="cancel-reset-all" class="ghost">Cancel</button></div></div>`;
      $('cancel-reset-all').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); host.innerHTML = ''; });
      $('confirm-reset-all').addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY);
        state = C.defaultState();
        scannerResult = null;
        scannerScan = null;
        lastScannerFingerprint = '';
        resetAnimalDraft();
        saveState();
        setTab('dashboard');
        toast('All POF AIO local data was reset.');
      });
    });
  }

  function useAnimalAsParent(animalId, index) {
    const animal = state.animals.find(a => a.id === animalId);
    if (!animal) return;
    state.parents[index] = { name: animal.name, species: animal.species, breed: animal.breed, gender: animal.gender, traits: [...animal.traits] };
    commit(`Loaded ${animal.name} as Parent ${index ? 'B' : 'A'}.`);
    setTab('breeding');
  }

  function playAlert() {
    if (!state.settings.sound) return;
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0.06;
      oscillator.connect(gain).connect(context.destination);
      oscillator.frequency.value = 660;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    } catch (_) { /* ignored */ }
  }

  function timerTick() {
    const lead = num(state.settings.notificationLeadMinutes);
    C.upcomingTimers(state).forEach(timer => {
      if (timer.remainingMinutes <= lead && timer.remainingMinutes > -60 && !notified.has(timer.id)) {
        notified.add(timer.id);
        if ('Notification' in window && Notification.permission === 'granted') new Notification('POF AIO', { body: timer.remainingMinutes <= 0 ? `${timer.label} is due.` : `${timer.label} is due in ${C.formatDuration(timer.remainingMinutes)}.` });
        playAlert();
      }
    });
    if (['dashboard','timers'].includes(state.activeTab)) renderActive();
  }

  document.addEventListener('click', event => {
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) setTab(tabButton.dataset.tab);
    const go = event.target.closest('[data-go-tab]');
    if (go) setTab(go.dataset.goTab);
    const parent = event.target.closest('[data-use-parent]');
    if (parent) useAnimalAsParent(parent.dataset.animalId, num(parent.dataset.useParent));
  });

  $('reset-button').addEventListener('click', () => setTab('settings'));
  $('add-app').href = INSTALL_URL;
  if (window.alt1?.identifyAppUrl) window.alt1.identifyAppUrl('./appconfig.json');
  syncScannerAutoScan();
  setTab(state.activeTab || 'dashboard');
  setInterval(timerTick, 30000);
  timerTick();
})();

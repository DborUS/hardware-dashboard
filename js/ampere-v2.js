// Ampere Computing product-first renderer. All specifications and source URLs
// come from ampere-data.json; this file owns presentation and interactions.

const P2_TONES = ['#fe4943'];
const P2_CORE_ID = 'p2core';
const P2_TAB = 'processors';

let p2Data = null;
let p2Families = [];
let p2Search = '';
let p2Core = null;
const p2Active = { series: new Set(), memType: new Set() };
const p2Expanded = new Set();

const p2Slug = value => String(value || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function p2Number(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== null && value !== '' ? number : null;
}

/** Families and models are both sorted from the source data, with core count
 * as the principal within-family ordering criterion. */
function p2BuildFamilies() {
  const groups = new Map();
  (p2Data?.processors || []).forEach(record => {
    if (!record?.series) return;
    if (!groups.has(record.series)) groups.set(record.series, []);
    groups.get(record.series).push(record);
  });
  p2Families = [...groups].map(([name, records]) => {
    records.sort((a, b) =>
      (p2Number(b.cores) ?? -1) - (p2Number(a.cores) ?? -1) ||
      (p2Number(b.frequency) ?? -1) - (p2Number(a.frequency) ?? -1) ||
      String(a.n || '').localeCompare(String(b.n || '')));
    return {
      name,
      id: p2Slug(name),
      year: Math.max(...records.map(row => p2Number(row.year) ?? 0)),
      records
    };
  }).sort((a, b) => b.year - a.year ||
    (p2Number(b.records[0]?.cores) ?? 0) - (p2Number(a.records[0]?.cores) ?? 0));
}

function p2BuildCoreRange() {
  const stops = [...new Set((p2Data?.processors || [])
    .map(row => p2Number(row.cores)).filter(value => value !== null))]
    .sort((a, b) => a - b);
  p2Core = stops.length >= 2 ? coreRangeInit(stops) : null;
}

function p2FilterGroups() {
  const families = p2Families.map((family, index) =>
    [family.name, P2_TONES[index % P2_TONES.length]]);
  const memory = [...new Set((p2Data?.processors || [])
    .map(row => row.memType).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((type, index) => [type, P2_TONES[index % P2_TONES.length]]);
  return [
    { label: 'Family', key: 'series', tags: families },
    { label: 'Memory', key: 'memType', tags: memory }
  ].filter(group => group.tags.length);
}

function p2BuildFilters() {
  const bar = dom.filterControls;
  bar.className = 'controls filter-bar';
  bar.innerHTML = coreRangeHtml(P2_CORE_ID, p2Core) + p2FilterGroups().map(group => `
    <div class="fgroup" role="group" aria-label="Filter by ${group.label.toLowerCase()}">
      <span class="fgroup-label">${escHtml(group.label)}</span>
      <div class="${group.tags.length > 10 ? 'fgroup-scroll' : ''}">
        ${group.tags.map(([tag, color]) => `
          <button type="button" class="fchip" data-key="${group.key}" data-tag="${escHtml(tag)}"
                  style="--tag-color:${color}" aria-pressed="false">
            <span class="fchip-dot" style="background:${color}"></span>
            <span class="fchip-label">${escHtml(tag)}</span>
            <span class="fchip-n" aria-hidden="true"></span>
          </button>`).join('')}
      </div>
    </div>`).join('') +
    '<button type="button" class="fclear" id="p2Clear" hidden>Clear filters</button>';

  bar.querySelectorAll('.fchip').forEach(chip => chip.addEventListener('click', () => {
    const selected = p2Active[chip.dataset.key];
    selected.has(chip.dataset.tag)
      ? selected.delete(chip.dataset.tag) : selected.add(chip.dataset.tag);
    p2ApplyFilters();
  }));
  coreRangeWire(P2_CORE_ID, p2Core, p2ApplyFilters);
  bar.querySelector('#p2Clear')?.addEventListener('click', () => {
    Object.values(p2Active).forEach(set => set.clear());
    if (p2Core) { p2Core.lo = 0; p2Core.hi = p2Core.stops.length - 1; }
    coreRangePaint(P2_CORE_ID, p2Core);
    p2ApplyFilters();
  });
}

function p2DisplayValue(record, field) {
  const value = record[field];
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'frequency') {
    const qualifier = record.frequencyType === 'Sustained' ? ' (sustained)' :
      record.frequencyType === 'Up to with Turbo' ? ' (up to with Turbo)' : '';
    return `${value} GHz${qualifier}`;
  }
  if (field === 'usagePower' || field === 'tdp') return `${value} W`;
  return String(value);
}

/** Keep the column count within the existing card-width budget. The legacy
 * eMAG table has TDP and L3; newer families have Usage Power and SLC. */
function p2Columns(family) {
  const legacy = family.name === 'eMAG';
  const columns = [
    ['n', 'Model'], ['cores', 'Cores'], ['frequency', 'Frequency'],
    legacy ? ['tdp', 'TDP'] : ['usagePower', 'Usage Power'],
    ['l2', 'L2'], legacy ? ['l3', 'L3'] : ['slc', 'SLC'],
    ['memType', 'Memory Type'], ['memChannels', 'Memory Channels'],
    ['memMax', 'Max Memory'], ['pcie', 'PCIe'], ['lanes', 'PCIe Lanes'],
    ['partNumber', 'Part Number']
  ];
  return columns.filter(([field]) => field === 'n' || field === 'cores' ||
    family.records.some(record => record[field] !== null &&
      record[field] !== undefined && record[field] !== ''));
}

function p2TableRows(family, columns) {
  return family.records.map(record => {
    const search = Object.values(record).filter(value => value != null)
      .join(' ').toLowerCase();
    return `<tr data-search="${escHtml(search)}" data-core="${record.cores ?? ''}"
                data-mem-type="${escHtml(record.memType || '')}">
      ${columns.map(([field], index) =>
        index === 0
          ? `<td class="cpu-model-name"><button type="button" class="p2-model-select" aria-pressed="false" aria-label="Select ${escHtml(record.n)} for comparison">${escHtml(record.n)}</button></td>`
          : `<td>${escHtml(p2DisplayValue(record, field))}</td>`)
        .join('')}
    </tr>`;
  }).join('');
}

function p2SourceUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
      (parsed.hostname === 'amperecomputing.com' ||
       parsed.hostname.endsWith('.amperecomputing.com')) ? parsed.href : null;
  } catch (_) {
    return null;
  }
}

function p2Sources(records) {
  const urls = [...new Set(records.map(record => p2SourceUrl(record.source)).filter(Boolean))];
  if (!urls.length) return 'Source: Ampere Computing official product documentation';
  return 'Source: ' + urls.map((url, index) =>
    `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">` +
      `Ampere official product brief${urls.length > 1 ? ` ${index + 1}` : ''} ↗</a>`)
    .join(' · ');
}

function p2Card(family) {
  const id = `p2t-${family.id}`;
  const columns = p2Columns(family);
  const coreValues = family.records.map(record => p2Number(record.cores))
    .filter(value => value !== null);
  const coreMin = coreValues.length ? Math.min(...coreValues) : null;
  const coreMax = coreValues.length ? Math.max(...coreValues) : null;
  const coreText = coreMin === null ? '' :
    `${coreMin === coreMax ? coreMin : `${coreMin}–${coreMax}`} cores`;
  const memory = [...new Set(family.records.map(row => row.memType).filter(Boolean))];
  const arch = [...new Set(family.records.map(row => row.arch).filter(Boolean))];
  const process = [...new Set(family.records.map(row => row.process).filter(Boolean))];
  const notes = [...new Set(family.records.map(row => row.notes).filter(Boolean))];
  const description = [
    coreText, ...memory
  ].filter(Boolean).join(' · ');
  const label = family.records.length === 1
    ? family.records[0].n
    : `${family.records[0].n} + ${family.records.length - 1} more`;
  const shortLabel = family.records.length === 1
    ? label
    : family.records[0].n.split(/\s+/).at(-1);
  const metaSearch = [family.name, ...arch, ...memory, ...process].join(' ').toLowerCase();

  return `
    <div class="sku-card has-specs" style="--card-order:0"
         data-target="${id}" data-series="${escHtml(family.name)}"
         data-mem-type="${escHtml(memory.join('|'))}"
         data-meta-search="${escHtml(metaSearch)}" data-search="${escHtml(metaSearch)}"
         role="button" tabindex="0" aria-controls="${id}" aria-expanded="false">
      <div class="sku-spec-toggle">specs ▾</div>
      <div class="sku-name"><span class="p2-label-full">${escHtml(label)}</span><span class="p2-label-short">${escHtml(shortLabel)}</span></div>
      <div class="sku-desc">${escHtml(description)}</div>
      <div class="search-summary" hidden></div>
      <div class="sku-tags">${[...arch, ...process].map(tag =>
        `<span class="sku-tag">${escHtml(tag)}</span>`).join('')}</div>
    </div>
    <div class="cpu-spec-wrapper" id="${id}" style="--spec-order:1">
      <div class="cpu-spec-overflow">
        <div class="cpu-spec-header"><div>
          <span class="cpu-spec-header-title">${escHtml(family.name)}</span>
          <div class="identity-path">Ampere Computing › Processors › ${escHtml(family.name)}</div>
          <div class="source-line">${p2Sources(family.records)}</div>
          ${notes.map(note => `<div class="source-line p2-source-note">${escHtml(note)}</div>`).join('')}
        </div><span class="cpu-spec-header-title v2-await">${family.records.length} model${family.records.length === 1 ? '' : 's'}</span></div>
        <div class="p2-table-hint">Scroll for more specifications →</div>
        <table class="cpu-spec-table"><thead><tr>
          ${columns.map(([, title]) => `<th>${escHtml(title)}</th>`).join('')}
        </tr></thead><tbody>${p2TableRows(family, columns)}</tbody></table>
      </div>
    </div>`;
}

function p2Group(family, index) {
  const arch = [...new Set(family.records.map(row => row.arch).filter(Boolean))];
  const note = arch.length ? `${arch.join(' / ')} architecture` : 'Ampere Computing server processors';
  const metaSearch = [family.name, ...arch].join(' ').toLowerCase();
  return `
    <div class="arch-group" id="p2-${family.id}"
         style="--arch-color:${P2_TONES[index % P2_TONES.length]}"
         data-series="${escHtml(family.name)}" data-search="${escHtml(metaSearch)}">
      <div class="arch-header" data-gen="${family.id}" role="button" tabindex="0" aria-expanded="false">
        <div class="timeline-dot"></div>
        <div class="arch-name">${escHtml(family.name)}</div>
        <div class="arch-year">${escHtml(family.year || '—')}</div>
        <div class="v2-count">${family.records.length} model${family.records.length === 1 ? '' : 's'}</div>
        <div class="expand-icon">⌄</div>
        <div class="arch-subtitle">${escHtml(note)}</div>
      </div>
      <div class="arch-body" inert><div class="arch-body-inner"><div class="skus-grid">
        ${p2Card(family)}
      </div></div></div>
    </div>`;
}

/** Announced products have no published model SKU tables. Keep them in the
 * timeline, but outside model filters and chip comparison. */
function p2Roadmap() {
  const entries = (p2Data?.roadmap || []).filter(row => row?.n);
  if (!entries.length) return '';
  return `<div class="arch-group p2-roadmap" id="p2-roadmap"
               style="--arch-color:#fe4943">
    <div class="arch-header unreleased-arch" data-gen="roadmap" role="button"
         tabindex="0" aria-expanded="false" aria-controls="p2-roadmap-body">
      <div class="timeline-dot"></div>
      <div class="arch-name">Announced roadmap</div>
      <div class="arch-year">Future</div>
      <div class="v2-count">${entries.length} announced · 0 models</div>
      <span class="unreleased-badge">unreleased</span>
      <div class="expand-icon">⌄</div>
      <div class="arch-subtitle">${entries.map(row => escHtml(row.n)).join(' · ')}</div>
    </div>
    <div class="arch-body" id="p2-roadmap-body" inert><div class="arch-body-inner">
      <div class="skus-grid">${entries.map(row => {
      const url = p2SourceUrl(row.source);
      const note = String(row.notes || '').replace(/\s*No model-level SKU table is published\.?\s*$/i, '');
      return `<div class="sku-card p2-roadmap-card">
        <div class="sku-name">${escHtml(row.n)}</div>
        ${note ? `<div class="sku-desc">${escHtml(note)}</div>` : ''}
        ${row.maxCores ? `<div class="sku-tags"><span class="sku-tag">Up to ${escHtml(row.maxCores)} cores</span></div>` : ''}
        ${url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">Official collateral ↗</a>` : ''}
      </div>`;
    }).join('')}</div>
      <p class="p2-roadmap-disclaimer">No published model specifications</p>
    </div></div>
  </div>`;
}

function p2Render() {
  dom.pageHeader.innerHTML =
    '<h1 class="header-ampere">Processors</h1><p>Ampere Computing server processors</p>';
  dom.timeline.innerHTML = p2Roadmap() + p2Families.map(p2Group).join('');
  dom.timeline.querySelectorAll('.arch-header').forEach(header => {
    header.addEventListener('click', () => p2Toggle(header.dataset.gen));
    header.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        p2Toggle(header.dataset.gen);
      }
    });
  });
  dom.timeline.querySelectorAll('.sku-card.has-specs').forEach(card => {
    card.addEventListener('click', () => p2ToggleSpecs(card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        p2ToggleSpecs(card);
      }
    });
  });
  p2ApplyFilters();
}

function p2Toggle(id) {
  const group = document.getElementById(`p2-${id}`);
  if (!group) return;
  const open = group.classList.toggle('expanded');
  p2Expanded[open ? 'add' : 'delete'](id);
  group.querySelector('.arch-header')?.setAttribute('aria-expanded', String(open));
  group.querySelector('.arch-body')?.toggleAttribute('inert', !open);
}

function p2ToggleSpecs(card) {
  const wrapper = document.getElementById(card.dataset.target);
  if (!wrapper) return;
  const open = wrapper.classList.toggle('open');
  card.classList.toggle('selected', open);
  card.setAttribute('aria-expanded', String(open));
}

function p2ExpandAll(open) {
  dom.timeline.querySelectorAll('.arch-group').forEach(group => {
    group.classList.toggle('expanded', open);
    group.querySelector('.arch-header')?.setAttribute('aria-expanded', String(open));
    group.querySelector('.arch-body')?.toggleAttribute('inert', !open);
  });
  p2Expanded.clear();
  if (open) {
    if (dom.timeline.querySelector('.p2-roadmap')) p2Expanded.add('roadmap');
    p2Families.forEach(family => p2Expanded.add(family.id));
  }
}

function p2RowFilterOk(row, group, overrideKey = '', overrideTag = '') {
  const chosen = key => overrideKey === key ? new Set([overrideTag]) : p2Active[key];
  const families = chosen('series');
  const memory = chosen('memType');
  const cores = p2Number(row.dataset.core);
  return (!families.size || families.has(group.dataset.series)) &&
    (!memory.size || memory.has(row.dataset.memType)) &&
    (coreRangeIsAll(p2Core) || coreRangeMatch(p2Core, cores, cores));
}

function p2RowSearchOk(row, card, group, context) {
  if (!context.q) return true;
  if (context.hasExact) return context.exactRows.has(row);
  return dashboardSearchMatch(card.dataset.metaSearch, context.q) ||
    dashboardSearchMatch(group.dataset.search, context.q) ||
    dashboardSearchMatch(row.dataset.search, context.q);
}

/** Count matching model rows for each chip, applying other groups and the
 * current search. This gives every published family and memory type a live chip. */
function p2CountFor(key, tag, context) {
  let count = 0;
  dom.timeline.querySelectorAll('.arch-group:not(.p2-roadmap)').forEach(group => {
    const card = group.querySelector('.sku-card');
    group.querySelectorAll('tbody tr[data-search]').forEach(row => {
      if (p2RowFilterOk(row, group, key, tag) &&
          p2RowSearchOk(row, card, group, context)) count++;
    });
  });
  return count;
}

/** Filters existing DOM rather than rebuilding it on each keystroke. Search
 * first identifies matching models, then family, memory, and core filters
 * intersect at the model-row level. */
function p2ApplyFilters() {
  if (!p2IsActive()) return;
  const context = dashboardSearchContext(p2Search);
  const filtered = p2Active.series.size + p2Active.memType.size +
    (coreRangeIsAll(p2Core) ? 0 : 1);

  dom.filterControls.querySelectorAll('.fchip').forEach(chip => {
    const selected = p2Active[chip.dataset.key];
    const active = selected.has(chip.dataset.tag);
    const count = p2CountFor(chip.dataset.key, chip.dataset.tag, context);
    chip.classList.toggle('active', active);
    chip.classList.toggle('inactive', !active && count === 0);
    chip.setAttribute('aria-pressed', String(active));
    chip.setAttribute('aria-label', `${chip.dataset.tag}, ${count} models`);
    const slot = chip.querySelector('.fchip-n');
    if (slot) slot.textContent = count || '';
  });
  const clear = dom.filterControls.querySelector('#p2Clear');
  if (clear) clear.hidden = filtered === 0;
  const badge = document.getElementById('sidebarCount');
  if (badge) { badge.textContent = filtered; badge.hidden = filtered === 0; }

  let shownFamilies = 0;
  let shownModels = 0;
  dom.timeline.querySelectorAll('.arch-group:not(.p2-roadmap)').forEach(group => {
    const card = group.querySelector('.sku-card');
    const search = dashboardApplyCardSearch(card, group, context);
    let visible = 0;
    group.querySelectorAll('tbody tr[data-search]').forEach(row => {
      const show = p2RowSearchOk(row, card, group, context) &&
        p2RowFilterOk(row, group);
      row.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    if (context.q && visible) {
      const first = group.querySelector('tbody tr[data-search]:not(.hidden)');
      const summary = card.querySelector('.search-summary');
      if (summary && first) {
        const reason = dashboardRowMatchReason(first, context.q,
          context.exactRows.has(first));
        summary.textContent = `${visible} matching SKU${visible === 1 ? '' : 's'} · ` +
          `${first.cells[0].textContent.trim()} · ${reason}`;
        summary.hidden = false;
      }
    }
    const showGroup = visible > 0;
    group.classList.toggle('hidden', !showGroup);
    card.classList.toggle('hidden', !showGroup);
    if (!showGroup && search.wrapper) {
      search.wrapper.classList.remove('open');
      card.classList.remove('selected');
      card.setAttribute('aria-expanded', 'false');
    }
    if (showGroup) { shownFamilies++; shownModels += visible; }
  });
  dom.timeline.querySelector('.p2-roadmap')?.classList.toggle('hidden',
    !!context.q || !!filtered);

  const status = document.getElementById('p2Status');
  if (status) status.textContent =
    `${shownFamilies} famil${shownFamilies === 1 ? 'y' : 'ies'} · ${shownModels} model${shownModels === 1 ? '' : 's'}`;
  if (typeof dashboardRestoreSelectedRows === 'function') dashboardRestoreSelectedRows();
  if (typeof dashboardStateChanged === 'function') dashboardStateChanged();
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIFECYCLE AND SHAREABLE STATE
// ═══════════════════════════════════════════════════════════════════════════

function p2Activate(data) {
  p2Data = data || p2Data;
  document.body.classList.add('ampere-v2');
  const status = document.getElementById('p2Status');
  if (status) status.hidden = false;
  dom.codenameTableWrap.innerHTML = '';
  dom.techTabs.classList.remove('visible');
  p2Search = '';
  p2Expanded.clear();
  Object.values(p2Active).forEach(set => set.clear());
  p2BuildFamilies();
  p2BuildCoreRange();
  p2BuildFilters();
  p2Render();
}

function p2Deactivate() {
  document.body.classList.remove('ampere-v2');
  const status = document.getElementById('p2Status');
  if (status) status.hidden = true;
}

function p2IsActive() {
  return document.body.classList.contains('ampere-v2');
}

function p2SetSearch(value) {
  p2Search = value || '';
  p2ApplyFilters();
}

function p2DashboardState() {
  return {
    tab: P2_TAB,
    search: p2Search,
    filters: Object.fromEntries(Object.entries(p2Active)
      .map(([key, values]) => [key, [...values]])),
    core: p2Core ? [p2Core.stops[p2Core.lo], p2Core.stops[p2Core.hi]] : null
  };
}

function p2ApplyDashboardState(state) {
  Object.entries(p2Active).forEach(([key, selected]) => {
    selected.clear();
    const available = new Set(p2FilterGroups()
      .find(group => group.key === key)?.tags.map(([tag]) => tag) || []);
    (state.filters?.[key] || []).forEach(value => {
      if (available.has(value)) selected.add(value);
    });
  });
  if (p2Core) {
    if (state.core) dashboardApplyCoreValues(p2Core, state.core);
    else { p2Core.lo = 0; p2Core.hi = p2Core.stops.length - 1; }
  }
  p2Search = state.search || '';
  dom.searchInput.value = p2Search;
  dom.searchClear.classList.toggle('visible', !!p2Search);
  coreRangePaint(P2_CORE_ID, p2Core);
  p2ApplyFilters();
}

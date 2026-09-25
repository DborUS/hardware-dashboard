// NVIDIA product-first renderer.  Facts come from generated nvidia-data.json;
// the configuration here controls presentation only.

const N2_CONFIG = {
  datacenter: {
    title: 'Data Center GPUs',
    blurb: 'AI, HPC, inference and visualization',
    filters: [['Architecture', 'arch'], ['Series', 'series']],
    columns: ['Model', 'Architecture', 'CUDA Cores', 'Memory', 'Memory Type', 'Bandwidth', 'PCIe', 'Power', 'FP32', 'Form'],
    fields: ['n', 'arch', 'cores', 'mem', 'memType', 'bw', 'pcie', 'power', 'fp32', 'form'],
    source: 'NVIDIA official product pages and datasheets'
  },
  geforce: {
    title: 'GeForce GPUs',
    blurb: 'Desktop graphics from 2017 onward',
    filters: [['Series', 'series']],
    columns: ['Model', 'CUDA Cores', 'Base', 'Boost', 'Memory', 'Memory Type', 'Bus', 'Bandwidth', 'PCIe', 'Power'],
    fields: ['n', 'cores', 'bas', 'bst', 'mem', 'memType', 'bus', 'bw', 'pcie', 'power'],
    source: 'NVIDIA GeForce official comparison tables'
  },
  cpu: {
    title: 'CPU + Superchips',
    blurb: 'Grace and Grace Blackwell platforms',
    filters: [['Series', 'series']],
    columns: ['Model', 'Architecture', 'Cores', 'Threads', 'L2', 'L3', 'Memory', 'Memory Type', 'Bandwidth', 'PCIe', 'TDP'],
    fields: ['n', 'arch', 'cores', 'threads', 'l2', 'l3', 'mem', 'memType', 'bw', 'pcie', 'tdp'],
    source: 'NVIDIA official platform guides and product pages'
  }
};

// Categorical accents from the supplied NVIDIA press deck. Green remains the
// primary signal; supporting chart colors appear only where groups need contrast.
const N2_TONES = ['#76b900', '#2ab7a9', '#167bd8', '#9b35c8', '#f39800', '#9b9b9b', '#c5b98a'];

let n2Tab = 'datacenter';
let n2Data = null;
let n2Search = '';
let n2Wired = false;
const n2Active = {};
const n2Expanded = new Set();

const n2Slug = value => String(value || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function n2Rows() {
  return (n2Data && n2Data[n2Tab]) || [];
}

function n2Unique(field) {
  const seen = new Set();
  return n2Rows().map(row => row[field]).filter(value => value && !seen.has(value) && seen.add(value));
}

function n2Groups() {
  const records = n2Rows();
  const groups = new Map();
  records.forEach(record => {
    const groupKey = n2Tab === 'geforce' ? record.series : record.year;
    const groupName = n2Tab === 'geforce'
      ? record.series
      : `${record.year} ${n2Tab === 'cpu' ? 'platforms' : 'data center'}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { id: n2Slug(`${n2Tab}-${groupKey}`), name: groupName, year: record.year, records: [] });
    }
    groups.get(groupKey).records.push(record);
  });

  const output = [...groups.values()];
  if (n2Tab !== 'geforce') output.sort((a, b) => Number(b.year) - Number(a.year));
  return output.map(group => {
    const families = new Map();
    group.records.forEach(record => {
      const familyKey = n2Tab === 'geforce' ? record.arch : record.series;
      if (!families.has(familyKey)) families.set(familyKey, { name: familyKey, records: [] });
      families.get(familyKey).records.push(record);
    });
    return { ...group, families: [...families.values()] };
  });
}

function n2FilterGroups() {
  return N2_CONFIG[n2Tab].filters.map(([label, key]) => ({
    label, key, tags: n2Unique(key)
  }));
}

function n2BuildFilters() {
  const groups = n2FilterGroups();
  const bar = dom.filterControls;
  bar.className = 'controls filter-bar';
  bar.innerHTML = groups.map(group => {
    n2Active[group.key] = n2Active[group.key] || new Set();
    const chips = group.tags.map((tag, index) => `
      <button class="fchip" data-key="${group.key}" data-tag="${escHtml(tag)}"
              style="--tag-color:${N2_TONES[index % N2_TONES.length]}" aria-pressed="false">
        <span class="fchip-dot" style="background:${N2_TONES[index % N2_TONES.length]}"></span>
        <span class="fchip-label">${escHtml(tag)}</span>
        <span class="fchip-n" aria-hidden="true"></span>
      </button>`).join('');
    return `<div class="fgroup"><span class="fgroup-label">${escHtml(group.label)}</span>
      <div class="${group.tags.length > 10 ? 'fgroup-scroll' : ''}">${chips}</div></div>`;
  }).join('') + '<button class="fclear" id="n2Clear" hidden>Clear filters</button>';

  bar.querySelectorAll('.fchip').forEach(chip => chip.addEventListener('click', () => {
    const selected = n2Active[chip.dataset.key];
    selected.has(chip.dataset.tag) ? selected.delete(chip.dataset.tag) : selected.add(chip.dataset.tag);
    n2ApplyFilters();
  }));
  document.getElementById('n2Clear').addEventListener('click', () => {
    Object.values(n2Active).forEach(set => set.clear());
    n2ApplyFilters();
  });
}

function n2TableRows(records) {
  const cfg = N2_CONFIG[n2Tab];
  return records.map(record => {
    const search = Object.values(record).filter(value => value != null).join(' ').toLowerCase();
    return `<tr data-search="${escHtml(search)}">${cfg.fields.map((field, index) =>
      `<td class="${index === 0 ? 'cpu-model-name' : ''}">${escHtml(record[field] || '—')}</td>`
    ).join('')}</tr>`;
  }).join('');
}

function n2Card(family, group, index) {
  const cfg = N2_CONFIG[n2Tab];
  const id = `n2t-${group.id}-${n2Slug(family.name)}`;
  const architectures = [...new Set(family.records.map(row => row.arch).filter(Boolean))];
  const series = [...new Set(family.records.map(row => row.series).filter(Boolean))];
  const segments = [...new Set(family.records.map(row => row.segment).filter(Boolean))];
  const meta = [family.name, ...architectures, ...series, ...segments].join(' ').toLowerCase();
  const tags = [...new Set([...architectures, ...segments])]
    .map(tag => `<span class="sku-tag">${escHtml(tag)}</span>`).join('');
  const description = `${family.records.length} model${family.records.length === 1 ? '' : 's'} · ${architectures.join(' / ')}`;
  return `
    <div class="sku-card has-specs" style="--card-order:${index * 4}"
         data-target="${id}" data-series="${escHtml(series.join('|'))}"
         data-arch="${escHtml(architectures.join('|'))}"
         data-meta-search="${escHtml(meta)}" data-search="${escHtml(meta)}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="sku-spec-toggle">specs ▾</div>
      <div class="sku-name">${escHtml(family.name)}</div>
      <div class="sku-desc">${escHtml(description)}</div>
      <div class="search-summary" hidden></div>
      <div class="sku-tags">${tags}</div>
    </div>
    <div class="cpu-spec-wrapper" id="${id}" style="--spec-order:${index * 4 + 1}">
      <div class="cpu-spec-overflow">
        <div class="cpu-spec-header"><div>
          <span class="cpu-spec-header-title">${escHtml(family.name)}</span>
          <div class="identity-path">NVIDIA › ${escHtml(cfg.title)} › ${escHtml(group.name)} › ${escHtml(family.name)}</div>
          <div class="source-line">Source: ${escHtml(cfg.source)}</div>
        </div><span class="cpu-spec-header-title v2-await">${family.records.length} model${family.records.length === 1 ? '' : 's'}</span></div>
        <table class="cpu-spec-table"><thead><tr>${cfg.columns.map(column => `<th>${escHtml(column)}</th>`).join('')}</tr></thead>
          <tbody>${n2TableRows(family.records)}</tbody></table>
      </div>
    </div>`;
}

function n2Group(group, index) {
  const total = group.records.length;
  const haystack = group.records.flatMap(row => Object.values(row)).join(' ').toLowerCase();
  return `
  <div class="arch-group" id="n2-${group.id}" style="--arch-color:${N2_TONES[index % N2_TONES.length]}"
       data-search="${escHtml(haystack)}">
    <div class="arch-header" data-gen="${group.id}" role="button" tabindex="0" aria-expanded="false">
      <div class="timeline-dot"></div>
      <div class="arch-name">${escHtml(group.name)}</div>
      <div class="arch-year">${escHtml(group.year)}</div>
      <div class="v2-count">${group.families.length} product line${group.families.length === 1 ? '' : 's'}
        <span class="v2-count-dim">· ${total} models</span></div>
      <div class="expand-icon">⌄</div>
      <div class="arch-subtitle">Official NVIDIA parts selected for the hardware dashboard</div>
    </div>
    <div class="arch-body"><div class="arch-body-inner"><div class="skus-grid">${group.families.map((family, cardIndex) =>
      n2Card(family, group, cardIndex)).join('')}</div></div></div>
  </div>`;
}

function n2Render() {
  const cfg = N2_CONFIG[n2Tab];
  dom.pageHeader.innerHTML = `<h1 class="header-nvidia">${escHtml(cfg.title)}</h1><p>${escHtml(cfg.blurb)}</p>`;
  dom.timeline.innerHTML = n2Groups().map(n2Group).join('');
  document.querySelectorAll('.arch-header').forEach(header => {
    header.addEventListener('click', () => n2Toggle(header.dataset.gen));
    header.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); n2Toggle(header.dataset.gen); }
    });
  });
  document.querySelectorAll('.sku-card.has-specs').forEach(card => {
    card.addEventListener('click', () => n2ToggleSpecs(card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); n2ToggleSpecs(card); }
    });
  });
  n2ApplyFilters();
}

function n2Toggle(id) {
  const group = document.getElementById(`n2-${id}`);
  if (!group) return;
  const open = group.classList.toggle('expanded');
  n2Expanded[open ? 'add' : 'delete'](id);
  group.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
}

function n2ToggleSpecs(card) {
  const wrapper = document.getElementById(card.dataset.target);
  const open = wrapper.classList.toggle('open');
  card.classList.toggle('selected', open);
  card.setAttribute('aria-expanded', String(open));
}

function n2ExpandAll(open) {
  document.querySelectorAll('.arch-group').forEach(group => {
    group.classList.toggle('expanded', open);
    group.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
  });
  n2Expanded.clear();
  if (open) n2Groups().forEach(group => n2Expanded.add(group.id));
}

function n2CardValues(card, key) {
  return (card.dataset[key] || '').split('|').filter(Boolean);
}

function n2CardMatchesFilters(card, overrideKey = '', overrideTag = '') {
  return N2_CONFIG[n2Tab].filters.every(([, key]) => {
    const selected = key === overrideKey ? new Set([overrideTag]) : (n2Active[key] || new Set());
    return !selected.size || n2CardValues(card, key).some(value => selected.has(value));
  });
}

function n2CountFor(key, tag) {
  const query = n2Search.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll('.arch-group').forEach(group => {
    const found = [...group.querySelectorAll('.sku-card')].some(card =>
      n2CardMatchesFilters(card, key, tag) &&
      (!query || card.dataset.search.includes(query) || group.dataset.search.includes(query) || n2SpecMatch(card.dataset.target, query)));
    if (found) count++;
  });
  return count;
}

function n2ApplyFilters() {
  const query = n2Search.trim().toLowerCase();
  const context = dashboardSearchContext(query);
  let shownGroups = 0;
  let shownCards = 0;

  document.querySelectorAll('.fchip').forEach(chip => {
    const selected = n2Active[chip.dataset.key] || new Set();
    const active = selected.has(chip.dataset.tag);
    const count = n2CountFor(chip.dataset.key, chip.dataset.tag);
    chip.classList.toggle('active', active);
    chip.classList.toggle('inactive', !active && count === 0);
    chip.setAttribute('aria-pressed', String(active));
    const slot = chip.querySelector('.fchip-n');
    if (slot) slot.textContent = count || '';
  });
  const activeCount = Object.values(n2Active).reduce((sum, set) => sum + set.size, 0);
  const clear = document.getElementById('n2Clear');
  if (clear) clear.hidden = activeCount === 0;
  const badge = document.getElementById('sidebarCount');
  if (badge) { badge.textContent = activeCount; badge.hidden = activeCount === 0; }

  document.querySelectorAll('.arch-group').forEach(group => {
    let visible = 0;
    group.querySelectorAll('.sku-card').forEach(card => {
      const search = dashboardApplyCardSearch(card, group, context);
      const show = n2CardMatchesFilters(card) && search.matched;
      card.classList.toggle('hidden', !show);
      if (!show && search.wrapper) {
        search.wrapper.classList.remove('open');
        card.classList.remove('selected');
      }
      if (show) visible++;
    });
    group.classList.toggle('hidden', visible === 0);
    if (visible) { shownGroups++; shownCards += visible; }
  });

  const status = document.getElementById('n2Status');
  if (status) status.textContent = `${shownGroups} groups · ${shownCards} product lines`;
  if (typeof dashboardRestoreSelectedRows === 'function') dashboardRestoreSelectedRows();
  if (typeof dashboardStateChanged === 'function') dashboardStateChanged();
}

function n2SpecMatch(targetId, query) {
  const wrapper = document.getElementById(targetId);
  return !!query && !!wrapper && wrapper.textContent.toLowerCase().includes(query);
}

function n2Switch(tab) {
  n2Tab = tab;
  n2Search = dashboardGlobalSearchQuery;
  n2Expanded.clear();
  dom.searchInput.value = n2Search;
  Object.keys(n2Active).forEach(key => delete n2Active[key]);
  document.querySelectorAll('.n2-subtab').forEach(button =>
    button.classList.toggle('active', button.dataset.tab === tab));
  n2BuildFilters();
  n2Render();
  dashboardGlobalRender();
}

function n2Activate(data) {
  n2Data = data || n2Data;
  document.body.classList.add('nvidia-v2');
  document.getElementById('n2Subtabs').classList.add('visible');
  document.getElementById('n2Status').hidden = false;
  dom.codenameTableWrap.innerHTML = '';
  dom.techTabs.classList.remove('visible');
  if (!n2Wired) {
    document.querySelectorAll('.n2-subtab').forEach(button =>
      button.addEventListener('click', () => n2Switch(button.dataset.tab)));
    n2Wired = true;
  }
  n2Tab = 'datacenter';
  n2Search = '';
  n2Expanded.clear();
  Object.keys(n2Active).forEach(key => delete n2Active[key]);
  document.querySelectorAll('.n2-subtab').forEach(button =>
    button.classList.toggle('active', button.dataset.tab === 'datacenter'));
  n2BuildFilters();
  n2Render();
}

function n2Deactivate() {
  document.body.classList.remove('nvidia-v2');
  document.getElementById('n2Subtabs')?.classList.remove('visible');
  const status = document.getElementById('n2Status');
  if (status) status.hidden = true;
}

function n2SetSearch(value) {
  n2Search = value;
  n2ApplyFilters();
}

function n2IsActive() {
  return document.body.classList.contains('nvidia-v2');
}

function n2DashboardState() {
  return {
    tab: n2Tab,
    search: n2Search,
    filters: Object.fromEntries(Object.entries(n2Active).map(([key, values]) => [key, [...values]])),
    core: null
  };
}

function n2ApplyDashboardState(state) {
  if (state.tab && N2_CONFIG[state.tab] && state.tab !== n2Tab) n2Switch(state.tab);
  Object.entries(state.filters || {}).forEach(([key, values]) => {
    if (!n2Active[key]) return;
    n2Active[key].clear();
    values.forEach(value => n2Active[key].add(value));
  });
  n2Search = state.search || '';
  dom.searchInput.value = n2Search;
  dom.searchClear.classList.toggle('visible', !!n2Search);
  n2ApplyFilters();
}

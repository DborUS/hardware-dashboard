// ════════════════════════════════════════
// DATA LOADING (Dynamic JSON Loading)
// ════════════════════════════════════════

// Bump when any js/data/*.json changes, so browsers refetch instead of serving a
// stale copy. Mirrors the ?v= on the script tag in index.html.
const DATA_VERSION = '20260827-header';

// Cache for loaded data to avoid redundant fetches
const dataCache = {};

// Global CPU specs (loaded dynamically)
let AMD_CPU_SPECS = undefined;
let INTEL_CPU_SPECS = undefined;

// Loading state management
let isLoading = false;
let loadingVendor = null;

/**
 * Loads vendor data from JSON files dynamically
 * @param {string} vendor - 'intel', 'amd', or 'amd-gpu'
 * @returns {Promise<Array>} The loaded data array
 */
async function loadVendorData(vendor) {
  // Return cached data if available
  if (dataCache[vendor]) {
    return dataCache[vendor];
  }

  // Prevent duplicate concurrent loads
  if (isLoading && loadingVendor === vendor) {
    // Wait for the current load to complete
    while (isLoading && loadingVendor === vendor) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return dataCache[vendor];
  }

  isLoading = true;
  loadingVendor = vendor;

  try {
    // Cache-bust: without this a browser happily serves a stale copy after a data
    // edit, which looks exactly like "the change didn't apply".
    const response = await fetch(`js/data/${vendor}-data.json?v=${DATA_VERSION}`);

    if (!response.ok) {
      throw new Error(`Failed to load ${vendor} data: ${response.statusText}`);
    }

    const data = await response.json();
    dataCache[vendor] = data;
    return data;
  } catch (error) {
    console.error(`Error loading ${vendor} data:`, error);
    // Return empty array as fallback
    return [];
  } finally {
    isLoading = false;
    loadingVendor = null;
  }
}

/**
 * Shows loading indicator in the timeline
 */
function showLoadingIndicator() {
  if (dom && dom.timeline) {
    dom.timeline.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Loading data...</div>';
  }
}

/**
 * Hides loading indicator and restores timeline content
 */
function hideLoadingIndicator() {
  // Loading indicator will be replaced by render()
}


// AMD GPU DATA will be loaded dynamically
// (Removed inline data - now loaded from js/data/amd-gpu-data.json)

// ════════════════════════════════════════
// VENDOR CONFIGURATION
// ════════════════════════════════════════
const VENDOR_CONFIG = {
  intel: {
    title: 'Intel Client + Server Roadmap',
    headerClass: 'header-intel',
    data: null, // Loaded dynamically from js/data/intel-data.json
    segmentTags: [
      { tag: 'desktop', color: '#4ade80', label: 'Desktop' },
      { tag: 'mobile', color: '#f472b6', label: 'Mobile' },
      { tag: 'server', color: '#fbbf24', label: 'Server' },
      { tag: 'embedded', color: '#c084fc', label: 'Embedded/IoT' }
    ],
    brandTags: [
      { tag: 'Core Ultra', color: '#38bdf8' },
      { tag: 'Core', color: '#fb923c' },
      { tag: 'Xeon', color: '#a78bfa' },
      { tag: 'Xeon 6 P', color: '#ef4444' },
      { tag: 'Xeon 6 E', color: '#14b8a6' },
      { tag: 'Xeon 6+', color: '#f59e0b' },
      { tag: 'Xeon D', color: '#818cf8' },
      { tag: 'Atom', color: '#84cc16' }
    ],
    filterButtons: ['all', 'desktop', 'mobile', 'server', 'embedded'],
    unifiedFilters: true    // single multi-select filter bar (see buildFilterBar)
  },
  amd: {
    title: 'AMD Zen Architecture Roadmap',
    headerClass: 'header-amd',
    data: null, // Loaded dynamically from js/data/amd-data.json
    segmentTags: [
      { tag: 'desktop', color: '#4ade80', label: 'Desktop' },
      { tag: 'laptop', color: '#f472b6', label: 'Laptop' },
      { tag: 'handheld', color: '#22d3ee', label: 'Handheld' },
      { tag: 'server', color: '#fbbf24', label: 'Server' }
    ],
    brandTags: [
      { tag: 'Ryzen', color: '#f97316' },
      { tag: 'Ryzen AI', color: '#06b6d4' },
      { tag: 'Threadripper', color: '#f59e0b' },
      { tag: 'Epyc', color: '#10b981' },
      { tag: 'Athlon', color: '#8b5cf6' }
    ],
    filterButtons: ['all', 'desktop', 'laptop', 'handheld', 'server'],
    unifiedFilters: true,   // single multi-select filter bar (see buildUnifiedFilters)
    codenameTable: [
      { zen: 'Zen 6', id: 'zen6', process: '2 nm', color: '#ec4899', desktop: '—', hedt: '', laptop: '—', server: 'Venice (SP7 / SP8)', handheld: '' },
      { zen: 'Zen 5', id: 'zen5', process: '4/3 nm', color: '#ef4444', desktop: 'Granite Ridge', hedt: 'Shimada Peak', laptop: 'Strix Point · Strix Halo · Gorgon Point · Fire Range', server: 'Turin / Turin Dense', handheld: 'Z2' },
      { zen: 'Zen 4', id: 'zen4', process: '5 nm', color: '#f97316', desktop: 'Raphael', hedt: 'Storm Peak', laptop: 'Dragon Range · Phoenix · Hawk Point · Hawk Point Refresh', server: 'Genoa · Genoa-X · Bergamo · Siena', handheld: 'Z1' },
      { zen: 'Zen 3+', id: 'zen3plus', process: '6 nm', color: '#f59e0b', desktop: '—', hedt: '', laptop: 'Rembrandt', server: '—', handheld: '' },
      { zen: 'Zen 3', id: 'zen3', process: '7 nm', color: '#84cc16', desktop: 'Vermeer · Cezanne', hedt: 'Chagall', laptop: 'Cezanne · Barceló', server: 'Milan · Milan-X', handheld: '' },
      { zen: 'Zen 2', id: 'zen2', process: '7 nm', color: '#14b8a6', desktop: 'Matisse · Renoir', hedt: 'Castle Peak', laptop: 'Renoir · Lucienne · Mendocino', server: 'Rome', handheld: '' },
      { zen: 'Zen+', id: 'zenplus', process: '12 nm', color: '#818cf8', desktop: 'Pinnacle Ridge', hedt: 'Colfax', laptop: 'Picasso', server: '—', handheld: '' },
      { zen: 'Zen', id: 'zen1', process: '14 nm', color: '#c084fc', desktop: 'Summit Ridge · Raven Ridge', hedt: 'Whitehaven', laptop: 'Raven Ridge · Dalí', server: 'Naples', handheld: '' }
    ],
    gpuData: null, // Loaded dynamically from js/data/amd-gpu-data.json
    gpuTitle: 'AMD GPU Roadmap'
  }
};

// ════════════════════════════════════════
// SEARCH INDEXING
// ════════════════════════════════════════
/**
 * Spec fields included in the search index, beyond the model name.
 *
 * Deliberately excludes raw numerics (cores, threads, clocks, cache) -- a bare "128"
 * would otherwise match core counts, thread counts and cache sizes at once. These five
 * are the fields people search by name: socket, TDP, PCIe, memory, product ID.
 */
const CPU_SEARCH_FIELDS = ['sk', 'tdp', 'pcie', 'mem', 'tr'];

/**
 * Builds the searchable text for one CPU model row.
 * @param {Object} m - a record from amd-cpu-specs.json / intel-cpu-specs.json
 * @returns {string} space-joined haystack for this model
 */
function cpuModelSearchText(m) {
  return [m.n, ...CPU_SEARCH_FIELDS.map(f => m[f] || '')].join(' ');
}

/**
 * True if a CPU model matches the search term, checking the model name and the
 * indexed spec fields. Single source of truth so render() and applyFilters() agree.
 * @param {Object} m - CPU model record
 * @param {string} term - already-lowercased search term
 */
function cpuModelMatches(m, term) {
  return cpuModelSearchText(m).toLowerCase().includes(term);
}

// ════════════════════════════════════════
// GPU SEGMENTS
// ════════════════════════════════════════
/**
 * GPU segment categories, used for both the legend and the filter buttons.
 * `mobile` is derived at render time from a family's form factors (Laptops /
 * Mobile Workstations) rather than stored in the data -- see gpuSegmentOf().
 */
const GPU_SEGMENTS = [
  { tag: 'datacenter',  label: 'Datacenter',  color: '#ef4444' },
  { tag: 'workstation', label: 'Workstation', color: '#818cf8' },
  { tag: 'consumer',    label: 'Consumer',    color: '#10b981' },
  { tag: 'mobile',      label: 'Mobile',      color: '#22d3ee' }
];

/** Form-factor strings that mean "this is a laptop / mobile part". */
const MOBILE_FORMS = ['laptops', 'mobile workstations'];

/**
 * Resolve a GPU family's segment. Families whose every model is a mobile form
 * factor are reported as 'mobile'; everything else keeps its data segment.
 * @param {Object} arch - GPU architecture entry
 * @returns {string} one of datacenter | workstation | consumer | mobile
 */
function gpuSegmentOf(arch) {
  const forms = (arch.gpuSpecs && arch.gpuSpecs.models ? arch.gpuSpecs.models : [])
    .map(m => (m.form || '').toLowerCase())
    .filter(Boolean);
  if (forms.length && forms.every(f => MOBILE_FORMS.includes(f))) return 'mobile';
  return arch.segment || 'datacenter';
}

// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
let currentVendor = 'intel';
let currentTechTab = 'cpu';
let expandedGroups = new Set();
let activeSegmentTags = new Set();
let activeBrandTags = new Set();
let activeGpuSegments = new Set();   // empty = show all
let filterBarGroups = [];            // group descriptors for the active unified bar

// ════════════════════════════════════════
// CACHED DOM REFERENCES (Performance)
// ════════════════════════════════════════
let dom = null; // Will be initialized after DOM is ready

function initDomCache() {
  dom = {
    timeline: document.getElementById('timeline'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    pageHeader: document.getElementById('pageHeader'),
    filterControls: document.getElementById('filterControls'),
    filterStatus: document.getElementById('filterStatus'),
    codenameTableWrap: document.getElementById('codenameTableWrap'),
    techTabs: document.getElementById('techTabs'),
    tabIntel: document.getElementById('tabIntel'),
    tabAmd: document.getElementById('tabAmd'),
    techTabCpu: document.getElementById('techTabCpu'),
    techTabGpu: document.getElementById('techTabGpu'),
    expandAllBtn: document.getElementById('expandAllBtn'),
    collapseAllBtn: document.getElementById('collapseAllBtn'),
    clearSelectionsBtn: document.getElementById('clearSelectionsBtn')
  };
}

// ════════════════════════════════════════
// PERFORMANCE UTILITIES
// ════════════════════════════════════════
let searchTimeout = null;

function debounce(func, delay) {
  return function(...args) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const PERF_LOGGING_ENABLED = true; // Set to false in production

function perfStart(label) {
  if (PERF_LOGGING_ENABLED) console.time(label);
}

function perfEnd(label) {
  if (PERF_LOGGING_ENABLED) console.timeEnd(label);
}

// ════════════════════════════════════════
// VENDOR SWITCHING
// ════════════════════════════════════════
async function switchVendor(vendor) {
  currentVendor = vendor;
  currentTechTab = 'cpu';
  expandedGroups.clear();
  activeSegmentTags.clear();
  activeBrandTags.clear();
  activeGpuSegments.clear();
  dom.searchInput.value = '';

  // Tab styling. `data-active` on the pill drives the sliding thumb; the
  // button classes still carry the active state for the smoke test and a11y.
  dom.tabIntel.className = 'vendor-tab' + (vendor === 'intel' ? ' active-intel' : '');
  dom.tabAmd.className = 'vendor-tab' + (vendor === 'amd' ? ' active-amd' : '');
  dom.tabIntel.setAttribute('aria-selected', vendor === 'intel' ? 'true' : 'false');
  dom.tabAmd.setAttribute('aria-selected', vendor === 'amd' ? 'true' : 'false');
  const pill = document.getElementById('vendorPill');
  if (pill) pill.dataset.active = vendor;

  const cfg = VENDOR_CONFIG[vendor];

  // Show loading indicator
  showLoadingIndicator();

  // Load vendor data dynamically
  if (!cfg.data) {
    cfg.data = await loadVendorData(vendor);
  }

  // Load GPU data for AMD if not loaded
  if (vendor === 'amd' && !cfg.gpuData) {
    cfg.gpuData = await loadVendorData('amd-gpu');
  }

  // Load AMD CPU specs for detailed tables
  if (vendor === 'amd' && typeof AMD_CPU_SPECS === 'undefined') {
    try {
      const response = await fetch(`js/data/amd-cpu-specs.json?v=${DATA_VERSION}`);
      if (response.ok) {
        AMD_CPU_SPECS = await response.json();
        console.log('AMD_CPU_SPECS loaded:', Object.keys(AMD_CPU_SPECS).length, 'codenames');
      }
    } catch (error) {
      console.warn('Could not load AMD CPU specs:', error);
    }
  }

  // Load Intel CPU specs for detailed tables
  if (vendor === 'intel' && typeof INTEL_CPU_SPECS === 'undefined') {
    try {
      const response = await fetch(`js/data/intel-cpu-specs.json?v=${DATA_VERSION}`);
      if (response.ok) {
        INTEL_CPU_SPECS = await response.json();
        console.log('INTEL_CPU_SPECS loaded:', Object.keys(INTEL_CPU_SPECS).length, 'codenames');
      }
    } catch (error) {
      console.warn('Could not load Intel CPU specs:', error);
    }
  }

  // Show/hide tech tabs
  if (cfg.gpuData) {
    dom.techTabs.classList.add('visible');
    dom.techTabCpu.classList.add('active');
    dom.techTabGpu.classList.remove('active');
  } else {
    dom.techTabs.classList.remove('visible');
  }

  // Both vendors now use a product-first renderer that owns these same DOM
  // nodes: Intel via js/intel-v2.js, AMD via js/amd-v2.js. Exactly one is
  // active at a time. The legacy render() path below is retained but unused
  // for normal navigation -- see docs/PROJECT-STATE.md.
  if (vendor === 'intel') { a2Deactivate(); v2Activate(); return; }
  v2Deactivate();
  a2Activate(AMD_CPU_SPECS, cfg.gpuData);
}

function switchTech(tab) {
  if (currentTechTab === tab) return;
  currentTechTab = tab;
  expandedGroups.clear();
  activeSegmentTags.clear();
  activeBrandTags.clear();
  activeGpuSegments.clear();
  dom.searchInput.value = '';

  dom.techTabCpu.classList.toggle('active', tab === 'cpu');
  dom.techTabGpu.classList.toggle('active', tab === 'gpu');

  const cfg = VENDOR_CONFIG[currentVendor];
  if (tab === 'gpu') {
    dom.pageHeader.innerHTML = `<h1 class="${cfg.headerClass}">${cfg.gpuTitle}</h1><p>Instinct · Radeon · Radeon PRO · FirePro</p>`;
    // Hide CPU-only UI
    dom.codenameTableWrap.innerHTML = '';
    buildGpuUnifiedFilters();
  } else {
    dom.pageHeader.innerHTML = `<h1 class="${cfg.headerClass}">${cfg.title}</h1><p>Processor Architecture Generations</p>`;
    buildUnifiedFilters();
    buildCodenameTable();
  }
  render();
}

function buildCodenameTable() {
  const cfg = VENDOR_CONFIG[currentVendor];
  const wrap = dom.codenameTableWrap;
  if (!cfg.codenameTable) { wrap.innerHTML = ''; return; }

  const rows = cfg.codenameTable;
  wrap.innerHTML = `
    <div class="codename-table-wrap collapsed" id="codenameTablePanel">
      <div class="codename-table-header" onclick="document.getElementById('codenameTablePanel').classList.toggle('collapsed')">
        <span class="codename-table-title">⚡ Codename Quick Reference</span>
        <span class="codename-table-toggle">▾</span>
      </div>
      <div class="codename-table-body">
        <table class="codename-table">
          <thead>
            <tr>
              <th>Zen Gen</th>
              <th>Process</th>
              <th>Desktop</th>
              <th>Laptop</th>
              <th>Handheld</th>
              <th>Server</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr onclick="jumpToArch('${r.id}')" title="Click to expand ${r.zen}">
                <td><span class="ct-zen" style="color:${r.color}">${r.zen}</span></td>
                <td><span class="ct-process">${r.process}</span></td>
                <td><span class="ct-codename">${r.desktop}</span>${r.hedt ? `<span class="ct-hedt">HEDT: ${r.hedt}</span>` : ''}</td>
                <td><span class="ct-codename">${r.laptop}</span></td>
                <td><span class="ct-codename">${r.handheld || '—'}</span></td>
                <td><span class="ct-codename">${r.server}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function jumpToArch(id) {
  expandedGroups.add(id);
  render();
  setTimeout(() => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, 100);
}

/**
 * Single multi-select filter bar: Segment group + Brand group, divided, plus a Clear
 * chip that appears only when something is selected.
 *
 * Replaces the old two-row design where the legend was multi-select and the button row
 * was single-select for the same tags -- same labels, different behaviour, no way to tell.
 * Everything here is multi-select; selections within a group are OR'd, and the two groups
 * are AND'd together by applyFilters().
 */
function buildUnifiedFilters() {
  const cfg = VENDOR_CONFIG[currentVendor];
  buildFilterBar([
    { key: 'segment', label: 'Segment', set: activeSegmentTags,
      tags: cfg.segmentTags.map(t => ({ tag: t.tag, label: t.label, color: t.color })) },
    { key: 'brand', label: 'Brand', set: activeBrandTags,
      tags: cfg.brandTags.map(t => ({ tag: t.tag, label: t.tag, color: t.color })) }
  ]);
}

/** GPU tab: one multi-select Segment group. GPU data has no clean second axis. */
function buildGpuUnifiedFilters() {
  buildFilterBar([
    { key: 'segment', label: 'Segment', set: activeGpuSegments,
      tags: GPU_SEGMENTS.map(t => ({ tag: t.tag, label: t.label, color: t.color })) }
  ]);
}

/**
 * Renders the unified multi-select filter bar.
 *
 * Shared by the CPU and GPU tabs so both behave identically. Within a group the
 * selected tags are OR'd; separate groups are AND'd by applyFilters(). An empty
 * group means "no constraint", so the bar needs no All button -- a Clear chip
 * appears instead once anything is selected.
 *
 * @param {Array<{key:string,label:string,set:Set<string>,tags:Array<{tag:string,label:string,color:string}>}>} groups
 */
function buildFilterBar(groups) {
  filterBarGroups = groups;

  const chip = (key, t) =>
    `<button class="fchip" data-tag-type="${key}" data-tag="${t.tag}" style="--tag-color:${t.color}" aria-pressed="false">
       <span class="fchip-dot" style="background:${t.color}"></span>${t.label}
     </button>`;

  const html = groups.map(g =>
    `<div class="fgroup" role="group" aria-label="Filter by ${g.label.toLowerCase()}">
       <span class="fgroup-label">${g.label}</span>${g.tags.map(t => chip(g.key, t)).join('')}
     </div>`
  ).join('<div class="fgroup-sep"></div>');

  // A single row reads best, but past ~10 chips it wraps around the divider and looks
  // broken. Stack the groups instead once the bar gets crowded.
  const chipCount = groups.reduce((n, g) => n + g.tags.length, 0);
  const stacked = groups.length > 1 && chipCount > 10 ? ' stacked' : '';

  dom.filterControls.innerHTML =
    `<div class="filter-bar${stacked}">${html}<button class="fclear" id="filterClear" hidden>Clear filters</button></div>`;

  const byKey = Object.fromEntries(groups.map(g => [g.key, g.set]));

  dom.filterControls.querySelectorAll('.fchip').forEach(btn => {
    btn.addEventListener('click', () => {
      const set = byKey[btn.dataset.tagType];
      const tag = btn.dataset.tag;
      set.has(tag) ? set.delete(tag) : set.add(tag);
      syncUnifiedFilters();
      applyFilters();
    });
  });

  dom.filterControls.querySelector('#filterClear').addEventListener('click', () => {
    groups.forEach(g => g.set.clear());
    syncUnifiedFilters();
    applyFilters();
  });

  syncUnifiedFilters();
}

/** Repaint chip states + show/hide the Clear chip. */
function syncUnifiedFilters() {
  if (!filterBarGroups.length) return;
  const anyActive = filterBarGroups.some(g => g.set.size > 0);
  const byKey = Object.fromEntries(filterBarGroups.map(g => [g.key, g.set]));

  dom.filterControls.querySelectorAll('.fchip').forEach(btn => {
    const set = byKey[btn.dataset.tagType];
    if (!set) return;
    const on = set.has(btn.dataset.tag);
    btn.classList.toggle('active', on);
    // dim unselected chips only within a group that has a selection
    btn.classList.toggle('inactive', !on && set.size > 0);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  const clearBtn = dom.filterControls.querySelector('#filterClear');
  if (clearBtn) clearBtn.hidden = !anyActive;
}

// ════════════════════════════════════════
// RENDER
// ════════════════════════════════════════
function render() {
  perfStart('render');

  const timeline = dom.timeline;
  const cfg = VENDOR_CONFIG[currentVendor];
  const isGpu = currentTechTab === 'gpu' && cfg.gpuData;
  const data = isGpu ? cfg.gpuData : cfg.data;

  // Safety check: Don't render if data isn't loaded yet
  if (!data || !Array.isArray(data)) {
    perfEnd('render');
    return;
  }

  timeline.innerHTML = '';
  let animIndex = 0;

  if (isGpu) {
    renderGpu(timeline, data);
    perfEnd('render');
    applyFilters();
    return;
  }

  data.forEach(entry => {
    if (entry.era) {
      const sep = document.createElement('div');
      sep.className = 'era-separator';
      sep.innerHTML = `<span class="era-label">${entry.era}</span><div class="era-line"></div>`;
      timeline.appendChild(sep);
      return;
    }
    const arch = entry;

    const isExpanded = expandedGroups.has(arch.id);
    const group = document.createElement('div');
    group.className = `arch-group${isExpanded ? ' expanded' : ''}`;
    group.style.setProperty('--arch-color', arch.color);
    group.dataset.id = arch.id;
    group.style.animationDelay = `${animIndex * 0.04}s`;
    animIndex++;

    // Store filter metadata as data attributes for CSS-based filtering
    const segmentTags = arch.skus.flatMap(sku => sku.tags).filter((v, i, a) => a.indexOf(v) === i);
    const brandTags = arch.skus.map(sku => sku.brand).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    const searchText = [
      arch.arch,
      arch.segment || '',
      arch.subtitle || '',
      ...arch.skus.flatMap(sku => [
        sku.name,
        sku.desc,
        ...sku.tags,
        sku.brand || '',
        ...((AMD_CPU_SPECS && AMD_CPU_SPECS[sku.name]) ? AMD_CPU_SPECS[sku.name].map(cpuModelSearchText) : (INTEL_CPU_SPECS && INTEL_CPU_SPECS[sku.name]) ? INTEL_CPU_SPECS[sku.name].map(cpuModelSearchText) : [])
      ])
    ].join('|').toLowerCase();

    group.dataset.segments = segmentTags.join(',');
    group.dataset.brands = brandTags.join(',');
    group.dataset.searchText = searchText;

    const hasServer = arch.skus.some(s => s.tags.includes('server'));
    const hasClient = arch.skus.some(s => !s.tags.includes('server'));
    let segBadge = '';
    if (hasServer && !hasClient) segBadge = '<span class="arch-segment-badge server-badge">Server</span>';
    else if (!hasServer && hasClient) segBadge = '<span class="arch-segment-badge client-badge">Client</span>';
    else segBadge = '<span class="arch-segment-badge client-badge">Client</span><span class="arch-segment-badge server-badge">Server</span>';

    group.innerHTML = `
      <div class="arch-header${arch.unreleased ? ' unreleased-arch' : ''}" onclick="toggleGroup('${arch.id}')" role="button" tabindex="0" aria-expanded="${isExpanded}" aria-label="${escHtml(arch.arch)}, ${arch.year}">
        <div class="timeline-dot"></div>
        <span class="arch-name">${arch.arch}</span>
        <span class="arch-year">${arch.year}</span>
        ${arch.unreleased ? '<span class="unreleased-badge">Unreleased</span>' : ''}
        ${segBadge}
        <span class="expand-icon">▾</span>
        ${arch.subtitle ? `<div class="arch-subtitle">${arch.subtitle.replace(/ · /g, '<span class="sub-sep">·</span>')}</div>` : ''}
      </div>
      <div class="arch-body">
        <button class="collapse-specs-btn" id="collapse-specs-${arch.id}" onclick="event.stopPropagation(); collapseAllSpecs('${arch.id}')">▴ Collapse</button>
        <div class="skus-grid">
          ${arch.skus.map((sku, i) => {
            const cpuSpecs = (typeof AMD_CPU_SPECS !== 'undefined' && AMD_CPU_SPECS && AMD_CPU_SPECS[sku.name]) ? AMD_CPU_SPECS[sku.name]
              : (typeof INTEL_CPU_SPECS !== 'undefined' && INTEL_CPU_SPECS && INTEL_CPU_SPECS[sku.name]) ? INTEL_CPU_SPECS[sku.name] : null;
            const hasSpecs = cpuSpecs && cpuSpecs.length > 0;
            const specId = arch.id + '-' + sku.name.replace(/[^a-zA-Z0-9]/g, '_');
            return `
            <div class="sku-card${hasSpecs ? ' has-specs' : ''}${arch.unreleased && !hasSpecs ? ' unreleased-sku' : ''}" style="--card-order: ${i * 2};" data-sku-tags="${sku.tags.join(',')}" data-sku-brand="${sku.brand || ''}" data-sku-name="${escHtml(sku.name)}" ${hasSpecs ? `onclick="toggleCpuSpecs('${specId}')" role="button" tabindex="0" aria-expanded="false" aria-label="${escHtml(sku.name)}, ${cpuSpecs.length} models"` : ''}>
              <div class="sku-name">${sku.name}${hasSpecs ? `<span class="sku-spec-count">${cpuSpecs.length} SKUs</span>` : arch.unreleased ? '<span class="unreleased-notice">No specs yet</span>' : ''}</div>
              <div class="sku-desc">${sku.desc}</div>
              <div class="sku-tags">
                ${sku.tags.map(t => `<span class="sku-tag ${t}">${t}</span>`).join('')}
                ${sku.brand ? `<span class="sku-tag brand-${sku.brand.toLowerCase().replace(/\s+/g, '-')}">${sku.brand}</span>` : ''}
              </div>
              ${hasSpecs ? '<div class="sku-spec-toggle">▾ Specs</div>' : arch.unreleased ? '<div class="sku-spec-toggle unreleased-text">Unreleased</div>' : ''}
            </div>
            ${hasSpecs ? `<div class="cpu-spec-wrapper" id="cpu-spec-${specId}" style="--spec-order: ${i * 2 + 1};">
              <div class="cpu-spec-overflow">
                <table class="cpu-spec-table">
                  <thead><tr>
                    <th>Name</th><th>Cores</th>${hasHybridCores(cpuSpecs) ? '<th>P-cores</th><th>E-cores</th>' : ''}<th>Threads</th><th>Boost</th><th>Base</th><th>L3</th><th>TDP</th>${cpuSpecs[0]._srv
                      ? '<th>Socket</th><th>Sockets</th><th>PCIe</th><th>Memory</th>'
                      : '<th>GPU Model</th><th>GPU CUs</th><th>GPU Freq</th>'}<th>Product ID Tray</th>
                  </tr></thead>
                  <tbody>${cpuSpecs.map(m => `<tr>
                    <td class="cpu-model-name">${m.n}</td>
                    <td class="cpu-val-highlight">${m.c}</td>
                    ${hasHybridCores(cpuSpecs) ? `<td class="cpu-core-p">${coreCount(m, 'p')}</td><td class="cpu-core-e">${coreCount(m, 'e')}</td>` : ''}
                    <td>${m.t}</td>
                    <td class="cpu-val-highlight">${dash(m.bst)}</td><td>${dash(m.bas)}</td>
                    <td>${dash(m.l3)}</td><td>${dash(m.tdp)}</td>${m._srv
                      ? `<td>${dash(m.sk)}</td><td class="cpu-val-highlight">${socketCount(m)}</td><td>${dash(m.pcie)}</td><td>${memWithChannels(m)}</td>`
                      : `<td class="cpu-val-gpu">${dash(m.gm)}</td><td>${dash(m.gc)}</td><td>${dash(m.gf)}</td>`}
                    <td>${dash(m.tr)}</td>
                  </tr>`).join('')}</tbody>
                </table>
              </div>
            </div>` : ''}
          `}).join('')}
        </div>
        <div class="links-area">
          <div class="links-header">
            <span class="links-label">Links</span>
            <button class="add-link-btn" onclick="showAddLinkForm('${arch.id}')">+ Add Link</button>
          </div>
          <div class="links-list">
            ${getLinks(arch).map((lnk, idx) => `
              <div class="link-item">
                <span class="link-icon">↗</span>
                <span class="link-label-text">${escHtml(lnk.label)}</span>
                <a href="${escHtml(lnk.url)}" target="_blank" rel="noopener">${escHtml(lnk.url)}</a>
                <button class="link-remove-btn" onclick="removeLink('${arch.id}', ${idx})" title="Remove">✕</button>
              </div>
            `).join('')}
            ${getLinks(arch).length === 0 ? '<div class="link-empty">No links yet</div>' : ''}
          </div>
          <div class="add-link-form" id="add-link-form-${arch.id}">
            <input type="text" placeholder="Label" id="link-label-${arch.id}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('link-url-${arch.id}').focus()}">
            <input type="text" placeholder="URL (https://...)" id="link-url-${arch.id}" onkeydown="if(event.key==='Enter')saveNewLink('${arch.id}')">
            <button class="add-link-save" onclick="saveNewLink('${arch.id}')">Add</button>
            <button class="add-link-cancel" onclick="hideAddLinkForm('${arch.id}')">Cancel</button>
          </div>
        </div>
      </div>`;
    timeline.appendChild(group);
  });

  // Hide orphan era separators
  const children = [...timeline.children];
  for (let i = children.length - 1; i >= 0; i--) {
    if (children[i].classList.contains('era-separator')) {
      const next = children[i + 1];
      if (!next || next.classList.contains('era-separator')) children[i].style.display = 'none';
    }
  }

  perfEnd('render');

  // Apply current filters after rendering
  applyFilters();
}

// ════════════════════════════════════════
// GPU RENDER
// ════════════════════════════════════════
function renderGpu(timeline, data) {
  let animIndex = 0;
  data.forEach(entry => {
    if (entry.era) {
      const sep = document.createElement('div');
      sep.className = 'era-separator';
      sep.innerHTML = `<span class="era-label">${entry.era}</span><div class="era-line"></div>`;
      timeline.appendChild(sep);
      return;
    }
    const arch = entry;
    const specs = arch.gpuSpecs;

    const isExpanded = expandedGroups.has(arch.id);
    const group = document.createElement('div');
    group.className = `arch-group${isExpanded ? ' expanded' : ''}`;
    group.style.setProperty('--arch-color', arch.color);
    group.dataset.id = arch.id;
    group.style.animationDelay = `${animIndex * 0.04}s`;
    animIndex++;

    // Store filter metadata for CSS-based filtering
    const gpuSegment = gpuSegmentOf(arch); // datacenter | workstation | consumer | mobile
    // Mirrors CPU_SEARCH_FIELDS: name plus the fields people search by, including
    // form factor (OAM / PCIe), TBP and bandwidth, which were previously unindexed.
    const modelText = specs.models.map(m =>
      [m.name, m.arch, m.process, m.mem, m.memType, m.form, m.tbp, m.bw, m.pcie]
        .filter(Boolean).join(' '));
    const searchText = [arch.arch, arch.subtitle || '', specs.family, specs.desc, ...modelText].join('|').toLowerCase();

    group.dataset.gpuSegment = gpuSegment;
    group.dataset.searchText = searchText;

    group.innerHTML = `
      <div class="arch-header" onclick="toggleGroup('${arch.id}')" role="button" tabindex="0" aria-expanded="${isExpanded}" aria-label="${escHtml(arch.arch)}, ${arch.year}">
        <div class="timeline-dot"></div>
        <span class="arch-name">${arch.arch}</span>
        <span class="arch-year">${arch.year}</span>
        <span class="arch-segment-badge ${gpuSegment === 'consumer' ? 'client-badge' : (gpuSegment === 'workstation' || gpuSegment === 'mobile') ? 'workstation-badge' : 'server-badge'}">${gpuSegment.charAt(0).toUpperCase() + gpuSegment.slice(1)}</span>
        <span class="expand-icon">▾</span>
        ${arch.subtitle ? `<div class="arch-subtitle">${arch.subtitle.replace(/ · /g, '<span class="sub-sep">·</span>')}</div>` : ''}
      </div>
      <div class="arch-body">
        <div class="gpu-family-desc">${specs.desc}</div>
        <div class="gpu-spec-overflow">
          <table class="gpu-spec-table">
            <thead>
              <tr>
                ${specs.consumer
                  ? '<th>Model</th><th>CUs</th><th>SPs</th><th>Boost</th><th>Game Clock</th><th>VRAM</th><th>Type</th><th>Bus</th><th>Bandwidth</th><th>Cache</th><th>FP32</th><th>TBP</th>'
                  : specs.workstation
                  ? '<th>Model</th><th>CUs</th><th>SPs</th><th>Boost</th><th>VRAM</th><th>Type</th><th>Bus</th><th>Bandwidth</th><th>Cache</th><th>FP32</th><th>FP64</th><th>TBP</th>'
                  : '<th>Model</th><th>Form</th><th>Architecture</th><th>Process</th><th>CUs</th><th>Memory</th><th>Type</th><th>Bandwidth</th><th>FP32</th><th>FP32 Matrix</th><th>PCIe</th><th>TBP</th>'
                }
              </tr>
            </thead>
            <tbody>
              ${specs.consumer
                ? specs.models.map(m => `
                <tr>
                  <td class="gpu-model-name">${m.name}</td>
                  <td>${m.cu}</td>
                  <td>${m.sp}</td>
                  <td class="gpu-val-highlight">${m.boost}</td>
                  <td>${m.game}</td>
                  <td class="gpu-val-highlight">${m.mem}</td>
                  <td>${m.memType}</td>
                  <td>${m.bus}</td>
                  <td>${m.bw}</td>
                  <td>${m.cache}</td>
                  <td class="gpu-val-highlight">${m.fp32}</td>
                  <td>${m.tbp}</td>
                </tr>
              `).join('')
                : specs.workstation
                ? specs.models.map(m => `
                <tr>
                  <td class="gpu-model-name">${m.name}</td>
                  <td>${m.cu}</td>
                  <td>${m.sp}</td>
                  <td class="gpu-val-highlight">${m.boost}</td>
                  <td class="gpu-val-highlight">${m.mem}</td>
                  <td>${m.memType}</td>
                  <td>${m.bus}</td>
                  <td>${m.bw}</td>
                  <td>${m.cache}</td>
                  <td class="gpu-val-highlight">${m.fp32}</td>
                  <td>${m.fp64}</td>
                  <td>${m.tbp}</td>
                </tr>
              `).join('')
                : specs.models.map(m => `
                <tr>
                  <td class="gpu-model-name">${m.name}</td>
                  <td class="gpu-form-cell">${m.form || '—'}</td>
                  <td>${m.arch}</td>
                  <td>${m.process}</td>
                  <td>${m.cu}</td>
                  <td class="gpu-val-highlight">${m.mem}</td>
                  <td>${m.memType}</td>
                  <td>${m.bw}</td>
                  <td class="gpu-val-highlight">${m.fp32}</td>
                  <td>${m.fp32m}</td>
                  <td>${m.pcie}</td>
                  <td>${m.tbp}</td>
                </tr>
              `).join('')
              }
            </tbody>
          </table>
        </div>
        <div class="links-area">
          <div class="links-header">
            <span class="links-label">Links</span>
            <button class="add-link-btn" onclick="showAddLinkForm('${arch.id}')">+ Add Link</button>
          </div>
          <div class="links-list">
            ${getLinks(arch).map((lnk, idx) => `
              <div class="link-item">
                <span class="link-icon">↗</span>
                <span class="link-label-text">${escHtml(lnk.label)}</span>
                <a href="${escHtml(lnk.url)}" target="_blank" rel="noopener">${escHtml(lnk.url)}</a>
                <button class="link-remove-btn" onclick="removeLink('${arch.id}', ${idx})" title="Remove">✕</button>
              </div>
            `).join('')}
            ${getLinks(arch).length === 0 ? '<div class="link-empty">No links yet</div>' : ''}
          </div>
          <div class="add-link-form" id="add-link-form-${arch.id}">
            <input type="text" placeholder="Label" id="link-label-${arch.id}" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('link-url-${arch.id}').focus()}">
            <input type="text" placeholder="URL (https://...)" id="link-url-${arch.id}" onkeydown="if(event.key==='Enter')saveNewLink('${arch.id}')">
            <button class="add-link-save" onclick="saveNewLink('${arch.id}')">Add</button>
            <button class="add-link-cancel" onclick="hideAddLinkForm('${arch.id}')">Cancel</button>
          </div>
        </div>
      </div>`;
    timeline.appendChild(group);
  });

  // Hide orphan era separators
  const children = [...timeline.children];
  for (let i = children.length - 1; i >= 0; i--) {
    if (children[i].classList.contains('era-separator')) {
      const next = children[i + 1];
      if (!next || next.classList.contains('era-separator')) children[i].style.display = 'none';
    }
  }
}

// ════════════════════════════════════════
// CSS-BASED FILTERING
// ════════════════════════════════════════
function applyFilters() {
  perfStart('applyFilters');

  const timeline = dom.timeline;
  const searchTerm = dom.searchInput.value.toLowerCase();
  const cfg = VENDOR_CONFIG[currentVendor];
  const isGpu = currentTechTab === 'gpu' && cfg.gpuData;

  const groups = timeline.querySelectorAll('.arch-group');

  groups.forEach(group => {
    let visible = true;

    if (isGpu) {
      // GPU filtering
      const gpuSegment = group.dataset.gpuSegment;
      const searchText = group.dataset.searchText;

      // Segment filter (multi-select: empty set = show all)
      if (activeGpuSegments.size > 0 && !activeGpuSegments.has(gpuSegment)) {
        visible = false;
      }


      // Search filter
      if (visible && searchTerm && !searchText.includes(searchTerm)) {
        visible = false;
      }
    } else {
      // CPU filtering
      const segments = group.dataset.segments ? group.dataset.segments.split(',') : [];
      const brands = group.dataset.brands ? group.dataset.brands.split(',') : [];
      const searchText = group.dataset.searchText;

      // Segment filter
      if (activeSegmentTags.size > 0) {
        const hasMatchingSegment = segments.some(seg => activeSegmentTags.has(seg));
        if (!hasMatchingSegment) visible = false;
      }

      // Brand filter
      if (visible && activeBrandTags.size > 0) {
        const hasMatchingBrand = brands.some(brand => activeBrandTags.has(brand));
        if (!hasMatchingBrand) visible = false;
      }

      // Search filter
      if (visible && searchTerm) {
        // First check pre-built searchText
        let found = searchText.includes(searchTerm);

        // If not found, also search within CPU spec table data
        if (!found) {
          const specsSource = (currentVendor === 'amd' && AMD_CPU_SPECS) ? AMD_CPU_SPECS : (currentVendor === 'intel' && INTEL_CPU_SPECS) ? INTEL_CPU_SPECS : null;
          if (specsSource) {
            const skuCards = group.querySelectorAll('.sku-card');
            for (const skuCard of skuCards) {
              const skuName = skuCard.dataset.skuName;
              if (skuName && specsSource[skuName]) {
                const cpuModels = specsSource[skuName];
                if (cpuModels.some(m => cpuModelMatches(m, searchTerm))) {
                  found = true;
                  break;
                }
              }
            }
          }
        }

        if (!found) visible = false;
      }
    }

    group.classList.toggle('hidden', !visible);

    // Filter individual SKU cards within visible groups
    if (visible && !isGpu) {
      const skuCards = group.querySelectorAll('.sku-card');
      let hasVisibleSku = false;

      skuCards.forEach(card => {
        let skuVisible = true;
        const skuTags = card.dataset.skuTags ? card.dataset.skuTags.split(',') : [];
        const skuBrand = card.dataset.skuBrand;

        // Segment filter for SKU cards
        if (activeSegmentTags.size > 0) {
          const hasMatchingTag = skuTags.some(tag => activeSegmentTags.has(tag));
          if (!hasMatchingTag) skuVisible = false;
        }

        // Brand filter for SKU cards
        if (skuVisible && activeBrandTags.size > 0) {
          if (!activeBrandTags.has(skuBrand)) skuVisible = false;
        }

        // Search filter for SKU cards
        if (skuVisible && searchTerm) {
          const cardText = card.textContent.toLowerCase();
          let found = cardText.includes(searchTerm);

          // If not found, also check CPU spec table data
          if (!found) {
            const specsSource = (currentVendor === 'amd' && AMD_CPU_SPECS) ? AMD_CPU_SPECS : (currentVendor === 'intel' && INTEL_CPU_SPECS) ? INTEL_CPU_SPECS : null;
            if (specsSource) {
              const skuName = card.dataset.skuName;
              if (skuName && specsSource[skuName]) {
                const cpuModels = specsSource[skuName];
                found = cpuModels.some(m => cpuModelMatches(m, searchTerm));
              }
            }
          }

          if (!found) skuVisible = false;
        }

        card.classList.toggle('hidden', !skuVisible);

        // Also hide/show the associated spec wrapper
        const specWrapper = card.nextElementSibling;
        if (specWrapper && specWrapper.classList.contains('cpu-spec-wrapper')) {
          if (!skuVisible) {
            specWrapper.classList.remove('open');
            specWrapper.classList.add('hidden');
            card.classList.remove('selected');
          } else {
            specWrapper.classList.remove('hidden');
          }
        }

        if (skuVisible) hasVisibleSku = true;
      });

      // Hide the entire group if no SKU cards are visible
      if (!hasVisibleSku) {
        group.classList.add('hidden');
      }
    }
  });

  // Hide orphan era separators
  const children = [...timeline.children];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.classList.contains('era-separator')) {
      // Check if next sibling is visible
      let hasVisibleNext = false;
      for (let j = i + 1; j < children.length; j++) {
        if (children[j].classList.contains('era-separator')) break;
        if (!children[j].classList.contains('hidden')) {
          hasVisibleNext = true;
          break;
        }
      }
      child.classList.toggle('hidden', !hasVisibleNext);
    }
  }

  // Highlight matching rows in CPU spec tables
  highlightSearchMatches(searchTerm);

  announceFilterResults();

  perfEnd('applyFilters');
}

/**
 * Announces the visible result count to screen readers.
 *
 * Sighted users see filtering happen instantly; without this a screen-reader user gets
 * no feedback that anything changed. Writes to a single small aria-live node -- keeping
 * it small matters, since the browser watches that node for changes.
 */
function announceFilterResults() {
  if (!dom.filterStatus) return;
  const groups = dom.timeline.querySelectorAll('.arch-group:not(.hidden)').length;
  const label = currentTechTab === 'gpu' ? 'GPU families' : 'architectures';
  dom.filterStatus.textContent = `${groups} ${label} shown`;
}

// Highlight CPU spec table rows that match the search term
function highlightSearchMatches(searchTerm) {
  // Clear all existing search highlights (but preserve manual selections)
  document.querySelectorAll('.cpu-spec-table tbody tr, .gpu-spec-table tbody tr').forEach(row => {
    row.classList.remove('search-match');
  });

  // If no search term, we're done
  if (!searchTerm) return;

  // Highlight matching rows across CPU and GPU spec tables. Matches on the whole row,
  // not just the model name, so a search like "sp5" or "oam" highlights the rows whose
  // socket / form-factor cell matched -- consistent with what the search now indexes.
  document.querySelectorAll('.cpu-spec-table tbody tr, .gpu-spec-table tbody tr').forEach(row => {
    if (row.textContent.toLowerCase().includes(searchTerm)) {
      // Only add the amber highlight if the row isn't manually selected (green)
      if (!row.classList.contains('row-selected')) {
        row.classList.add('search-match');
      }
    }
  });
}

/**
 * Makes every role="button" element activate on Enter/Space, the way a real <button>
 * does. Uses ONE delegated listener rather than binding to each of the ~54 headers and
 * cards, so this costs nothing as the dataset grows.
 *
 * Space is preventDefault()'d because its default action is to scroll the page.
 */
function setupKeyboardHandlers() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const target = e.target.closest('[role="button"][tabindex]');
    if (!target) return;
    e.preventDefault();
    target.click();   // reuse the existing onclick path -- no duplicated logic
  });
}

/** Keeps aria-expanded truthful after a toggle, so screen readers track open/closed. */
function syncExpanded(el, isOpen) {
  if (el) el.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// Handle row selection in CPU spec tables
function setupRowSelectionHandlers() {
  // Use event delegation on document for dynamically added tables
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.cpu-spec-table tbody tr');

    // If click is outside table AND on safe areas (timeline/container), clear selections
    if (!row && !e.target.closest('.cpu-spec-table')) {
      // Only clear if clicking on container or timeline (not buttons/controls)
      const clickedOnSafeArea = e.target.matches('.container, .timeline, .arch-group, .bg-grid') ||
                                 e.target.closest('.timeline, .arch-group');
      if (clickedOnSafeArea) {
        clearAllSelections();
      }
      return;
    }

    if (!row) return;

    // Toggle selection on click
    if (e.shiftKey) {
      // Shift+click: add to selection without deselecting others
      row.classList.add('row-selected');
      row.classList.remove('search-match'); // Remove yellow if present
    } else {
      // Normal click: toggle this row
      if (row.classList.contains('row-selected')) {
        row.classList.remove('row-selected');
      } else {
        row.classList.add('row-selected');
        row.classList.remove('search-match'); // Remove yellow if present
      }
    }
  });
}

// Clear all row selections
function clearAllSelections() {
  document.querySelectorAll('.cpu-spec-table tbody tr.row-selected').forEach(row => {
    row.classList.remove('row-selected');
  });
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function toggleGroup(id) {
  expandedGroups.has(id) ? expandedGroups.delete(id) : expandedGroups.add(id);
  const group = document.querySelector(`[data-id="${id}"]`);
  group?.classList.toggle('expanded');
  syncExpanded(group?.querySelector('.arch-header'), expandedGroups.has(id));
}
function toggleCpuSpecs(specId) {
  const wrapper = document.getElementById('cpu-spec-' + specId);
  if (wrapper) {
    const isOpening = !wrapper.classList.contains('open');
    const card = wrapper.previousElementSibling;
    const group = wrapper.closest('.arch-group');

    if (!group) return;

    // Get the skus-grid container
    const grid = group.querySelector('.skus-grid');
    if (!grid) return;

    // Toggle the spec wrapper first
    wrapper.classList.toggle('open');
    const isNowOpen = wrapper.classList.contains('open');

    // Update the clicked card
    if (card) {
      const toggle = card.querySelector('.sku-spec-toggle');
      if (toggle) toggle.textContent = isNowOpen ? '▴ Specs' : '▾ Specs';
      card.classList.toggle('selected', isNowOpen);
      syncExpanded(card, isNowOpen);
    }

    // Recalculate order for ALL open spec tables in this group
    const allCards = Array.from(grid.querySelectorAll('.sku-card'));
    const openWrappers = Array.from(grid.querySelectorAll('.cpu-spec-wrapper.open'));

    openWrappers.forEach(w => {
      const wCard = w.previousElementSibling;
      if (!wCard) return;

      const cardIndex = allCards.indexOf(wCard);
      if (cardIndex === -1) return;

      // Get grid column count from computed style
      const gridStyle = window.getComputedStyle(grid);
      const gridCols = gridStyle.gridTemplateColumns.split(' ').length;

      // Calculate which row this card is in
      const cardRow = Math.floor(cardIndex / gridCols);

      // Place spec table at end of the card's row
      const lastCardInRow = (cardRow + 1) * gridCols - 1;
      const orderValue = lastCardInRow * 2 + 1;

      w.style.setProperty('--spec-order', orderValue);
    });

    // Show/hide the collapse button for this arch-group
    updateCollapseBtn(group);
  }
}
function collapseAllSpecs(archId) {
  const group = document.querySelector(`[data-id="${archId}"]`);
  if (!group) return;
  // Clear all selected states
  group.querySelectorAll('.sku-card.selected').forEach(c => c.classList.remove('selected'));
  group.querySelectorAll('.cpu-spec-wrapper.open').forEach(w => {
    w.classList.remove('open');
    const card = w.previousElementSibling;
    if (card) {
      const toggle = card.querySelector('.sku-spec-toggle');
      if (toggle) toggle.textContent = '▾ Specs';
      syncExpanded(card, false);
    }
  });
  updateCollapseBtn(group);
}
function updateCollapseBtn(group) {
  const btn = group.querySelector('.collapse-specs-btn');
  if (!btn) return;
  const hasOpen = group.querySelector('.cpu-spec-wrapper.open');
  btn.classList.toggle('visible', !!hasOpen);
}
/**
 * P-core / E-core count for a model.
 *
 * Returns the stored value when the source supplied one -- including a legitimate
 * "0", which is meaningful (Sierra Forest is 0 P-cores; a Xeon 6900P is 0 E-cores).
 *
 * When the record carries NEITHER field, returns an em dash. Do not be tempted to
 * infer the split from the total core count: an earlier version assumed "no hybrid
 * data means all P-cores", which reported the 288-E-core Xeon 6780E as 288 P-cores
 * and every hybrid Core part as all-P. Unknown must look unknown.
 *
 * @param {Object} m - CPU model record
 * @param {'p'|'e'} which - which core type to report
 * @returns {string} the count, or '—' when the data doesn't say
 */
/**
 * Does this SKU's model list carry P/E core data?
 *
 * The hybrid split is an Intel concept -- AMD parts have neither, so showing the
 * columns there would mean two dashes on every row. Decided per spec table from the
 * data itself rather than per vendor, so an Intel family without the fields also
 * hides them instead of rendering an empty pair.
 *
 * @param {Array<Object>} models - the spec rows for one SKU
 */
function hasHybridCores(models) {
  return models.some(m => m.pc !== undefined || m.ec !== undefined);
}

/** Render a missing/empty value as an em dash rather than 'undefined'. */
function dash(v) {
  return (v === undefined || v === null || v === '') ? '\u2014' : v;
}

function coreCount(m, which) {
  const v = which === 'p' ? m.pc : m.ec;
  return (v === undefined || v === '') ? '\u2014' : String(v);
}

/**
 * Socket scalability, normalised to the "1P / 2P" style AMD rows already use.
 * Intel's export gives a bare count ('1', '2') or ARK's '2S'.
 */
function socketCount(m) {
  const v = String(m.skc ?? '').trim();
  if (!v) return '—';
  if (/[PS]/i.test(v)) return v.replace(/S\b/gi, 'P');   // '2S' -> '2P'
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return v;
  return n <= 1 ? '1P' : Array.from({ length: n }, (_, i) => `${i + 1}P`).join(' / ');
}

/**
 * Memory speed with channel count appended, e.g. 'DDR5-6400 / 12ch'.
 *
 * Guards against double-appending: the ARK converter already folds channels into the
 * Memory string, so appending `mc` again would render '... / 12ch / 12ch'.
 */
function memWithChannels(m) {
  const mem = m.mem || '—';
  if (!m.mc || /\/\s*\d+\s*ch/i.test(mem)) return mem;
  return `${mem} / ${m.mc}ch`;
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function getLinks(arch) {
  try { const s = localStorage.getItem(`roadmap-links-${currentVendor}-${arch.id}`); if (s !== null) return JSON.parse(s); } catch(e) {}
  return arch.defaultLinks || [];
}
function saveLinks(id, links) { try { localStorage.setItem(`roadmap-links-${currentVendor}-${id}`, JSON.stringify(links)); } catch(e) {} }
function showAddLinkForm(id) { document.getElementById(`add-link-form-${id}`).classList.add('visible'); document.getElementById(`link-label-${id}`).focus(); }
function hideAddLinkForm(id) { document.getElementById(`add-link-form-${id}`).classList.remove('visible'); document.getElementById(`link-label-${id}`).value = ''; document.getElementById(`link-url-${id}`).value = ''; }
function getActiveData() {
  const cfg = VENDOR_CONFIG[currentVendor];
  return (currentTechTab === 'gpu' && cfg.gpuData) ? cfg.gpuData : cfg.data;
}
function saveNewLink(id) {
  let label = document.getElementById(`link-label-${id}`).value.trim();
  let url = document.getElementById(`link-url-${id}`).value.trim();
  if (!url) return;
  if (!label) label = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  if (!/^https?:\/\//.test(url)) url = 'https://' + url;
  const arch = getActiveData().find(a => a.id === id);
  const links = getLinks(arch); links.push({ label, url }); saveLinks(id, links);
  hideAddLinkForm(id); expandedGroups.add(id); render();
}
function removeLink(id, idx) {
  const arch = getActiveData().find(a => a.id === id);
  const links = getLinks(arch); links.splice(idx, 1); saveLinks(id, links);
  expandedGroups.add(id); render();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CORE-RANGE SLIDER  —  shared by both renderers
// ═══════════════════════════════════════════════════════════════════════════
// A dual-knob range control plus typed min/max inputs, used on every tab that
// has core-count data: AMD EPYC, AMD Ryzen, Intel Xeon. NOT the GPU tabs.
//
// Two decisions worth knowing:
//
// 1. THE TRACK SNAPS TO REAL VALUES, it is not linear. EPYC ships 20 distinct
//    core counts between 8 and 256, and 12 of them are at or below 32 -- on a
//    linear axis they would pile into the first quarter while a third of the
//    track sat empty between 192 and 256. Each real value gets equal width
//    instead, so every stop is reachable.
//
// 2. STOPS ARE DERIVED FROM THE LOADED DATA, never hardcoded. A tab with fewer
//    than two distinct values renders no slider at all, which is why Intel
//    Client shows none today and will grow one automatically when its spec
//    import lands. (Golden rule #1: read it, don't type it.)
//
// A family matches when ANY of its models falls in range -- Turin ships 8C
// through 128C, so it survives most ranges. Same "a codename spans a range"
// logic as the product-series nesting.

/**
 * Total cores for one model record.
 *
 * AMD stores a single `c`. Intel Xeon stores no total at all -- only `pc` and
 * `ec` -- so it is summed. Reading `c` alone would report every one of the 553
 * Xeon models as having no core count.
 *
 * @returns {number|null} total cores, or null when the record doesn't say
 */
function coreTotal(m) {
  if (String(m.c ?? '').match(/^\d+$/)) return parseInt(m.c, 10);
  const p = String(m.pc ?? '').match(/^\d+$/) ? parseInt(m.pc, 10) : 0;
  const e = String(m.ec ?? '').match(/^\d+$/) ? parseInt(m.ec, 10) : 0;
  return (p + e) > 0 ? p + e : null;
}

/** Sorted distinct core counts across a list of model records. */
function coreStops(models) {
  const s = new Set();
  models.forEach(m => { const t = coreTotal(m); if (t !== null) s.add(t); });
  return [...s].sort((a, b) => a - b);
}

/**
 * Fresh slider state for a set of stops. `lo`/`hi` are INDICES into `stops`,
 * so the control is always positioned on a real value.
 */
function coreRangeInit(stops) {
  return { stops, lo: 0, hi: Math.max(0, stops.length - 1) };
}

/** True when the range is wide open, i.e. imposing no constraint. */
function coreRangeIsAll(st) {
  return !st || !st.stops.length || (st.lo === 0 && st.hi === st.stops.length - 1);
}

/** Does a family's [min,max] core span intersect the selected range? */
function coreRangeMatch(st, cmin, cmax) {
  if (coreRangeIsAll(st)) return true;
  if (cmin === null || cmax === null) return false;   // no data => no match
  return cmax >= st.stops[st.lo] && cmin <= st.stops[st.hi];
}

/** Markup for the control. `id` namespaces the element ids per renderer. */
function coreRangeHtml(id, st) {
  if (!st || st.stops.length < 2) return '';
  const lo = st.stops[st.lo], hi = st.stops[st.hi];
  const ticks = st.stops.map((v, i) =>
    `<div class="crt" style="left:${i / (st.stops.length - 1) * 100}%"></div>`).join('');
  return `
    <div class="fgroup core-range" id="${id}">
      <span class="fgroup-label">Core count</span>
      <div class="cr-nums">
        <div class="cr-numwrap">
          <input class="cr-num" id="${id}-min" inputmode="numeric" value="${lo}"
                 aria-label="Minimum core count">
          <div class="cr-nlab">min</div>
        </div>
        <span class="cr-dash">–</span>
        <div class="cr-numwrap">
          <input class="cr-num" id="${id}-max" inputmode="numeric" value="${hi}"
                 aria-label="Maximum core count">
          <div class="cr-nlab">max</div>
        </div>
      </div>
      <div class="cr-track" id="${id}-track">
        <div class="cr-ticks">${ticks}</div>
        <div class="cr-fill" id="${id}-fill"></div>
        <div class="cr-knob" id="${id}-klo" data-end="lo" role="slider" tabindex="0"
             aria-label="Minimum cores" aria-valuemin="${st.stops[0]}"
             aria-valuemax="${st.stops[st.stops.length - 1]}" aria-valuenow="${lo}"></div>
        <div class="cr-knob" id="${id}-khi" data-end="hi" role="slider" tabindex="0"
             aria-label="Maximum cores" aria-valuemin="${st.stops[0]}"
             aria-valuemax="${st.stops[st.stops.length - 1]}" aria-valuenow="${hi}"></div>
      </div>
      <div class="cr-ends"><span>${st.stops[0]}</span><span>${st.stops[st.stops.length - 1]}</span></div>
      <div class="cr-presets" id="${id}-presets"></div>
    </div>`;
}

/** Repaint knobs, fill, inputs and preset states from `st`. */
function coreRangePaint(id, st) {
  const root = document.getElementById(id);
  if (!root || !st || st.stops.length < 2) return;
  const last = st.stops.length - 1;
  const pl = st.lo / last * 100, ph = st.hi / last * 100;
  const fill = document.getElementById(id + '-fill');
  const klo = document.getElementById(id + '-klo');
  const khi = document.getElementById(id + '-khi');
  if (fill) { fill.style.left = pl + '%'; fill.style.right = (100 - ph) + '%'; }
  if (klo) { klo.style.left = pl + '%'; klo.setAttribute('aria-valuenow', st.stops[st.lo]); }
  if (khi) { khi.style.left = ph + '%'; khi.setAttribute('aria-valuenow', st.stops[st.hi]); }
  const mn = document.getElementById(id + '-min');
  const mx = document.getElementById(id + '-max');
  // Don't fight the user mid-type.
  if (mn && document.activeElement !== mn) mn.value = st.stops[st.lo];
  if (mx && document.activeElement !== mx) mx.value = st.stops[st.hi];
  root.classList.toggle('cr-active', !coreRangeIsAll(st));
  root.querySelectorAll('.cr-pre').forEach(b => {
    const [a, z] = b.dataset.range.split(':').map(Number);
    b.classList.toggle('on', st.stops[st.lo] === a && st.stops[st.hi] === z);
  });
}

/**
 * Wire drag, keyboard, typed inputs and presets. `onChange` runs after any
 * change and should call the renderer's applyFilters.
 */
function coreRangeWire(id, st, onChange) {
  const root = document.getElementById(id);
  if (!root || !st || st.stops.length < 2) return;
  const last = st.stops.length - 1;
  const track = document.getElementById(id + '-track');

  const nearest = clientX => {
    const r = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round(pct * last);
  };
  const setEnd = (end, idx) => {
    idx = Math.min(last, Math.max(0, idx));
    if (end === 'lo') st.lo = Math.min(idx, st.hi);
    else st.hi = Math.max(idx, st.lo);
    coreRangePaint(id, st);
    onChange();
  };

  let drag = null;
  const move = e => {
    if (!drag) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setEnd(drag, nearest(x));
  };
  const up = () => {
    drag = null;
    document.removeEventListener('mousemove', move);
    document.removeEventListener('touchmove', move);
  };
  ['klo', 'khi'].forEach(k => {
    const el = document.getElementById(id + '-' + k);
    const start = e => {
      drag = el.dataset.end;
      document.addEventListener('mousemove', move);
      document.addEventListener('touchmove', move, { passive: true });
      document.addEventListener('mouseup', up, { once: true });
      document.addEventListener('touchend', up, { once: true });
      e.preventDefault();
    };
    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('keydown', e => {
      const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1
              : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0;
      if (!d) return;
      e.preventDefault();
      setEnd(el.dataset.end, (el.dataset.end === 'lo' ? st.lo : st.hi) + d);
    });
  });

  // Click anywhere on the track moves the nearer knob.
  track.addEventListener('mousedown', e => {
    if (e.target.classList.contains('cr-knob')) return;
    const idx = nearest(e.clientX);
    setEnd(Math.abs(idx - st.lo) <= Math.abs(idx - st.hi) ? 'lo' : 'hi', idx);
  });

  // Typed values snap to the closest real stop, so a request like "at least
  // 96 cores" lands on 96 rather than an interpolated position.
  const snap = v => {
    let best = 0;
    st.stops.forEach((s, i) => {
      if (Math.abs(s - v) < Math.abs(st.stops[best] - v)) best = i;
    });
    return best;
  };
  const commit = (el, end) => {
    const v = parseInt(el.value, 10);
    if (!Number.isFinite(v)) { coreRangePaint(id, st); return; }
    setEnd(end, snap(v));
  };
  ['min', 'max'].forEach(which => {
    const el = document.getElementById(id + '-' + which);
    const end = which === 'min' ? 'lo' : 'hi';
    el.addEventListener('change', () => commit(el, end));
    el.addEventListener('blur', () => commit(el, end));
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });

  // Presets snap to conventional core boundaries rather than positions on the
  // track. Taking stops at fixed fractions produced labels like "36-112",
  // which are real values but not numbers anyone asks for. These cuts are the
  // familiar ones (32C entry ceiling, 64C mainstream flagship, 128C dense),
  // filtered to those the current tab actually spans.
  const CUTS = [32, 64, 128];
  const lo0 = st.stops[0], hi0 = st.stops[last];
  const cuts = CUTS.filter(c => c > lo0 && c < hi0);
  const presets = [];
  if (cuts.length) {
    presets.push([`≤ ${cuts[0]}`, lo0, cuts[0]]);
    for (let i = 0; i < cuts.length - 1; i++) {
      presets.push([`${cuts[i]}–${cuts[i + 1]}`, cuts[i], cuts[i + 1]]);
    }
    presets.push([`${cuts[cuts.length - 1]}+`, cuts[cuts.length - 1], hi0]);
  }
  presets.push(['All', lo0, hi0]);
  document.getElementById(id + '-presets').innerHTML = presets.map(([lab, a, z]) =>
    `<button class="cr-pre" data-range="${a}:${z}">${escHtml(lab)}</button>`).join('');
  root.querySelectorAll('.cr-pre').forEach(b =>
    b.addEventListener('click', () => {
      const [a, z] = b.dataset.range.split(':').map(Number);
      st.lo = snap(a); st.hi = snap(z);
      coreRangePaint(id, st);
      onChange();
    }));

  coreRangePaint(id, st);
}

/**
 * Product title without the vendor word.
 *
 * The data carries the full name ("AMD EPYC", "Intel Xeon") because it is
 * meaningful on its own, but the header renders beside a pill that already
 * says AMD or Intel -- repeating it wasted the widest line on the page.
 */
function stripVendor(t) {
  return String(t || '').replace(/^(AMD|Intel)\s+/, '');
}

// Init DOM cache and event listeners
initDomCache();

// Narrow screens collapse the filter sidebar behind a disclosure button.
// Above 900px the button is display:none and this listener never fires.
(function wireSidebarToggle() {
  const btn = document.getElementById('sidebarToggle');
  const side = document.getElementById('sidebar');
  if (!btn || !side) return;
  btn.addEventListener('click', () => {
    const open = side.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
setupRowSelectionHandlers();
setupKeyboardHandlers();

// Search (with debouncing for performance)
const debouncedFilter = debounce(applyFilters, 300);
dom.searchInput.addEventListener('input', () => {
  // Toggle clear button visibility
  dom.searchClear.classList.toggle('visible', dom.searchInput.value.length > 0);
  // Intel runs its own filter path; both renderers share this input.
  if (typeof v2IsActive === 'function' && v2IsActive()) { v2SetSearch(dom.searchInput.value); return; }
  if (typeof a2IsActive === 'function' && a2IsActive()) { a2SetSearch(dom.searchInput.value); return; }
  debouncedFilter();
});

// Clear search button
dom.searchClear.addEventListener('click', () => {
  dom.searchInput.value = '';
  dom.searchClear.classList.remove('visible');
  if (typeof v2IsActive === 'function' && v2IsActive()) { v2SetSearch(''); return; }
  if (typeof a2IsActive === 'function' && a2IsActive()) { a2SetSearch(''); return; }
  applyFilters();
});

// Expand/Collapse
dom.expandAllBtn.addEventListener('click', () => {
  if (typeof v2IsActive === 'function' && v2IsActive()) { v2ExpandAll(true); return; }
  if (typeof a2IsActive === 'function' && a2IsActive()) { a2ExpandAll(true); return; }
  const cfg = VENDOR_CONFIG[currentVendor];
  const data = (currentTechTab === 'gpu' && cfg.gpuData) ? cfg.gpuData : cfg.data;
  data.forEach(a => { if (a.id) expandedGroups.add(a.id); }); render();
});
dom.collapseAllBtn.addEventListener('click', () => {
  if (typeof v2IsActive === 'function' && v2IsActive()) { v2ExpandAll(false); return; }
  if (typeof a2IsActive === 'function' && a2IsActive()) { a2ExpandAll(false); return; }
  expandedGroups.clear(); render();
});
dom.clearSelectionsBtn.addEventListener('click', clearAllSelections);

// Init - Load AMD data on startup
switchVendor('amd').catch(error => {
  console.error('Failed to initialize:', error);
  dom.timeline.innerHTML = '<div class="error">Failed to load data. Please refresh the page.</div>';
});

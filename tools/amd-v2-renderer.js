
// ═══════════════════════════════════════════════════════════════════════════
//  RENDERER
// ═══════════════════════════════════════════════════════════════════════════
// Same contract as the Intel renderer and the production page: build the whole
// DOM once, stamp the filter dimensions as data attributes, then filter by
// toggling `.hidden`. Never re-render on a keystroke.

let a2Tab = 'epyc';
const a2Expanded = new Set();
const a2Active = {};             // { filterKey: Set(tag) } — empty set = no constraint
let a2Search = '';
let a2Specs = { cpu: null, gpu: null };
let a2Core = null;   // core-range state for the active tab, null on GPU

const a2Slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Spec rows for one card.
 *
 * CPU tabs read amd-cpu-specs.json keyed by codename; the GPU tab reads the
 * models array out of amd-gpu-data.json. Both are already loaded by
 * script.js — this reuses them rather than re-fetching.
 */
function a2Models(name) {
  if (a2Tab === 'gpu') {
    const fam = (a2Specs.gpu || []).find(e => e.arch === name);
    return (fam && fam.gpuSpecs && fam.gpuSpecs.models) || [];
  }
  return (a2Specs.cpu && a2Specs.cpu[name]) || [];
}

/**
 * Spec-lookup key for a family. GPU cards display the model list but join on
 * `key` (the amd-gpu-data.json `arch` value); CPU cards use the codename for
 * both. Keeping them separate is what lets the GPU card show something other
 * than a copy of its block header.
 */
function a2Key(f) { return f.key || f.name; }

/**
 * A family's tier values, always as an array.
 *
 * EPYC cards carry a LIST — core-count bands, and a codename spans a range
 * (Turin is 8C–128C, so it is in three bands at once). Ryzen and GPU carry a
 * single brand string. Normalising here keeps every caller uniform.
 */
function a2Tiers(f) {
  return Array.isArray(f.tier) ? f.tier : (f.tier ? [f.tier] : []);
}

function a2Count(name) {
  const n = a2Models(name).length;
  return n ? `${n} model${n === 1 ? '' : 's'}` : 'awaiting data';
}

function a2Rows(name, colspan) {
  const models = a2Models(name);
  const fields = A2_FIELDS[a2Tab];
  if (!models.length || !fields) {
    return `<tr class="v2-empty-row"><td colspan="${colspan}">No spec data yet</td></tr>`;
  }
  return models.map(m => '<tr>' + fields.map((f, i) =>
    `<td class="${i === 0 ? 'cpu-model-name' : ''}">${escHtml(m[f] ?? '—')}</td>`
  ).join('') + '</tr>').join('');
}

/**
 * Build the filter sidebar for the active sub-tab.
 *
 * Vertical rail rather than a horizontal bar: the old chip bar cost 278px of
 * vertical space on the Ryzen tab (19 series chips over four rows) before any
 * content. Each option carries a live count, filled in by a2ApplyFilters().
 *
 * A group longer than 10 options scrolls instead of growing without bound.
 */
function a2BuildFilters() {
  const cfg = A2_DATA[a2Tab];
  const bar = dom.filterControls;

  // Keep `controls` -- the responsive collapse rules target it. Assigning
  // className alone would drop it and break the narrow-screen disclosure.
  bar.className = 'controls filter-bar';
  // Core count leads: it is the filter most used in practice, so it gets
  // the top of the rail ahead of the generation/series chips.
  bar.innerHTML = coreRangeHtml('a2core', a2Core) + cfg.filters.map(g => {
    a2Active[g.key] = a2Active[g.key] || new Set();
    const chips = g.tags.map(([tag, color]) => `
      <button class="fchip" data-key="${g.key}" data-tag="${escHtml(tag)}"
              style="--tag-color:${color}" aria-pressed="false">
        <span class="fchip-dot" style="background:${color}"></span>
        <span class="fchip-label">${escHtml(tag)}</span>
        <span class="fchip-n" aria-hidden="true"></span>
      </button>`).join('');
    const scroll = g.tags.length > 10;
    return `<div class="fgroup">
        <span class="fgroup-label">${escHtml(g.label)}</span>
        <div class="${scroll ? 'fgroup-scroll' : ''}">${chips}</div>
      </div>`;
  }).join('')
    + `<button class="fclear" id="a2Clear" hidden>Clear filters</button>`;

  bar.querySelectorAll('.fchip').forEach(chip =>
    chip.addEventListener('click', () => {
      const set = a2Active[chip.dataset.key];
      set.has(chip.dataset.tag) ? set.delete(chip.dataset.tag) : set.add(chip.dataset.tag);
      a2ApplyFilters();
    }));
  coreRangeWire('a2core', a2Core, a2ApplyFilters);

  document.getElementById('a2Clear').addEventListener('click', () => {
    for (const k of Object.keys(a2Active)) a2Active[k].clear();
    if (a2Core) { a2Core.lo = 0; a2Core.hi = a2Core.stops.length - 1; }
    coreRangePaint('a2core', a2Core);
    a2ApplyFilters();
  });
}

/**
 * Rebuild the core-range stops for the active sub-tab.
 *
 * Derived from the models actually loaded, so a tab with no core data (GPU)
 * or fewer than two distinct values renders no slider at all.
 */
function a2BuildCoreRange() {
  if (a2Tab === 'gpu' || !a2Specs.cpu) { a2Core = null; return; }
  const models = [];
  A2_DATA[a2Tab].gens.forEach(g => (g.families || []).forEach(f =>
    models.push(...a2Models(a2Key(f)))));
  const stops = coreStops(models);
  a2Core = stops.length >= 2 ? coreRangeInit(stops) : null;
}

/**
 * How many blocks would match if `tag` were the only selection in its group?
 *
 * Counts against the OTHER groups' current selections, which is what makes the
 * numbers useful: with Brand=Ryzen AI chosen, the Segment counts show what is
 * reachable within that brand rather than the unfiltered totals.
 *
 * Reads the same data attributes as a2ApplyFilters() so the two cannot drift.
 */
function a2CountFor(key, tag) {
  const gens  = key === 'gen'  ? new Set([tag]) : (a2Active.gen  || new Set());
  const tiers = key === 'tier' ? new Set([tag]) : (a2Active.tier || new Set());
  const segs  = key === 'seg'  ? new Set([tag]) : (a2Active.seg  || new Set());
  const q = a2Search.trim().toLowerCase();
  let n = 0;
  document.querySelectorAll('.arch-group').forEach(group => {
    if (gens.size && !gens.has(group.dataset.gen)) return;
    const hit = [...group.querySelectorAll('.sku-card')].some(card =>
      a2CoreOk(card) &&
      (!tiers.size || a2CardTiers(card).some(t => tiers.has(t))) &&
      (!segs.size  || segs.has(card.dataset.seg))  &&
      (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q)
          || a2SpecMatch(card.dataset.target, q)));
    if (hit) n++;
  });
  return n;
}

/** Era divider — same role as the Intel tab's branding separators. */
function a2Era(e) {
  return `
  <div class="v2-era" data-era="1">
    <div class="v2-era-label">${escHtml(e.era)}</div>
    <div class="v2-era-note">${escHtml(e.eraNote)}</div>
  </div>`;
}

/** One product-series block: header plus its grid of codename cards. */
function a2Gen(g, cfg) {
  const tiers = [...new Set(g.families.flatMap(a2Tiers))];
  const segs  = [...new Set(g.families.map(f => f.seg).filter(Boolean))];
  const hay   = [g.name, g.note, ...g.families.flatMap(
                    f => [f.name, f.key || '', f.desc, f.si || ''])]
                  .join(' ').toLowerCase();

  // Brand-line display order. Datacenter-leaning tiers lead, per golden rule #2.
  const order = ['Instinct', 'Radeon PRO', 'Radeon',
                 'Performance', 'Density', 'Edge',
                 'Threadripper', 'Ryzen AI Max', 'Ryzen AI', 'Ryzen', 'Z-Series'];
  const groupBy = cfg.brandGroups
    ? order.filter(t => g.families.some(f => a2Tiers(f).includes(t)))
    : [];
  let idx = 0;
  const cards = groupBy.length > 1
    ? groupBy.map(t => {
        const start = idx;
        const rows = g.families.filter(f => a2Tiers(f).includes(t))
                       .map(f => a2Card(f, g, idx++, cfg)).join('');
        return `<div class="v2-brandline" style="--card-order:${start * 4 - 2}">` +
               `<span class="v2-brandline-name">${escHtml(t)}</span>` +
               `<span class="v2-brandline-rule"></span></div>${rows}`;
      }).join('')
    : g.families.map((f, i) => a2Card(f, g, i, cfg)).join('');

  const total = g.families.reduce((s, f) => s + (a2Models(a2Key(f)).length || f.n), 0);
  const mix = groupBy.length > 1
    ? groupBy.map(t => `${g.families.filter(f => a2Tiers(f).includes(t)).length} ${t}`).join(' · ')
    : `${g.families.length} codename${g.families.length === 1 ? '' : 's'}`;

  return `
  <div class="arch-group" id="a2-${g.id}" style="--arch-color:${g.color}"
       data-gen="${escHtml(g.name)}" data-tiers="${escHtml(tiers.join('|'))}"
       data-segs="${escHtml(segs.join('|'))}" data-search="${escHtml(hay)}">
    <div class="arch-header${g.unreleased ? ' unreleased-arch' : ''}" data-gen="${g.id}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="timeline-dot"></div>
      <div class="arch-name">${escHtml(g.name)}</div>
      <div class="arch-year">${escHtml(g.years)}</div>
      <div class="v2-count">${escHtml(mix)}
        <span class="v2-count-dim">· ${total} models</span></div>
      ${g.unreleased ? '<span class="unreleased-badge">unreleased</span>' : ''}
      <div class="expand-icon">⌄</div>
      <div class="arch-subtitle">${escHtml(g.note)}</div>
    </div>
    <div class="arch-body"><div class="skus-grid">${cards}</div></div>
  </div>`;
}

/** One codename card plus its spec table. */
function a2Card(f, g, i, cfg) {
  const id = `a2t-${g.id}-${a2Slug(f.name)}`;
  const cols = A2_COLUMNS[a2Tab];
  const tags = [...a2Tiers(f), f.seg].filter(Boolean).map(t =>
    `<span class="sku-tag">${escHtml(t)}</span>`).join('');

  return `
    <div class="sku-card has-specs" style="--card-order:${i * 4}"
         data-target="${id}" data-tier="${escHtml(a2Tiers(f).join('|'))}" data-seg="${escHtml(f.seg)}"
         data-cmin="${f.cmin ?? ''}" data-cmax="${f.cmax ?? ''}"
         data-search="${escHtml((f.name + ' ' + (f.key || '') + ' ' + f.desc + ' ' + (f.si || '')).toLowerCase())}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="sku-spec-toggle">specs ▾</div>
      <div class="sku-name">${escHtml(f.name)}</div>
      <div class="sku-desc">${escHtml(f.desc)}</div>
      ${f.si ? `<div class="v2-silicon">${escHtml(f.si)}</div>` : ''}
      <div class="sku-tags">${tags}</div>
    </div>
    <div class="cpu-spec-wrapper" id="${id}" style="--spec-order:${i * 4 + 1}">
      <div class="cpu-spec-overflow">
        <div class="cpu-spec-header">
          <span class="cpu-spec-header-title">${escHtml(f.name)}</span>
          <span class="cpu-spec-header-title v2-await">${a2Count(a2Key(f))}</span>
        </div>
        <table class="cpu-spec-table">
          <thead><tr>${cols.map(c => `<th>${escHtml(c)}</th>`).join('')}</tr></thead>
          <tbody>${a2Rows(a2Key(f), cols.length)}</tbody>
        </table>
      </div>
    </div>`;
}

function a2Render() {
  const cfg = A2_DATA[a2Tab];
  dom.pageHeader.innerHTML =
    `<h1 class="header-amd">${escHtml(stripVendor(cfg.title))}</h1>` +
    `<p>${escHtml(cfg.blurb)}</p>`;

  dom.timeline.innerHTML =
    cfg.gens.map(g => g.era ? a2Era(g) : a2Gen(g, cfg)).join('');

  document.querySelectorAll('.arch-header').forEach(h => {
    h.addEventListener('click', () => a2Toggle(h.dataset.gen));
    h.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a2Toggle(h.dataset.gen); }
    });
  });
  document.querySelectorAll('.sku-card.has-specs').forEach(c => {
    c.addEventListener('click', () => a2ToggleSpecs(c));
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a2ToggleSpecs(c); }
    });
  });

  a2ApplyFilters();
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERACTION
// ═══════════════════════════════════════════════════════════════════════════

function a2Toggle(id) {
  const el = document.getElementById(`a2-${id}`);
  if (!el) return;
  const open = el.classList.toggle('expanded');
  a2Expanded[open ? 'add' : 'delete'](id);
  el.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
}

function a2ToggleSpecs(card) {
  const w = document.getElementById(card.dataset.target);
  const open = w.classList.toggle('open');
  card.classList.toggle('selected', open);
  card.setAttribute('aria-expanded', String(open));
}

function a2ExpandAll(open) {
  document.querySelectorAll('.arch-group').forEach(g => {
    g.classList.toggle('expanded', open);
    g.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
  });
  a2Expanded.clear();
  if (open) A2_DATA[a2Tab].gens.filter(g => !g.era).forEach(g => a2Expanded.add(g.id));
}

// ═══════════════════════════════════════════════════════════════════════════
//  FILTER — reads only the data attributes stamped during render
// ═══════════════════════════════════════════════════════════════════════════

/** Does this card's core span intersect the selected range? */
function a2CoreOk(card) {
  if (coreRangeIsAll(a2Core)) return true;
  const lo = parseInt(card.dataset.cmin, 10);
  const hi = parseInt(card.dataset.cmax, 10);
  return coreRangeMatch(a2Core, Number.isFinite(lo) ? lo : null,
                                Number.isFinite(hi) ? hi : null);
}

/** Tier values stamped on a rendered card. Pipe-joined by a2Card(). */
function a2CardTiers(card) {
  return (card.dataset.tier || '').split('|').filter(Boolean);
}

function a2ApplyFilters() {
  const sel = k => a2Active[k] || new Set();
  const gens = sel('gen'), tiers = sel('tier'), segs = sel('seg');
  const q = a2Search.trim().toLowerCase();
  const any = gens.size || tiers.size || segs.size || !coreRangeIsAll(a2Core);

  document.querySelectorAll('.fchip').forEach(c => {
    const on = sel(c.dataset.key).has(c.dataset.tag);
    const n = a2CountFor(c.dataset.key, c.dataset.tag);
    c.classList.toggle('active', on);
    // Dim an option that would yield nothing given the other groups'
    // selections. Selected options never dim, or the bar flickers as the
    // user works through a combination.
    c.classList.toggle('inactive', !on && n === 0);
    c.setAttribute('aria-pressed', String(on));
    const slot = c.querySelector('.fchip-n');
    if (slot) slot.textContent = n || '';
    const label = (c.querySelector('.fchip-label') || {}).textContent || c.dataset.tag;
    c.setAttribute('aria-label', `${label}, ${n} series`);
  });
  const clear = document.getElementById('a2Clear');
  if (clear) clear.hidden = !any;

  // Narrow screens collapse the sidebar; surface the active count on the button.
  const badge = document.getElementById('sidebarCount');
  if (badge) {
    const total = gens.size + tiers.size + segs.size + (coreRangeIsAll(a2Core) ? 0 : 1);
    badge.textContent = total;
    badge.hidden = total === 0;
  }

  let shownGens = 0, shownCards = 0;

  document.querySelectorAll('.arch-group').forEach(group => {
    const genOk = !gens.size || gens.has(group.dataset.gen);
    let visible = 0;

    group.querySelectorAll('.sku-card').forEach(card => {
      const ok = genOk
        && a2CoreOk(card)
        && (!tiers.size || a2CardTiers(card).some(t => tiers.has(t)))
        && (!segs.size  || segs.has(card.dataset.seg))
        && (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q)
             || a2SpecMatch(card.dataset.target, q));
      card.classList.toggle('hidden', !ok);
      const w = document.getElementById(card.dataset.target);
      if (!ok && w) { w.classList.remove('open'); card.classList.remove('selected'); }
      if (ok) visible++;
    });

    group.querySelectorAll('.v2-brandline').forEach(bl => {
      let live = false;
      for (let n = bl.nextElementSibling; n && !n.classList.contains('v2-brandline');
           n = n.nextElementSibling) {
        if (n.classList.contains('sku-card') && !n.classList.contains('hidden')) {
          live = true; break;
        }
      }
      bl.classList.toggle('hidden', !live);
    });

    group.classList.toggle('hidden', visible === 0);
    if (visible) { shownGens++; shownCards += visible; }
  });

  document.querySelectorAll('.v2-era').forEach(era => {
    let live = false;
    for (let n = era.nextElementSibling; n && !n.classList.contains('v2-era');
         n = n.nextElementSibling) {
      if (n.classList.contains('arch-group') && !n.classList.contains('hidden')) {
        live = true; break;
      }
    }
    era.classList.toggle('hidden', !live);
  });

  a2Highlight(q);

  const st = document.getElementById('a2Status');
  if (st) st.textContent =
    `${shownGens} series · ${shownCards} codename${shownCards === 1 ? '' : 's'}`;
}

/**
 * Does any spec row under this card match the search term?
 *
 * Keeps parity with the production AMD path, where searching `sp5` or a model
 * number reaches into the spec tables rather than only matching card text.
 */
function a2SpecMatch(targetId, q) {
  if (!q) return false;
  const w = document.getElementById(targetId);
  if (!w) return false;
  return w.textContent.toLowerCase().includes(q);
}

/** Amber-highlight matching spec rows, matching the production behaviour. */
function a2Highlight(q) {
  document.querySelectorAll('.cpu-spec-table tbody tr').forEach(r =>
    r.classList.remove('search-match'));
  if (!q) return;
  document.querySelectorAll('.cpu-spec-table tbody tr').forEach(r => {
    if (r.textContent.toLowerCase().includes(q) && !r.classList.contains('row-selected')) {
      r.classList.add('search-match');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

let a2Wired = false;

/** Swap sub-tab: resets filters and rebuilds everything below the tab bar. */
function a2Switch(tab) {
  a2Tab = tab;
  a2Expanded.clear();
  a2Search = '';
  dom.searchInput.value = '';
  for (const k of Object.keys(a2Active)) delete a2Active[k];

  document.querySelectorAll('.a2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  a2BuildCoreRange();
  a2BuildFilters();
  a2Render();
}

/** Take over the shared DOM and render the AMD tab. */
function a2Activate(cpuSpecs, gpuData) {
  a2Specs.cpu = cpuSpecs || a2Specs.cpu;
  a2Specs.gpu = gpuData || a2Specs.gpu;

  document.body.classList.add('amd-v2');
  document.getElementById('a2Subtabs').classList.add('visible');
  document.getElementById('a2Status').hidden = false;
  dom.codenameTableWrap.innerHTML = '';
  dom.techTabs.classList.remove('visible');

  if (!a2Wired) {
    document.querySelectorAll('.a2-subtab').forEach(b =>
      b.addEventListener('click', () => a2Switch(b.dataset.tab)));
    a2Wired = true;
  }

  a2Tab = 'epyc';
  a2Expanded.clear();
  a2Search = '';
  for (const k of Object.keys(a2Active)) delete a2Active[k];
  document.querySelectorAll('.a2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === 'epyc'));

  a2BuildCoreRange();
  a2BuildFilters();
  a2Render();
}

/** Hand the shared DOM back. */
function a2Deactivate() {
  document.body.classList.remove('amd-v2');
  const st = document.getElementById('a2Subtabs');
  if (st) st.classList.remove('visible');
  const s = document.getElementById('a2Status');
  if (s) s.hidden = true;
}

function a2SetSearch(value) {
  a2Search = value;
  a2ApplyFilters();
}

/** True when the AMD v2 renderer currently owns the DOM. */
function a2IsActive() {
  return document.body.classList.contains('amd-v2');
}

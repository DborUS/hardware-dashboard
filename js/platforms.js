// OEM platform coverage is intentionally a separate, curated dataset. A matching
// socket or processor family never creates a compatibility edge here.
(() => {
  const CPU_TABS = new Set(['amd/epyc', 'amd/ryzen', 'intel/xeon', 'intel/client',
    'nvidia/cpu', 'ampere/processors']);
  const timeline = document.getElementById('timeline');
  const dialog = document.getElementById('platformDialog');
  const content = document.getElementById('platformContent');
  const title = document.getElementById('platformTitle');
  let dataset = null;
  let productsByTabAndModel = new Map();
  let linksByProduct = new Map();
  let platformsById = new Map();
  let sourcesById = new Map();
  let paintQueued = false;

  const keyOf = (tab, model) => `${tab}\u0000${model}`;
  const oneOrMore = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;
  const labelFor = (value) => String(value || '').replace(/[-_]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
  const safeUrl = url => /^https:\/\//i.test(String(url || '')) ? url : '';

  function indexData(data) {
    productsByTabAndModel = new Map();
    linksByProduct = new Map();
    platformsById = new Map((data.platforms || []).map(platform => [platform.id, platform]));
    sourcesById = new Map((data.sources || []).map(source => [source.id, source]));
    (data.products || []).forEach(product => {
      const key = keyOf(product.dashboardTab, product.model);
      if (!productsByTabAndModel.has(key)) productsByTabAndModel.set(key, []);
      productsByTabAndModel.get(key).push(product);
    });
    (data.compatibility || []).forEach(link => {
      if (link.supportLevel !== 'confirmed') return;
      if (!linksByProduct.has(link.catalogId)) linksByProduct.set(link.catalogId, []);
      linksByProduct.get(link.catalogId).push(link);
    });
  }

  function activeTab() {
    if (typeof currentVendor === 'undefined' ||
        typeof dashboardActiveProductLine !== 'function') return '';
    return `${currentVendor}/${dashboardActiveProductLine()}`;
  }

  function productForRow(tab, model, row) {
    const candidates = productsByTabAndModel.get(keyOf(tab, model)) || [];
    const hasPart = product => !product.productId ||
      [...row.cells].slice(1).some(cell => cell.textContent.trim() === product.productId);
    if (candidates.length === 1) return hasPart(candidates[0]) ? candidates[0] : null;
    const matched = candidates.filter(product => product.productId && hasPart(product));
    return matched.length === 1 ? matched[0] : null;
  }

  function decorateRows() {
    if (!dataset || !CPU_TABS.has(activeTab())) return;
    const tab = activeTab();
    timeline.querySelectorAll('.cpu-spec-table tbody tr[data-search]:not([data-platforms-added])')
      .forEach(row => {
        const cell = row.querySelector('td.cpu-model-name');
        if (!cell) return;
        const model = cell.textContent.trim();
        const product = productForRow(tab, model, row);
        const links = product ? linksByProduct.get(product.catalogId) || [] : [];
        const count = new Set(links.map(link => link.platformId)).size;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'platform-row-action';
        button.dataset.hasPlatforms = String(count > 0);
        button.dataset.model = model;
        button.dataset.catalogId = product?.catalogId || '';
        button.title = count
          ? `View ${oneOrMore(count, 'verified OEM platform')} for ${model}`
          : `Check OEM platform research for ${model}`;
        button.setAttribute('aria-label', count
          ? `View ${oneOrMore(count, 'verified OEM platform')} for ${model}`
          : `Check OEM platform research for ${model}`);
        button.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><rect x="2" y="2.5" width="16" height="6" rx="1.5"/><rect x="2" y="11.5" width="16" height="6" rx="1.5"/><circle cx="5.5" cy="5.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="5.5" cy="14.5" r="0.8" fill="currentColor" stroke="none"/></svg>';
        cell.append(button);
        row.dataset.platformsAdded = 'true';
      });
  }

  function queueDecorate() {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      paintQueued = false;
      decorateRows();
    });
  }

  function detail(label, value) {
    return value === undefined || value === null || value === '' ? '' :
      `<div><dt>${escHtml(label)}</dt><dd>${escHtml(String(value))}</dd></div>`;
  }

  function sourceLinks(link, platform) {
    const ids = [...new Set([...(link.sourceIds || []), ...(platform.sourceIds || [])])];
    return ids.map(id => sourcesById.get(id)).filter(Boolean).map(source => {
      const url = safeUrl(source.url);
      return url ? `<li><a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">` +
        `${escHtml(source.publisher || platform.oem)} · ${escHtml(source.title || 'Official source')} ↗</a>` +
        `<span>${escHtml([source.locator, source.retrievedAt ? `Checked ${source.retrievedAt}` : '']
          .filter(Boolean).join(' · '))}</span></li>` : '';
    }).join('');
  }

  function platformCard(link, platform) {
    const sockets = platform.socketCount === undefined ? '' :
      `${platform.socketCount} CPU socket${Number(platform.socketCount) === 1 ? '' : 's'}`;
    const rackSize = platform.rackUnits === undefined ? '' :
      `${platform.rackUnits}${String(platform.rackUnits).endsWith('U') ? '' : 'U'}`;
    const quick = [sockets, rackSize,
      platform.volumeLiters ? `${platform.volumeLiters} L` : '',
      platform.displaySizeInches ? `${platform.displaySizeInches} in display` : '',
      labelFor(platform.formFactor)].filter(Boolean);
    const sourceHtml = sourceLinks(link, platform);
    return `<details class="platform-card">
      <summary>
        <span class="platform-card-title">${escHtml(platform.model)}</span>
        <span class="platform-card-quick">${escHtml(quick.join(' · '))}</span>
        <span class="platform-card-caret" aria-hidden="true">⌄</span>
      </summary>
      <div class="platform-card-detail">
        <dl class="platform-specs">
          ${detail('System type', labelFor(platform.category))}
          ${detail('Form factor', labelFor(platform.formFactor))}
          ${detail('Chassis size', rackSize || platform.dimensions)}
          ${detail('Dimensions', rackSize ? platform.dimensions : '')}
          ${detail('Chassis volume', platform.volumeLiters ? `${platform.volumeLiters} L` : '')}
          ${detail('Display', platform.displaySizeInches ? `${platform.displaySizeInches} in` : '')}
          ${detail('CPU sockets', platform.socketCount)}
          ${detail('Memory channels', platform.memoryChannelsPerSocket === undefined ? '' :
            `${platform.memoryChannelsPerSocket} per CPU`)}
          ${detail('DIMM slots (up to)', platform.dimmSlots)}
          ${detail('Supported CPU count', Array.isArray(link.supportedCpuQuantities)
            ? link.supportedCpuQuantities.join(' or ') : link.supportedCpuQuantities)}
          ${detail('OEM option code', link.oemOptionCode)}
          ${detail('Documented market', link.market)}
          ${detail('Evidence', link.evidenceType === 'fixed_configuration'
            ? 'OEM published configuration with this CPU'
            : link.evidenceType === 'qualified_vendor_list'
              ? 'Exact CPU listed in OEM qualified vendor list'
              : link.evidenceType === 'thermal_qualification_table'
                ? 'Exact CPU listed in OEM configuration and cooling guidance'
              : 'Exact CPU listed in OEM processor options')}
        </dl>
        ${platform.platformNote ? `<p class="platform-restriction"><strong>Platform layout</strong><span>${escHtml(platform.platformNote)}</span></p>` : ''}
        ${link.restrictionNote ? `<p class="platform-restriction"><strong>Configuration notes</strong><span>${escHtml(link.restrictionNote)}</span></p>` : ''}
        ${sourceHtml ? `<div class="platform-sources"><strong>Official evidence</strong><ul>${sourceHtml}</ul></div>` : ''}
      </div>
    </details>`;
  }

  function paintDialog(model, catalogId) {
    title.textContent = model;
    const links = (linksByProduct.get(catalogId) || []).filter(link =>
      platformsById.has(link.platformId));
    const uniqueLinks = [...new Map(links.map(link => [link.platformId, link])).values()];
    if (!uniqueLinks.length) {
      content.innerHTML = `<div class="platform-empty">
        <div class="platform-empty-mark" aria-hidden="true">◇</div>
        <h3>No verified OEM platform entries yet</h3>
        <p>ChipIndex has not completed platform research for ${escHtml(model)}. This is a coverage gap, not a finding that the CPU is unsupported.</p>
        <p>Research currently prioritizes server processors from the EPYC 9004 / Genoa era onward and current client systems.</p>
      </div>`;
      return;
    }
    const groups = new Map();
    uniqueLinks.forEach(link => {
      const platform = platformsById.get(link.platformId);
      if (!groups.has(platform.oem)) groups.set(platform.oem, []);
      groups.get(platform.oem).push([link, platform]);
    });
    const groupHtml = [...groups].sort(([a], [b]) => a.localeCompare(b))
      .map(([oem, entries]) => `<section class="platform-oem">
        <div class="platform-oem-head"><h3>${escHtml(oem)}</h3><span>${oneOrMore(entries.length, 'platform')}</span></div>
        ${entries.sort((a, b) => a[1].model.localeCompare(b[1].model))
          .map(([link, platform]) => platformCard(link, platform)).join('')}
      </section>`).join('');
    content.innerHTML = `<div class="platform-overview">
      <div class="platform-overview-stats">
        <div><strong>${uniqueLinks.length}</strong><span>Verified platforms</span></div>
        <div><strong>${groups.size}</strong><span>OEMs</span></div>
      </div>
      <p>These links use official, exact CPU listings or published configurations. Chassis specifications describe the platform; options and availability can vary by configuration and region. Snapshot: ${escHtml(dataset.snapshotDate || 'date unavailable')}.</p>
    </div>${groupHtml}`;
  }

  timeline.addEventListener('click', event => {
    const button = event.target.closest('.platform-row-action');
    if (!button) return;
    // The row's ordinary click selects a CPU for comparison. This action opens
    // the separate platform view and must not change that selection.
    event.stopPropagation();
    paintDialog(button.dataset.model, button.dataset.catalogId);
    dialog.showModal();
  });

  new MutationObserver(queueDecorate).observe(timeline, {childList: true, subtree: true});
  fetch('js/data/platform-compatibility.json?v=20260930-platforms-4')
    .then(response => {
      if (!response.ok) throw new Error(`Platform dataset returned ${response.status}`);
      return response.json();
    })
    .then(data => { dataset = data; indexData(data); queueDecorate(); })
    .catch(error => console.warn('Could not load OEM platform coverage:', error));
})();

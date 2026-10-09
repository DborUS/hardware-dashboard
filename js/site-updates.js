// Shared ChipIndex version and release history across Products, Benchmarks and Platforms.
// Keep the current version and What's new dialog shared across every site section.
(() => {
  const releaseVersion = '0.0.5';
  const release = Object.freeze({
    version: releaseVersion,
    label: `Public beta ${releaseVersion}`,
    updated: '2026-10-09'
  });
  window.ChipIndexRelease = release;
  const dialogMarkup = `<dialog class="dashboard-dialog whats-new-dialog" id="whatsNewDialog" aria-labelledby="whatsNewTitle">
  <div class="dialog-head">
    <div>
      <div class="dialog-kicker">CHIPINDEX / ${release.label.toUpperCase()}</div>
      <h2 id="whatsNewTitle">What's new</h2>
      <p class="release-period">Current update first · scroll for earlier upgrades ↓</p>
    </div>
    <button class="dialog-close" type="button" data-close-dialog="whatsNewDialog" aria-label="Close what's new">✕</button>
  </div>
  <div class="release-history" id="releaseHistory" role="region" aria-label="Dated public beta update history" tabindex="0">
    <section class="release-version" aria-labelledby="release005">
      <div class="release-version-head"><h3 id="release005">${release.label}</h3><time datetime="${release.updated}">Updated October 9, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">PLATFORMS</span><div><h4>Explore OEM server families</h4><p>Browse 102 curated systems and learning guides for Cisco, HPE, Dell, Lenovo, and Supermicro. Processor counts, DIMM slots, and 1DPC/2DPC stay prominent alongside generation dates, CPU and accelerator support, configuration limits, and official sources.</p></div></section>
        <section class="release-note"><span class="release-note-label">ILLUSTRATIONS</span><div><h4>See the server layout</h4><p>Fourteen generic server drawings now use reviewed OEM photos and diagrams. Each identifies the configuration shown; contextual schematics remain clearly labeled.</p></div></section>
        <section class="release-note"><span class="release-note-label">NAVIGATION</span><div><h4>Move through one ChipIndex</h4><p>Products, Benchmarks, Platforms, and every OEM guide now share the ChipIndex header, navigation, version, and What's new history. OEM guides sit within Platforms, with a clear route back to the finder.</p></div></section>
      </div>
    </section>
    <section class="release-version" aria-labelledby="release20261007">
      <div class="release-version-head"><h3 id="release20261007">October 7 update</h3><time datetime="2026-10-07">Updated October 7, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">BENCHMARKS</span><div><h4>Compare public benchmark results</h4><p>Explore selected SPEC CPU, MLPerf Inference, and Blender results by workload. Scores show their units, test conditions, capture dates, and original sources. CPU specification tables now end with one compact benchmark score.</p></div></section>
        <section class="release-note"><span class="release-note-label">DISCOVERY</span><div><h4>Start with all manufacturers</h4><p>Products and Benchmarks share the ChipIndex header, navigation, and update history. Vendor Benchmarks tabs open the explorer with All manufacturers; select a CPU table score to open that model and its exact test.</p></div></section>
      </div>
    </section>
    <section class="release-version" aria-labelledby="release004">
      <div class="release-version-head"><h3 id="release004">Public beta 0.0.4</h3><time datetime="2026-09-30">Updated September 30, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">GH200</span><div><h4>Explore Grace Hopper from the inside</h4><p>Three sourced diagrams show the GH200 superchip, Grace CPU, and Hopper GPU. Select a part to trace cache, memory, and NVLink-C2C connections; underlined terms open short definitions.</p></div></section>
        <section class="release-note"><span class="release-note-label">UPDATES</span><div><h4>Browse earlier upgrades</h4><p>The dated history below keeps previous public beta changes available in one place.</p></div></section>
      </div>
    </section>
    <section class="release-version" aria-labelledby="release003">
      <div class="release-version-head"><h3 id="release003">Public beta 0.0.3</h3><time datetime="2026-09-28">Updated September 28, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">XEON 6</span><div><h4>Explore selected Xeon 6 designs</h4><p>A new architecture guide diagrams P-core and E-core layouts, package dies, memory locality, and platform links. Xeon 6300P also has its own Raptor Lake-E Refresh card; search can find Redwood Cove and Crestmont.</p></div></section>
        <section class="release-note"><span class="release-note-label">EPYC 9005</span><div><h4>Explore the EPYC 9005 architecture</h4><p>Eight sourced diagrams now have plain definitions, an acronym key, and a source library. Compare Zen 5 and Zen 5c NUMA layouts, then trace I/O lanes, sockets, validated boot, and error handling.</p></div></section>
      </div>
    </section>
    <section class="release-version" aria-labelledby="release002">
      <div class="release-version-head"><h3 id="release002">Public beta 0.0.2</h3><time datetime="2026-09-28">Updated September 28, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">AMPERE</span><div><h4>Find Ampere processors</h4><p>Five families and 26 models joined the dashboard with sourced specifications, filters, search, and comparisons.</p></div></section>
        <section class="release-note"><span class="release-note-label">ROADMAPS</span><div><h4>Separate announced products from released models</h4><p>Manufacturer-sourced roadmap groups now sit above the product timelines without changing released-model counts.</p></div></section>
        <section class="release-note"><span class="release-note-label">XEON / EPYC</span><div><h4>Clarify families and platform links</h4><p>Xeon 6300P moved to its Raptor Lake-E Refresh family. The EPYC 9005 guide gained clearer G/P SERDES and socket-link explanations.</p></div></section>
      </div>
    </section>
    <section class="release-version" aria-labelledby="release001">
      <div class="release-version-head"><h3 id="release001">Public beta 0.0.1</h3><time datetime="2026-09-25">Updated September 25, 2026</time></div>
      <div class="release-notes">
        <section class="release-note"><span class="release-note-label">EPYC 9005</span><div><h4>See the first architecture guide</h4><p>Interactive diagrams and plain definitions explain the chiplets, cores, memory, I/O, and connections.</p></div></section>
        <section class="release-note"><span class="release-note-label">DISCOVERY</span><div><h4>Find and compare products more easily</h4><p>Search expanded across AMD, Intel, and NVIDIA; comparison details became clearer and small text easier to read.</p></div></section>
        <section class="release-note"><span class="release-note-label">DETAILS</span><div><h4>More source context</h4><p>Intel gained a refreshed dark theme, and EPYC tables began showing AMD's published 1,000-unit pricing where available.</p></div></section>
      </div>
    </section>
  </div>
</dialog>`;
  function initSiteUpdates() {
    document.querySelectorAll('.brand-lockup-version').forEach(label => {
      label.textContent = release.label;
    });
    document.querySelectorAll('.brand-lockup').forEach(brand => {
      brand.setAttribute('aria-label', `ChipIndex by Dan Bor, ${release.label.toLowerCase()}`);
    });
    const trigger = document.getElementById('whatsNewBtn');
    if (!trigger) return;
    let dialog = document.getElementById('whatsNewDialog');
    if (!dialog) {
      document.body.insertAdjacentHTML('beforeend', dialogMarkup);
      dialog = document.getElementById('whatsNewDialog');
    }
    const history = dialog.querySelector('#releaseHistory');
    const closeButton = dialog.querySelector('[data-close-dialog="whatsNewDialog"]');
    trigger.addEventListener('click', () => {
      dialog.showModal();
      if (history) history.scrollTop = 0;
      trigger.setAttribute('aria-expanded', 'true');
    });
    dialog.addEventListener('close', () => trigger.setAttribute('aria-expanded', 'false'));
    closeButton?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteUpdates, { once: true });
  } else {
    initSiteUpdates();
  }
})();

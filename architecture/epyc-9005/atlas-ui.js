/* AMD atlas presentation layer. Technical context follows the
   cited architecture white paper and EPYC 9005 product datasheet. */
(() => {
  const app = document.querySelector('.app');
  const nav = document.querySelector('#viewNav');
  const panel = document.querySelector('.diagram-wrap');
  const head = document.querySelector('.diagram-head');
  const readingWrap = document.querySelector('.under');
  const reading = readingWrap.querySelector('.reading');
  const footer = document.querySelector('.stage-footer');
  const detail = document.querySelector('#featureDetail');

  const navWrap = document.createElement('div');
  navWrap.className = 'atlas-nav-wrap';
  nav.before(navWrap);
  navWrap.innerHTML = '<div class="atlas-nav-caption"><span>08 MODELS · PACKAGE → CHIPLET → CORE → I/O → LINKS → MEMORY → PROTECTION</span><span>SCROLL OR SWIPE TO SEE MORE →</span></div>';
  navWrap.append(nav);

  const meta = document.createElement('div');
  meta.className = 'atlas-model-meta';
  meta.innerHTML = '<span class="atlas-model-id" id="atlasModelId"></span><span class="atlas-model-tag" id="atlasModelTag"></span>';
  head.firstElementChild.prepend(meta);

  const readingCopy = document.createElement('div');
  readingCopy.className = 'reading-copy';
  readingCopy.append(reading.querySelector('h3'), reading.querySelector('p'));
  reading.prepend(readingCopy);
  head.after(readingWrap);

  const detailLink = document.createElement('a');
  detailLink.className = 'atlas-detail-link';
  detailLink.href = '#featureDetail';
  detailLink.textContent = 'JUMP TO COMPONENT DETAILS ↓';
  footer.append(detailLink);

  const glossary = document.createElement('details');
  glossary.className = 'atlas-glossary';
  glossary.innerHTML = '<summary><span>ACRONYM KEY</span><small>Terms in this model</small><i aria-hidden="true">⌄</i></summary><div class="atlas-glossary-content"><p>Select an underlined term here or in the text for a short definition already used in this guide.</p><div class="atlas-key" id="atlasKey"></div></div>';
  detail.before(glossary);

  const sourceLibrary = document.createElement('section');
  sourceLibrary.className = 'atlas-source-card';
  sourceLibrary.setAttribute('aria-labelledby', 'atlasSourceTitle');
  sourceLibrary.innerHTML = `
    <div class="atlas-source-label">SOURCE LIBRARY</div>
    <div class="atlas-source-heading">
      <h2 id="atlasSourceTitle">AMD EPYC 9005 architecture sources</h2>
      <span>02 DOCUMENTS · 08 MODELS</span>
    </div>
    <p class="atlas-source-intro">The AMD architecture white paper supports the diagrams and their component explanations. AMD's processor datasheet supports the Zen 5 versus Zen 5c clock comparison in the term key.</p>
    <div class="atlas-source-row">
      <b>PRIMARY / ARCHITECTURE</b>
      <div>
        <a href="https://www.amd.com/content/dam/amd/en/documents/epyc-business-docs/white-papers/5th-gen-amd-epyc-processor-architecture-white-paper.pdf" target="_blank" rel="noopener noreferrer">5th Gen AMD EPYC™ Processor Architecture ↗</a>
        <small>AMD white paper · Doc. 70353 · March 2025</small>
        <p>Source for the package, Zen 5 and Zen 5c compute dies, core design, I/O die, platform links, memory locality, and security features shown here.</p>
      </div>
    </div>
    <div class="atlas-source-row">
      <b>SUPPORTING / SPECS</b>
      <div>
        <a href="https://www.amd.com/content/dam/amd/en/documents/epyc-business-docs/datasheets/amd-epyc-9005-series-processor-datasheet.pdf" target="_blank" rel="noopener noreferrer">AMD EPYC™ 9005 Series Processors datasheet ↗</a>
        <small>AMD product specification table · Zen 5 and Zen 5c boost clocks</small>
        <p>The model table shows the lower peak boost speeds of density-focused Zen 5c products in this lineup. Clock speed still varies by individual processor model.</p>
      </div>
    </div>
    <div class="atlas-page-index">
      <div class="atlas-page-index-head"><b>PAGE GUIDE</b><span>Model pages; individual parts may cite more</span></div>
      <ul id="atlasSourcePages"></ul>
    </div>
    <p class="atlas-source-note">The drawings are educational schematics. Chiplet positions do not represent a package floorplan; supported features and maximum counts vary by processor and platform.</p>`;
  panel.after(sourceLibrary);
  const sourcePages = sourceLibrary.querySelector('#atlasSourcePages');
  VIEWS.forEach((view, index) => {
    const item = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = `${String(index + 1).padStart(2, '0')}  ${view.name}`;
    const pages = document.createElement('strong');
    pages.textContent = view.pages;
    item.append(title, pages);
    sourcePages.append(item);
  });

  const toastStack = document.createElement('div');
  toastStack.className = 'term-toast-stack';
  toastStack.setAttribute('aria-label', 'Open term definitions');
  toastStack.setAttribute('aria-live', 'polite');
  toastStack.setAttribute('aria-relevant', 'additions');
  app.after(toastStack);
  const earlierTerms = document.createElement('button');
  earlierTerms.className = 'term-toast-more';
  earlierTerms.type = 'button';
  earlierTerms.hidden = true;
  earlierTerms.setAttribute('aria-label', 'Show an earlier term definition');
  toastStack.append(earlierTerms);
  toastStack.hidden = true;

  const terms = {
    'CCD': 'Core Complex Die: a separate compute chiplet inside the CPU package. It holds cores, their private L2 caches, and shared L3 cache, and connects to the I/O die. Zen 5 CCDs have up to 8 cores; Zen 5c CCDs have 16.',
    'Zen 5': 'The performance-focused CPU core design used in EPYC 9005. A Zen 5 CCD has up to 8 cores and 32 MB of shared L3 cache. Models using these cores include the highest peak-clock options in this series.',
    'Zen 5c': 'A smaller, more tightly packed layout of the Zen 5 CPU core with the same underlying logic. It favors core density and energy efficiency: 16 cores fit on one CCD. EPYC 9005 Zen 5c models generally have lower peak clocks than the frequency-focused Zen 5 models.',
    'I/O die': 'A separate chip inside the CPU package that contains memory controllers and high-speed connection circuits. It links the compute chiplets to RAM, external devices, and, in a two-socket server, the other CPU.',
    'GMI': 'Global Memory Interface: an internal Infinity Fabric link between a CCD and the I/O die. It carries data between the cores and the rest of the processor. EPYC 9005 has 16 such links on its I/O die.',
    'Infinity Fabric': 'AMD’s interconnect system for moving data among processor components. Inside EPYC 9005, GMI links connect CCDs to the I/O die; separate G SERDES links can connect two CPU sockets.',
    'DDR5': 'Fifth-generation Double Data Rate memory, the RAM installed on the server board. A DDR5 channel is a path from one I/O-die memory controller to attached DIMMs; EPYC 9005 provides 12 channels per socket.',
    'SERDES': 'Serializer/deserializer: a circuit on the I/O die that converts data into fast serial electrical signals and back. Eight 16-lane blocks carry supported PCIe, CXL, SATA, or CPU-to-CPU fabric links, depending on the block and server design.',
    'G / P SERDES': 'G and P name two sets of four 16-lane SERDES blocks on the I/O die. All G blocks can carry PCIe in one-socket systems. In two-socket systems, three or four G blocks carry intersocket Infinity Fabric; if three are used, the fourth G block can carry PCIe. P blocks serve external I/O.',
    'PCIe Gen 5': 'The fifth generation of the expansion link used to connect the CPU to devices such as network cards, storage, and accelerators. EPYC 9005 can expose up to 128 Gen 5 lanes in one-socket systems; a two-socket server shares G lanes with CPU-to-CPU fabric.',
    'CXL 2.0': 'Compute Express Link: a connection standard that uses selected PCIe physical lanes to attach compatible memory or accelerator devices while supporting memory sharing and coordination with the CPU. EPYC 9005 supports up to four x16 CXL links.',
    'SATA': 'Serial ATA: a connection standard for storage drives. Some EPYC 9005 I/O-die SERDES lanes can be assigned to SATA controllers, with block-specific limits.',
    'L1': 'Level 1 cache: the small, fastest cache inside each core. It holds instructions and data the core is likely to use soon; the Zen 5 diagram shows a 48 KB L1 data cache.',
    'L2': 'Level 2 cache: a larger cache private to each Zen 5 or Zen 5c core. Each core has 1 MB of L2 between its L1 cache and the CCD’s shared L3 cache.',
    'L3': 'Level 3 cache: a larger store shared by the cores on one CCD. A Zen 5 or Zen 5c CCD has 32 MB total, reducing trips to slower main memory.',
    'AVX-512': 'A set of vector instructions that applies one operation to several data values at once using vectors up to 512 bits wide. The Zen 5 core has a 512-bit data path; software must use these instructions to benefit.',
    'NUMA': 'Non-Uniform Memory Access: a layout in which a core can reach all system memory, but nearby memory may respond faster. A NUMA domain groups cores with memory channels that are closer to them.',
    'NPS': 'NUMA Nodes Per Socket: a BIOS setting for how many memory-locality groups one CPU exposes. NPS=1 gives one group per socket; NPS=4 gives four, each with three DDR5 controllers and nearby CCDs.',
    'AMD Secure Processor': 'A dedicated security microcontroller on the I/O die. It verifies startup firmware before the Zen cores run and manages cryptographic keys used by memory and virtual-machine protection.',
    'SEV': 'Secure Encrypted Virtualization: hardware features that give guest virtual machines separate memory-encryption keys, helping keep one guest’s data private from the host and other guests.',
    'SEV-ES': 'Secure Encrypted State: an extension of SEV that encrypts a virtual machine’s saved CPU register state so the hypervisor cannot read it during an interrupt.',
    'SEV-SNP': 'Secure Nested Paging: an extension of SEV-ES that protects a virtual machine’s memory-page ownership and mappings against replay or remapping and supports attestation.',
    'RAS': 'Reliability, Availability, and Serviceability: processor and platform features that detect, correct, contain, and report hardware errors so a server can continue operating or be diagnosed and repaired.'
  };
  const keysByView = {
    package: ['CCD', 'Zen 5', 'Zen 5c', 'I/O die', 'GMI', 'DDR5', 'SERDES'],
    ccd: ['CCD', 'Zen 5', 'Zen 5c', 'L2', 'L3'],
    core: ['L1', 'L2', 'AVX-512'],
    iod: ['I/O die', 'GMI', 'DDR5', 'SERDES', 'PCIe Gen 5'],
    lanes: ['SERDES', 'G / P SERDES', 'Infinity Fabric', 'PCIe Gen 5', 'CXL 2.0', 'SATA'],
    sockets: ['SERDES', 'G / P SERDES', 'Infinity Fabric', 'PCIe Gen 5', 'DDR5'],
    numa: ['NUMA', 'NPS', 'CCD', 'DDR5', 'GMI'],
    protection: ['AMD Secure Processor', 'SEV', 'SEV-ES', 'SEV-SNP', 'RAS']
  };

  function selectedView() {
    return nav.querySelector('.view-btn.active')?.dataset.view || 'package';
  }

  function refreshLocalToasts() {
    const cards = Array.from(toastStack.querySelectorAll('.term-toast'));
    const focusedCard = cards.find(card => card.contains(document.activeElement));
    const visibleLimit = window.matchMedia('(max-width: 390px), (max-height: 600px)').matches ? 2 : 3;
    cards.forEach((card, index) => {
      const expanded = index === 0;
      card.hidden = index >= visibleLimit;
      card.classList.toggle('is-compact', !expanded);
      card.querySelector('.term-toast-copy').hidden = !expanded;
      card.querySelector('.term-toast-reopen').hidden = expanded;
    });
    const hiddenCount = Math.max(0, cards.length - visibleLimit);
    earlierTerms.hidden = hiddenCount === 0;
    earlierTerms.textContent = `+${hiddenCount} earlier term${hiddenCount === 1 ? '' : 's'} · show one`;
    toastStack.hidden = cards.length === 0;
    if (focusedCard?.hidden) {
      cards[0].querySelector('.term-toast-close').focus();
    }
  }

  earlierTerms.addEventListener('click', () => {
    const hiddenCards = Array.from(toastStack.querySelectorAll('.term-toast[hidden]'));
    const oldestHidden = hiddenCards.at(-1);
    if (!oldestHidden) return;
    toastStack.prepend(oldestHidden);
    refreshLocalToasts();
    oldestHidden.querySelector('.term-toast-close').focus();
  });
  window.addEventListener('resize', refreshLocalToasts);

  function showLocalToast(term) {
    const card = document.createElement('aside');
    card.className = 'term-toast';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Definition of ${term}`);
    card.innerHTML = '<div class="term-toast-copy"><small>TERM DEFINITION</small><h4></h4><p></p></div><button class="term-toast-reopen" type="button" hidden></button><div class="term-toast-controls"><button class="term-toast-close" type="button"><span aria-hidden="true">×</span></button><span class="term-toast-countdown" aria-hidden="true">15s</span></div>';
    card.querySelector('h4').textContent = term;
    card.querySelector('p').textContent = terms[term];
    const reopen = card.querySelector('.term-toast-reopen');
    reopen.textContent = term;
    reopen.setAttribute('aria-label', `Show definition of ${term}`);
    reopen.addEventListener('click', () => {
      toastStack.prepend(card);
      refreshLocalToasts();
      card.querySelector('.term-toast-close').focus();
    });
    const close = card.querySelector('.term-toast-close');
    close.setAttribute('aria-label', `Close definition of ${term}`);
    const countdown = card.querySelector('.term-toast-countdown');
    const originatingControl = document.activeElement;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 15 - (performance.now() - start) / 1000);
      countdown.textContent = `${Math.ceil(remaining)}s`;
      close.style.setProperty('--toast-progress', `${remaining / 15 * 360}deg`);
      if (remaining <= 0) removeCard();
    }, 100);
    function removeCard() {
      const hadFocus = card.contains(document.activeElement);
      window.clearInterval(timer);
      card.remove();
      refreshLocalToasts();
      if (hadFocus) {
        const nextClose = toastStack.querySelector('.term-toast:not([hidden]) .term-toast-close');
        if (nextClose) nextClose.focus();
        else if (originatingControl?.isConnected) originatingControl.focus();
      }
    }
    close.addEventListener('click', removeCard);
    toastStack.prepend(card);
    refreshLocalToasts();
  }

  function showTerm(term) {
    if (window.parent !== window && location.origin === window.parent.location.origin) {
      window.parent.postMessage({ type: 'epyc-atlas:term', term, definition: terms[term] }, location.origin);
    } else {
      showLocalToast(term);
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (window.parent !== window && location.origin === window.parent.location.origin) {
      window.parent.postMessage({ type: 'epyc-atlas:term-dismiss' }, location.origin);
    } else {
      toastStack.querySelector('.term-toast:not([hidden]) .term-toast-close')?.click();
    }
  });

  function termButton(term) {
    const button = document.createElement('button');
    button.className = 'term-button';
    button.type = 'button';
    button.textContent = term;
    button.setAttribute('aria-label', `Define ${term}`);
    button.addEventListener('click', () => showTerm(term));
    return button;
  }

  function linkify(root, allowed) {
    if (!root || !allowed.length) return;
    const pattern = new RegExp(`(?<![A-Za-z0-9-])(${allowed.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|')})(?![A-Za-z0-9-])`, 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('button, a') && pattern.test(node.nodeValue)) textNodes.push(node);
      pattern.lastIndex = 0;
    }
    for (const node of textNodes) {
      const value = node.nodeValue;
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      for (const match of value.matchAll(pattern)) {
        if (match.index > cursor) fragment.append(document.createTextNode(value.slice(cursor, match.index)));
        const term = allowed.find(x => x.toLowerCase() === match[0].toLowerCase());
        fragment.append(termButton(term));
        cursor = match.index + match[0].length;
      }
      if (cursor < value.length) fragment.append(document.createTextNode(value.slice(cursor)));
      node.replaceWith(fragment);
    }
  }

  function updateViewPresentation() {
    const activeButton = nav.querySelector('.view-btn.active');
    if (!activeButton) return;
    const view = selectedView();
    const index = [...nav.querySelectorAll('.view-btn')].indexOf(activeButton) + 1;
    document.querySelector('#atlasModelId').textContent = `MODEL ${String(index).padStart(2, '0')} / 08`;
    document.querySelector('#atlasModelTag').textContent = activeButton.querySelector('.view-index')?.textContent.split(' / ')[1] || '';
    const allowed = keysByView[view] || [];
    const key = document.querySelector('#atlasKey');
    key.replaceChildren(...allowed.map(termButton));
    glossary.querySelector('small').textContent = `${allowed.length} terms in this model`;
    glossary.open = false;
    linkify(document.querySelector('#viewIntro'), allowed);
    linkify(document.querySelector('#viewPoints'), allowed);
  }

  new MutationObserver(updateViewPresentation).observe(document.querySelector('#viewTitle'), { childList: true });
  new MutationObserver(() => {
    const allowed = keysByView[selectedView()] || [];
    linkify(document.querySelector('#detailDefinition'), allowed);
    linkify(document.querySelector('#detailBody'), allowed);
  }).observe(document.querySelector('#detailTitle'), { childList: true });
  updateViewPresentation();
})();

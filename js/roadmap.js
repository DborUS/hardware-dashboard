// Announced hardware without a released model row in the dashboard. Every
// description and timing label is supported by the linked manufacturer source.
// Keep these entries separate from specification tables and comparisons.

const DASHBOARD_ROADMAP = {
  amd: {
    epyc: [
      {
        name: 'EPYC Verano', timing: 'Expected 2027',
        note: '6th Gen EPYC server CPU planned with LPDDR5X SOCAMM2 variants.',
        sources: [{ label: 'AMD server memory roadmap', url: 'https://www.amd.com/en/blogs/2026/a-look-ahead--extending-server-energy-efficiency-with-lpddr5x-me.html' }]
      },
      {
        name: 'EPYC Florence', timing: 'Roadmap 2028',
        note: 'Zen 7 server CPU named in AMD’s 2028 EPYC roadmap.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      },
      {
        name: 'EPYC Ferrara', timing: 'Roadmap 2028',
        note: 'Zen 7 server CPU also named for AMD’s future Helios 600 platform.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      },
      {
        name: 'EPYC Fidenza', timing: 'Roadmap 2028',
        note: 'Zen 7 server CPU named in AMD’s 2028 EPYC roadmap.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      },
      {
        name: 'EPYC Ravenna', timing: 'Roadmap 2030',
        note: 'Zen 8 server CPU named in AMD’s longer-range EPYC roadmap.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      }
    ],
    ryzen: [
      {
        name: 'Ryzen AI Medusa', timing: 'Expected 2027',
        note: 'Upcoming Ryzen AI family in AMD’s AI PC roadmap.',
        sources: [{ label: 'AMD AI PC roadmap', url: 'https://www.amd.com/en/blogs/2025/from-momentum-to-market-leadership.html' }]
      }
    ],
    gpu: [
      {
        name: 'Instinct MI430X', timing: 'Expected 2027',
        note: 'HPC and sovereign AI accelerator with availability expected in 2027.',
        sources: [{ label: 'AMD MI430X product page', url: 'https://www.amd.com/en/products/accelerators/instinct/mi400/mi430x.html' }]
      },
      {
        name: 'Instinct MI440X', timing: 'Timing not stated',
        note: 'Announced Instinct GPU for enterprise AI deployments.',
        sources: [{ label: 'AMD CES announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1272/amd-and-its-partners-share-their-vision-for-ai-everywhere-for-everyone-at-ces-2026' }]
      },
      {
        name: 'Instinct MI500 Series', timing: 'Planned 2027',
        note: 'Next Instinct GPU series on AMD’s data center roadmap.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      },
      {
        name: 'Instinct MI600 Series', timing: 'Roadmap 2028',
        note: 'Later Instinct GPU series on AMD’s data center roadmap.',
        sources: [{ label: 'AMD roadmap announcement', url: 'https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era' }]
      }
    ]
  },
  intel: {
    xeon: [
      {
        name: 'Diamond Rapids', timing: 'Timing not stated',
        note: 'Next Xeon server CPU; Intel has disclosed Intel 18A-P and up to 256 cores.',
        sources: [{ label: 'Intel Hot Chips 2026', url: 'https://www.intel.com/content/www/us/en/newsroom/news/client-computing/intel-outlines-architectures-for-agentic-ai-at-hot-chips-2026.html' }]
      },
      {
        name: 'Coral Rapids', timing: 'Timing not stated',
        note: 'Later server CPU; Intel says multithreading will return.',
        sources: [{ label: 'Intel earnings remarks', url: 'https://download.intel.com/newsroom/2026/earnings/Intel-4Q2025-Earnings-Call.pdf' }]
      }
    ],
    client: [
      {
        name: 'Nova Lake', timing: 'Expected late 2026',
        note: 'Next Intel client family for notebooks and desktops.',
        sources: [{ label: 'Intel earnings remarks', url: 'https://download.intel.com/newsroom/2026/earnings/Intel-4Q2025-Earnings-Call.pdf' }]
      }
    ],
    graphics: [
      {
        name: 'Crescent Island', timing: 'Customer sampling in 2026',
        note: 'Data center inference GPU; Intel has disclosed Xe3P and up to 480 GB LPDDR5X.',
        sources: [
          { label: 'Intel Hot Chips 2026', url: 'https://www.intel.com/content/www/us/en/newsroom/news/client-computing/intel-outlines-architectures-for-agentic-ai-at-hot-chips-2026.html' },
          { label: 'Intel GPU announcement', url: 'https://www.intel.com/content/www/us/en/newsroom/news/artificial-intelligence/intel-to-expand-ai-accelerator-portfolio-with-new-gpu.html' }
        ]
      }
    ]
  },
  nvidia: {
    datacenter: [
      {
        name: 'Rubin CPX', timing: 'Expected late 2026',
        note: 'GPU designed for massive-context inference.',
        sources: [{ label: 'NVIDIA Rubin CPX announcement', url: 'https://nvidianews.nvidia.com/news/nvidia-unveils-rubin-cpx-a-new-class-of-gpu-designed-for-massive-context-inference' }]
      },
      {
        name: 'Rubin Ultra', timing: 'Systems planned H2 2027',
        note: 'Next Rubin GPU generation for data center systems.',
        sources: [{ label: 'NVIDIA GTC roadmap', url: 'https://blogs.nvidia.com/blog/nvidia-keynote-at-gtc-2025-ai-news-live-updates/' }]
      },
      {
        name: 'Feynman GPU architecture', timing: 'Roadmap 2028',
        note: 'Future data center GPU architecture on NVIDIA’s published roadmap.',
        sources: [
          { label: 'NVIDIA GTC 2026 roadmap', url: 'https://images.nvidia.com/nvimages/gtc/pdf/GTC26_SanJose_Highlights_Final.pdf' },
          { label: 'NVIDIA GTC recap', url: 'https://blogs.nvidia.com/blog/gtc-2026-news/' }
        ]
      }
    ],
    cpu: [
      {
        name: 'Rosa CPU', timing: 'Roadmap 2028',
        note: 'New CPU announced for NVIDIA’s Feynman generation.',
        sources: [
          { label: 'NVIDIA GTC recap', url: 'https://blogs.nvidia.com/blog/gtc-2026-news/' },
          { label: 'NVIDIA GTC 2026 roadmap', url: 'https://images.nvidia.com/nvimages/gtc/pdf/GTC26_SanJose_Highlights_Final.pdf' }
        ]
      }
    ]
  }
};

function dashboardRoadmapEntries(vendor, tab) {
  return DASHBOARD_ROADMAP[vendor]?.[tab] || [];
}

function dashboardRoadmapOfficialUrl(vendor, source) {
  try {
    const url = new URL(source);
    const domain = { amd: 'amd.com', intel: 'intel.com', nvidia: 'nvidia.com' }[vendor];
    if (url.protocol !== 'https:' || !domain ||
        (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`))) return '';
    return url.href;
  } catch { return ''; }
}

function dashboardRoadmapHtml(vendor, tab) {
  const entries = dashboardRoadmapEntries(vendor, tab);
  if (!entries.length) return '';
  const prefix = { amd: 'a2', intel: 'v2', nvidia: 'n2' }[vendor];
  if (!prefix) return '';
  const summary = entries.slice(0, 3).map(item => item.name).join(' · ') +
    (entries.length > 3 ? ` · +${entries.length - 3} more` : '');
  const cards = entries.map(item => {
    const links = (item.sources || []).map(source => {
      const url = dashboardRoadmapOfficialUrl(vendor, source.url);
      return url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${escHtml(source.label)} ↗</a>` : '';
    }).filter(Boolean).join('');
    return `<div class="sku-card dashboard-roadmap-card">
      <div class="sku-name">${escHtml(item.name)}</div>
      <div class="sku-desc">${escHtml(item.note)}</div>
      <div class="sku-tags"><span class="sku-tag">${escHtml(item.timing)}</span></div>
      <div class="dashboard-roadmap-links">${links}</div>
    </div>`;
  }).join('');
  return `<div class="arch-group dashboard-roadmap" id="${prefix}-roadmap"
               style="--arch-color:var(--vendor-accent)">
    <div class="arch-header unreleased-arch" data-gen="roadmap" role="button"
         tabindex="0" aria-expanded="false" aria-controls="${prefix}-roadmap-body">
      <div class="timeline-dot"></div>
      <div class="arch-name">Announced roadmap</div>
      <div class="arch-year">Future</div>
      <div class="v2-count">${entries.length} announced · 0 models</div>
      <span class="unreleased-badge">unreleased</span>
      <div class="expand-icon">⌄</div>
      <div class="arch-subtitle">${escHtml(summary)}</div>
    </div>
    <div class="arch-body" id="${prefix}-roadmap-body" inert>
      <div class="arch-body-inner">
        <div class="skus-grid">${cards}</div>
        <p class="dashboard-roadmap-disclaimer">Roadmap entries are not selectable model rows.</p>
      </div>
    </div>
  </div>`;
}

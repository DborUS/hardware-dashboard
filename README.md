# Hardware Portal

A comprehensive hub for navigating the modern Silicon landscape. This interactive web application provides detailed architectural timelines, specifications, and product information for Intel and AMD processors, as well as AMD GPU accelerators.

## Purpose

Hardware Portal serves as a centralized reference for understanding the evolution and current state of x86 CPU architectures and CDNA GPU accelerators. It provides technical professionals, enthusiasts, and researchers with quick access to:

- Historical and current processor architectures
- Detailed SKU specifications and segmentation
- Architectural relationships and generational progressions
- Market positioning and product differentiation

## Features

- **Multi-Vendor Coverage**: Intel CPUs, AMD CPUs (Zen family), AMD GPU Accelerators (CDNA)
- **Architectural Timeline**: Chronological view of processor generations and microarchitectures
- **Segment Filtering**: Desktop, mobile, server, embedded, and workstation categories
- **Brand Filtering**: Filter by product lines (Core, Xeon, Ryzen, EPYC, Threadripper, Instinct)
- **Search**: Real-time search across architectures, SKUs, and specifications
- **Expandable Specifications**: Detailed CPU/GPU spec tables with core counts, frequencies, TDP, and more
- **Performance Optimized**: CSS-based filtering, lazy-loaded data, sub-5ms filter operations

## Project Structure

```
hardware_portal/
├── index.html                      # Main entry point
├── css/
│   └── styles.css                  # Styling and animations
├── js/
│   ├── script.js                   # Application logic
│   └── data/                       # JSON data files (lazy-loaded)
│       ├── intel-data.json         # Intel CPU architectures
│       ├── amd-data.json           # AMD CPU architectures
│       ├── amd-gpu-data.json       # AMD GPU accelerators
│       └── amd-cpu-specs.json      # Detailed AMD CPU specifications
├── docs/
│   ├── PROJECT-STATE.md            # Living status + session log
│   ├── WORKFLOWS.md                # Step-by-step task recipes
│   ├── DESIGN-SYSTEM.md            # Colours, type, spacing, components
│   ├── DATA-SCHEMA.md              # JSON contracts
│   ├── MOBILE-TESTING.md           # Mobile test notes
│   └── AUDIT-2026-02-14.md         # Historical audit (superseded)
├── tools/
│   └── smoke-test.py               # Headless browser regression test
├── CLAUDE.md                       # Start here when working on this project
├── CHANGELOG.md                    # Version history and changes
└── README.md                       # Documentation
```

## Contributing

Before making changes, read [`CLAUDE.md`](CLAUDE.md) for architecture and conventions,
then [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) for current status.

Verify any change with the smoke test:

```bash
pip install playwright
python3 -m playwright install chromium-headless-shell
python3 tools/smoke-test.py --shots
```

## Deployment

### Local Development

Run a local web server in the project directory:

```bash
python3 -m http.server 8084
```

Access at `http://localhost:8084`

### Production Deployment

**GitHub Pages:**
1. Enable Pages in repository Settings
2. Select `main` branch and `/ (root)` directory
3. Site will be available at `https://username.github.io/repository-name/`

**Static Hosting:**
Upload all files to any static web host. The application requires no server-side processing or database. All data is loaded dynamically via JSON files.

## Data Management

Architecture and SKU data is stored in JSON files located in `js/data/`:

- **intel-data.json**: Intel CPU architectures and SKUs
- **amd-data.json**: AMD CPU architectures and SKUs
- **amd-gpu-data.json**: AMD GPU accelerators (CDNA)
- **amd-cpu-specs.json**: Detailed specifications for AMD CPUs

### Adding New Architectures

Edit the appropriate JSON file and add entries following the existing schema:

```json
{
  "id": "unique-identifier",
  "arch": "Architecture Name",
  "color": "#hexcolor",
  "year": "2024",
  "segment": "client|server|mobile|embedded",
  "defaultLinks": [{"label": "Source", "url": "https://..."}],
  "skus": [
    {
      "name": "Product SKU",
      "desc": "Description",
      "tags": ["desktop", "mobile"],
      "brand": "Product Line"
    }
  ]
}
```

Data is lazy-loaded on vendor switch and cached for performance.

## Technical Architecture

- **HTML5**: Semantic markup structure
- **CSS3**: Custom properties, animations, responsive design
- **Vanilla JavaScript**: Zero dependencies, pure ES6+
- **Performance**:
  - CSS-based filtering (95% faster than DOM re-rendering)
  - Debounced search (300ms)
  - DOM caching system
  - Lazy-loaded JSON data with caching
  - Sub-5ms filter operations

## Performance Metrics

- Initial load: ~200ms (excluding network)
- Filter/search: <5ms
- Vendor switch: ~200-300ms (includes data fetch on first load)
- Animation duration: 450ms

## Browser Compatibility

Modern browsers with ES6+ support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Sources

Architecture and specification data compiled from:
- Official vendor documentation and roadmaps
- Public processor specifications
- Industry announcements and technical publications
- Wikipedia and verified technical resources

## Repository

**GitHub**: https://github.com/DanchuBorchik/hardware-dashboard
**Live Site**: https://danchuborchik.github.io/hardware-dashboard/

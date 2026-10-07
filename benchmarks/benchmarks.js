(() => {
  'use strict';

  const enterpriseSuites = {
    '2026': {
      label: 'SPEC CPU 2026',
      guideUrl: 'https://www.spec.org/cpu2026/docs/overview.html',
      benchmarkUrl: 'https://www.spec.org/cpu2026/',
      resultsUrl: 'https://www.spec.org/cpu2026/results/cpu2026/',
      metrics: {
        integer: {
          key: 'enterprise2026Integer',
          url: '../js/data/enterprise-benchmark-2026-int-sample.json',
          name: 'SPECrate2026_int_base',
          label: 'Integer Rate (throughput)',
          shortLabel: 'SPEC 2026 INT RATE · BASE',
          officialResultsUrl: 'https://www.spec.org/cpu2026/results/rint2026/',
          description: 'Runs concurrent copies of 14 compute-intensive integer programs, including chess search, language compilers, and database work. A higher score means more throughput from the tested system.',
        },
        floating: {
          key: 'enterprise2026Floating',
          url: '../js/data/enterprise-benchmark-2026-fp-sample.json',
          name: 'SPECrate2026_fp_base',
          label: 'Floating-point Rate (throughput)',
          shortLabel: 'SPEC 2026 FP RATE · BASE',
          officialResultsUrl: 'https://www.spec.org/cpu2026/results/rfp2026/',
          description: 'Runs concurrent copies of 12 compute-intensive floating-point programs, including fluid dynamics, ocean modeling, and astrophysics. A higher score means more throughput from the tested system.',
        },
      },
    },
    '2017': {
      label: 'SPEC CPU 2017',
      guideUrl: 'https://www.spec.org/cpu2017/Docs/overview.html',
      benchmarkUrl: 'https://www.spec.org/cpu2017/',
      resultsUrl: 'https://www.spec.org/cpu2017/results/',
      metrics: {
        integer: {
          key: 'enterprise2017Integer',
          url: '../js/data/enterprise-benchmark-sample.json',
          name: 'SPECrate2017_int_base',
          label: 'Integer Rate (throughput)',
          shortLabel: 'SPEC 2017 INT RATE · BASE',
          officialResultsUrl: 'https://www.spec.org/cpu2017/results/rint2017/',
          description: 'Runs concurrent copies of 10 compute-intensive integer programs, including compilation, compression, and route planning. A higher score means more throughput from the tested system.',
        },
        floating: {
          key: 'enterprise2017Floating',
          url: '../js/data/enterprise-benchmark-fp-sample.json',
          name: 'SPECrate2017_fp_base',
          label: 'Floating-point Rate (throughput)',
          shortLabel: 'SPEC 2017 FP RATE · BASE',
          officialResultsUrl: 'https://www.spec.org/cpu2017/results/rfp2017/',
          description: 'Runs concurrent copies of 13 compute-intensive floating-point programs, including fluid dynamics, molecular dynamics, and weather modeling. A higher score means more throughput from the tested system.',
        },
      },
    },
  };
  const enterpriseConfigs = Object.values(enterpriseSuites).flatMap(suite => Object.values(suite.metrics));
  const acceleratorTests = {
    server: {
      key: 'acceleratorServer',
      url: '../js/data/enterprise-benchmark-mlperf-v6-server-sample.json',
      metric: 'MLPerf_Inference_v6.0_llama2-70b-99_Server_Tokens_per_second',
      scenario: 'Server',
      label: 'Request stream',
      description: 'Requests arrive over time. The MLPerf Server scenario measures throughput while meeting response-time limits. Scores are whole-system Tokens/s for eight accelerators running Llama 2 70B at the 99% quality target.',
    },
    offline: {
      key: 'acceleratorOffline',
      url: '../js/data/enterprise-benchmark-mlperf-v6-offline-sample.json',
      metric: 'MLPerf_Inference_v6.0_llama2-70b-99_Offline_Tokens_per_second',
      scenario: 'Offline',
      label: 'Batch processing',
      description: 'All requests are available at the start. The MLPerf Offline scenario measures how quickly the system processes the batch, without a per-request latency limit. Scores are whole-system Tokens/s for eight accelerators running Llama 2 70B at the 99% quality target.',
    },
  };
  const dataUrls = Object.fromEntries([
    ...enterpriseConfigs.map(metric => [metric.key, metric.url]),
    ...Object.values(acceleratorTests).map(test => [test.key, test.url]),
    ['blender', '../js/data/benchmark-sample.json'],
  ]);
  const enterpriseConfigByKey = Object.fromEntries(enterpriseConfigs.map(metric => [metric.key, metric]));
  const acceleratorConfigByKey = Object.fromEntries(Object.values(acceleratorTests).map(test => [test.key, test]));
  const catalogMetricConfigs = [
    ...['2026', '2017'].flatMap(year => Object.values(enterpriseSuites[year].metrics).map(metric => ({ name: metric.name, label: `${enterpriseSuites[year].label} · ${metric.label}`, units: 'base rate' }))),
    ...Object.values(acceleratorTests).map(test => ({ name: test.metric, label: `MLPerf® Inference v6.0 · ${test.scenario}`, units: 'Tokens/s' })),
    { name: 'median samples per minute', label: 'Blender Open Data · rendering', units: 'median samples/min' },
  ];
  const catalogMetricInfo = Object.fromEntries(catalogMetricConfigs.map((metric, order) => [metric.name, { ...metric, order }]));
  const catalogDataKeyByMetric = Object.fromEntries([
    ...enterpriseConfigs.map(metric => [metric.name, metric.key]),
    ...Object.values(acceleratorTests).map(test => [test.metric, test.key]),
    ['median samples per minute', 'blender'],
  ]);
  const catalogTypeLabels = { enterprise: 'Enterprise CPUs', accelerator: 'Datacenter accelerators', client: 'Client CPUs', graphics: 'Graphics' };
  const catalogTypeTabs = {
    enterprise: ['amd/epyc', 'intel/xeon', 'nvidia/cpu', 'ampere/processors'],
    accelerator: ['nvidia/datacenter'],
    client: ['amd/ryzen', 'intel/client'],
    graphics: ['intel/graphics', 'nvidia/geforce'],
  };
  const formatScore = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  const initialView = new URLSearchParams(location.search);
  let viewReady = false;
  const mainContent = document.getElementById('mainContent');
  mainContent.inert = true;
  mainContent.setAttribute('aria-busy', 'true');
  const elements = {
    returnProductsLink: document.getElementById('returnProductsLink'),
    modeButtons: [...document.querySelectorAll('.benchmark-mode-button')],
    suiteButtons: [...document.querySelectorAll('.benchmark-suite-button')],
    metricButtons: [...document.querySelectorAll('#enterpriseMetricSwitch .benchmark-test-button')],
    acceleratorTestButtons: [...document.querySelectorAll('.benchmark-accelerator-test-button')],
    enterpriseTestControls: document.getElementById('enterpriseTestControls'),
    acceleratorTestControls: document.getElementById('acceleratorTestControls'),
    enterpriseMetricSwitch: document.getElementById('enterpriseMetricSwitch'),
    benchmarkPickerTitle: document.getElementById('benchmarkPickerTitle'),
    metricDescriptions: {
      integer: document.getElementById('integerMetricDescription'),
      floating: document.getElementById('floatingMetricDescription'),
    },
    testDescription: document.getElementById('testDescription'),
    workloadQuestion: document.getElementById('workloadQuestion'),
    testGuideLink: document.getElementById('testGuideLink'),
    workbenchTitle: document.getElementById('workbenchTitle'),
    metricNote: document.getElementById('metricNote'),
    socketField: document.getElementById('socketField'),
    specBuildField: document.getElementById('specBuildField'),
    specBuildSelect: document.getElementById('specBuildSelect'),
    socketSelect: document.getElementById('socketSelect'),
    manufacturerField: document.getElementById('manufacturerField'),
    manufacturerHelp: document.getElementById('manufacturerHelp'),
    clientSegmentControls: document.getElementById('clientSegmentControls'),
    clientSegmentNote: document.getElementById('clientSegmentNote'),
    manufacturerSelect: document.getElementById('manufacturerSelect'),
    coreField: document.getElementById('coreField'),
    coreMin: document.getElementById('coreMin'),
    coreMax: document.getElementById('coreMax'),
    coreMinValue: document.getElementById('coreMinValue'),
    coreMaxValue: document.getElementById('coreMaxValue'),
    coreFieldHint: document.getElementById('coreFieldHint'),
    versionField: document.getElementById('versionField'),
    computeField: document.getElementById('computeField'),
    versionSelect: document.getElementById('versionSelect'),
    computeSelect: document.getElementById('computeSelect'),
    modelSearch: document.getElementById('modelSearch'),
    filterStatus: document.getElementById('filterStatus'),
    enterpriseFocus: document.getElementById('enterpriseFocus'),
    focusModelQuery: document.getElementById('focusModelQuery'),
    focusModelSelect: document.getElementById('focusModelSelect'),
    focusPeerSelect: document.getElementById('focusPeerSelect'),
    focusOverview: document.getElementById('focusOverview'),
    focusStatus: document.getElementById('focusStatus'),
    coverageCount: document.getElementById('coverageCount'),
    coverageLabel: document.getElementById('coverageLabel'),
    sourceName: document.getElementById('sourceName'),
    snapshotLabel: document.getElementById('snapshotLabel'),
    snapshotDate: document.getElementById('snapshotDate'),
    coverageMix: document.getElementById('coverageMix'),
    rankingCount: document.getElementById('rankingCount'),
    rankingUpdatedDate: document.getElementById('rankingUpdatedDate'),
    rankingIntro: document.getElementById('rankingIntro'),
    rankedResultsViewport: document.getElementById('rankedResultsViewport'),
    rankedResults: document.getElementById('rankedResults'),
    rankingScrollHint: document.getElementById('rankingScrollHint'),
    rankingScrollCount: document.getElementById('rankingScrollCount'),
    modelChartDisclosure: document.getElementById('modelChartDisclosure'),
    modelChartDescription: document.getElementById('modelChartDescription'),
    modelChartMetric: document.getElementById('modelChartMetric'),
    modelChartSelectionLegend: document.getElementById('modelChartSelectionLegend'),
    modelChartRangeButton: document.getElementById('modelChartRangeButton'),
    modelChartViewport: document.getElementById('modelChartViewport'),
    modelChartPlot: document.getElementById('modelChartPlot'),
    modelChartScrollHint: document.getElementById('modelChartScrollHint'),
    modelChartStatus: document.getElementById('modelChartStatus'),
    comparisonDiagram: document.getElementById('comparisonDiagram'),
    comparisonInsight: document.getElementById('comparisonInsight'),
    comparisonIntro: document.getElementById('comparisonIntro'),
    comparisonTitle: document.getElementById('comparisonTitle'),
    baselineLabelText: document.getElementById('baselineLabelText'),
    baselineSelect: document.getElementById('baselineSelect'),
    clearComparison: document.getElementById('clearComparison'),
    datasetLink: document.getElementById('datasetLink'),
    cohortNote: document.getElementById('cohortNote'),
    benchmarkScope: document.getElementById('benchmarkScope'),
    benchmarkScopeLabel: document.getElementById('benchmarkScopeLabel'),
    benchmarkScopeText: document.getElementById('benchmarkScopeText'),
    benchmarkScopeLink: document.getElementById('benchmarkScopeLink'),
    methodIntro: document.getElementById('methodIntro'),
    methodSource: document.getElementById('methodSource'),
    methodCohort: document.getElementById('methodCohort'),
    methodCoverage: document.getElementById('methodCoverage'),
    specAttribution: document.getElementById('specAttribution'),
    specBenchmarkLink: document.getElementById('specBenchmarkLink'),
    mlperfAttribution: document.getElementById('mlperfAttribution'),
    mlperfTrademarkNotice: document.getElementById('mlperfTrademarkNotice'),
    mlperfFootnoteContext: document.getElementById('mlperfFootnoteContext'),
    mlperfOfficialLink: document.getElementById('mlperfOfficialLink'),
    mlperfRetrievedDate: document.getElementById('mlperfRetrievedDate'),
    mlperfGuidelinesLink: document.getElementById('mlperfGuidelinesLink'),
    catalogMatchedCount: document.getElementById('catalogMatchedCount'),
    catalogTotalCount: document.getElementById('catalogTotalCount'),
    catalogCoverageNote: document.getElementById('catalogCoverageNote'),
    catalogAllButton: document.getElementById('catalogAllButton'),
    catalogTypeButtons: [...document.querySelectorAll('.benchmark-catalog-type-button')],
    catalogSearch: document.getElementById('catalogSearch'),
    catalogStatus: document.getElementById('catalogStatus'),
    catalogResultStatus: document.getElementById('catalogResultStatus'),
    catalogPageStatus: document.getElementById('catalogPageStatus'),
    catalogResults: document.getElementById('catalogResults'),
    catalogMore: document.getElementById('catalogMore'),
    catalogMlperfAttribution: document.getElementById('catalogMlperfAttribution'),
    catalogSpecAttribution: document.getElementById('catalogSpecAttribution'),
  };

  const state = {
    datasets: Object.fromEntries(Object.keys(dataUrls).map(key => [key, { results: [], meta: {}, error: false }])),
    section: 'results',
    display: 'chart',
    mode: 'enterprise',
    clientSegment: 'all',
    suite: '2026',
    specBuild: '',
    rankingLimit: 100,
    metric: 'integer',
    scenario: 'server',
    cpuCount: 1,
    manufacturer: '',
    coreLo: 0,
    coreHi: 0,
    version: '',
    compute: '',
    selected: [],
    baseline: null,
    search: '',
    focusModelKey: null,
    focusPeerKey: null,
    focusQuery: '',
    showAllChartModels: false,
    catalog: { products: [], meta: {}, resultsByProduct: new Map(), productByClaim: new Map(), error: false },
    catalogType: 'all',
    catalogStatus: 'all',
    catalogSearch: '',
    catalogShown: 25,
  };
  let rankingScrollKey = '';
  let rankingVisibleCount = 0;
  let modelChartScrollKey = '';

  function safeHttpsUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : null;
    } catch { return null; }
  }

  function restoreProductsLink() {
    const home = new URL('../', location.href);
    const homeFile = new URL('../index.html', location.href);
    const storageKey = 'chipindex-last-product-url';
    const productViews = {
      'amd/enterprise': ['amd', 'epyc', 'AMD EPYC specs'],
      'amd/client': ['amd', 'ryzen', 'AMD Ryzen specs'],
      'amd/accelerator': ['amd', 'gpu', 'AMD GPU specs'],
      'amd/graphics': ['amd', 'gpu', 'AMD GPU specs'],
      'intel/enterprise': ['intel', 'xeon', 'Intel Xeon specs'],
      'intel/client': ['intel', 'client', 'Intel client specs'],
      'intel/graphics': ['intel', 'graphics', 'Intel graphics specs'],
      'nvidia/enterprise': ['nvidia', 'cpu', 'NVIDIA CPU specs'],
      'nvidia/accelerator': ['nvidia', 'datacenter', 'NVIDIA data center specs'],
      'nvidia/graphics': ['nvidia', 'geforce', 'NVIDIA GeForce specs'],
      'ampere/enterprise': ['ampere', 'processors', 'Ampere CPU specs'],
    };
    function validHome(value) {
      try {
        const url = new URL(value);
        return url.origin === home.origin &&
          (url.pathname === home.pathname || url.pathname === homeFile.pathname) ? url : null;
      } catch { return null; }
    }
    const recent = validHome(document.referrer);
    if (recent) {
      try { sessionStorage.setItem(storageKey, recent.href); } catch { /* storage may be disabled */ }
    }
    let remembered = null;
    try { remembered = validHome(sessionStorage.getItem(storageKey)); } catch { /* storage may be disabled */ }
    const requestedView = productViews[`${(initialView.get('manufacturer') || '').toLowerCase()}/${initialView.get('mode') || ''}`];
    const fallback = new URL(home.href);
    if (requestedView) {
      fallback.searchParams.set('vendor', requestedView[0]);
      fallback.searchParams.set('tab', requestedView[1]);
    }
    const destination = new URL((recent || (requestedView ? fallback : remembered) || home).href);
    destination.pathname = home.pathname;
    destination.searchParams.set('site', '20261007-shared-shell-2');
    elements.returnProductsLink.href = destination.href;
    const vendor = destination.searchParams.get('vendor');
    const tab = destination.searchParams.get('tab');
    const matchedView = Object.values(productViews).find(view => view[0] === vendor && view[1] === tab);
    const label = matchedView?.[2] || 'Products';
    elements.returnProductsLink.textContent = `← ${label}`;
    elements.returnProductsLink.setAttribute('aria-label', `Open ${label.toLowerCase()} in ChipIndex`);
  }

  function canonicalResultId(prefix, sourceUrl) {
    const url = new URL(sourceUrl);
    url.hash = '';
    url.searchParams.sort();
    return `${prefix}:${url.href}`;
  }

  function normalizedBlenderResult(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const deviceType = String(raw.deviceType || '').trim().toUpperCase();
    const model = String(raw.model || '').trim();
    const vendor = String(raw.vendor || '').trim();
    const score = Number(raw.score);
    const sourceUrl = safeHttpsUrl(raw.sourceUrl);
    if (!['CPU', 'GPU'].includes(deviceType) || !model || !vendor || !Number.isFinite(score) || score <= 0 || !sourceUrl) return null;
    const sampleValue = Number(raw.samples);
    const sourcedCoreCount = Number(raw.coreCount);
    const deviceSegments = raw.deviceSegments;
    if (deviceType === 'CPU' && (!Array.isArray(deviceSegments) ||
        deviceSegments.some(segment => !['desktop', 'laptop'].includes(segment)) ||
        new Set(deviceSegments).size !== deviceSegments.length)) return null;
    return {
      id: canonicalResultId("blender", sourceUrl),
      model,
      vendor,
      productLine: String(raw.productLine || '').trim(),
      deviceType,
      deviceSegments: deviceType === 'CPU' ? [...deviceSegments] : [],
      coreCount: deviceType === 'CPU' && Number.isInteger(sourcedCoreCount) && sourcedCoreCount > 0 ? sourcedCoreCount : null,
      metric: 'median samples per minute',
      score,
      samples: Number.isInteger(sampleValue) && sampleValue > 0 ? sampleValue : null,
      blenderVersion: String(raw.blenderVersion || 'Unspecified').trim() || 'Unspecified',
      computeType: String(raw.computeType || 'Unspecified').trim() || 'Unspecified',
      sourceUrl,
    };
  }

  function normalizedEnterpriseResult(raw, key) {
    if (!raw || typeof raw !== 'object') return null;
    const model = String(raw.model || '').trim();
    const vendor = String(raw.vendor || '').trim();
    const systemName = String(raw.systemName || '').trim();
    const sponsor = String(raw.testSponsor || '').trim();
    const score = Number(raw.score);
    const cpuCount = Number(raw.cpuCount);
    const enabledCores = Number(raw.enabledCores);
    const sourceUrl = safeHttpsUrl(raw.sourceUrl);
    const metric = String(raw.metric || '').trim();
    const expectedMetric = enterpriseConfigByKey[key].name;
    if (!model || !vendor || !systemName || !sponsor || !sourceUrl || metric !== expectedMetric || !Number.isFinite(score) || score <= 0 || !Number.isInteger(cpuCount) || cpuCount <= 0) return null;
    return {
      id: canonicalResultId(key, sourceUrl),
      model,
      vendor,
      productLine: String(raw.productLine || '').trim(),
      systemName,
      sponsor,
      score,
      cpuCount,
      coreCount: Number.isInteger(enabledCores) && enabledCores > 0 && enabledCores % cpuCount === 0 ? enabledCores / cpuCount : null,
      sourceUrl,
      testedComponent: raw.testedComponent === 'CPU' ? 'CPU component' : '',
      baseCopies: Number.isInteger(raw.baseCopies) && raw.baseCopies > 0 ? raw.baseCopies : null,
      benchmarkVersion: String(raw.benchmarkVersion || '').trim() || 'See source',
      metric,
      enabledCores: Number.isInteger(enabledCores) && enabledCores > 0 ? enabledCores : null,
      memory: String(raw.memory || '').trim(),
      operatingSystem: String(raw.operatingSystem || '').trim(),
      compiler: String(raw.compiler || '').trim(),
      publishedDate: String(raw.publishedDate || '').trim(),
      testDate: String(raw.testDate || '').trim(),
    };
  }

  function normalizedAcceleratorResult(raw, meta, test) {
    if (!raw || typeof raw !== 'object') return null;
    const model = String(raw.model || '').trim();
    const vendor = String(raw.vendor || '').trim();
    const systemName = String(raw.systemName || '').trim();
    const submitter = String(raw.submitter || '').trim();
    const resultId = String(raw.resultId || '').trim();
    const score = Number(raw.score);
    const acceleratorCount = Number(raw.acceleratorCount);
    const nodes = Number(raw.nodes);
    const sourceUrl = safeHttpsUrl(raw.sourceUrl);
    const summaryUrl = safeHttpsUrl(raw.summaryUrl);
    if (!model || !vendor || !systemName || !submitter || !resultId || !sourceUrl || !summaryUrl || !Number.isFinite(score) || score <= 0 || acceleratorCount !== 8 || nodes !== 1 || Number(raw.errors) !== 0 || Number(raw.inferred) !== 0 || raw.compliance !== 'closed') return null;
    if (raw.metric !== meta.metric || raw.benchmarkVersion !== meta.benchmarkVersion || raw.division !== meta.division || raw.availability !== meta.availability || raw.workload !== meta.workload || raw.scenario !== meta.scenario || raw.units !== meta.units || acceleratorCount !== Number(meta.acceleratorCount)) return null;
    return {
      id: `${test.key}:${resultId}`,
      model,
      vendor,
      productLine: String(raw.productLine || '').trim(),
      score,
      sourceUrl,
      summaryUrl,
      resultId,
      submitter,
      systemName,
      platform: String(raw.platform || '').trim(),
      sourceAcceleratorName: String(raw.sourceAcceleratorName || '').trim(),
      acceleratorCount,
      nodes,
      units: String(raw.units || '').trim(),
      metric: String(raw.metric || '').trim(),
      benchmarkVersion: String(raw.benchmarkVersion || '').trim(),
      division: String(raw.division || '').trim(),
      availability: String(raw.availability || '').trim(),
      workload: String(raw.workload || '').trim(),
      scenario: String(raw.scenario || '').trim(),
      precision: String(raw.precision || '').trim(),
      hostProcessor: String(raw.hostProcessor || '').trim(),
      operatingSystem: String(raw.operatingSystem || '').trim(),
      software: String(raw.software || '').trim(),
      sourceLocation: String(raw.sourceLocation || '').trim(),
      retrievedDate: String(raw.retrievedDate || '').trim(),
    };
  }

  function validAcceleratorCohort(meta, test) {
    return meta?.metric === test.metric &&
      meta.benchmarkVersion === 'MLPerf Inference v6.0' && meta.suite === 'datacenter' &&
      meta.division === 'closed' && meta.availability === 'available' &&
      meta.workload === 'llama2-70b-99' && meta.scenario === test.scenario &&
      meta.qualityTarget === '99%' && Number(meta.acceleratorCount) === 8 && meta.units === 'Tokens/s';
  }

  function catalogTypesFor(product) {
    const tabs = new Set(product.dashboardTabs);
    const types = Object.keys(catalogTypeLabels).filter(type => catalogTypeTabs[type].some(tab => tabs.has(tab)));
    if (tabs.has('amd/gpu')) {
      types.push(product.sourceSegment === 'datacenter' ? 'accelerator' : 'graphics');
    }
    return [...new Set(types)];
  }

  function normalizedCatalogProduct(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    const vendor = String(raw.vendor || '').trim();
    const model = String(raw.model || '').trim();
    const productId = String(raw.productId || '').trim();
    const dashboardTabs = Array.isArray(raw.dashboardTabs) ? raw.dashboardTabs.map(tab => String(tab).trim()) : [];
    const snapshotMetrics = Array.isArray(raw.snapshotMetrics) ? raw.snapshotMetrics.map(metric => String(metric).trim()) : [];
    const placements = Array.isArray(raw.placements) ? raw.placements : [];
    if (!id || !vendor || !model || !dashboardTabs.length || !placements.length || raw.catalogEligibility !== 'displayed-spec-row' || raw.commercialReleaseStatus !== 'unverified') return null;
    if (new Set(dashboardTabs).size !== dashboardTabs.length || new Set(snapshotMetrics).size !== snapshotMetrics.length || snapshotMetrics.some(metric => !Object.hasOwn(catalogMetricInfo, metric))) return null;
    if (placements.some(placement => !placement || !dashboardTabs.includes(placement.dashboardTab)) || new Set(placements.map(placement => placement.dashboardTab)).size !== dashboardTabs.length) return null;
    const sourceSegment = String(raw.sourceSegment || '').trim();
    let productSpecs = null;
    if (raw.productSpecs !== undefined) {
      const spec = raw.productSpecs;
      const fields = ['coreLabel', 'clockLabel', 'powerLabel'];
      if (!spec || typeof spec !== 'object' || Array.isArray(spec) ||
          Object.keys(spec).some(field => !fields.includes(field)) ||
          fields.some(field => Object.hasOwn(spec, field) && typeof spec[field] !== 'string')) return null;
      productSpecs = Object.fromEntries(fields.map(field => [field, (spec[field] || '').trim()]));
      if (!Object.values(productSpecs).some(Boolean) ||
          Object.values(productSpecs).some(value => value.length > 140 || value.includes(String.fromCharCode(10)) || value.includes(String.fromCharCode(13)))) return null;
    }
    const product = { id, vendor, model, productId, dashboardTabs, snapshotMetrics, placements, sourceSegment, sourceSeries: String(raw.sourceSeries || '').trim(), productSpecs };
    product.types = catalogTypesFor(product);
    if (!product.types.length) return null;
    product.searchText = `${vendor} ${model} ${productId} ${product.sourceSeries} ${dashboardTabs.join(' ')}`.toLowerCase();
    return product;
  }

  function catalogClaimKey(vendor, model, metric) {
    return JSON.stringify([vendor.trim().toLowerCase(), model.trim().toLowerCase(), metric]);
  }

  function catalogTabLabel(tab) {
    const labels = {
      'amd/epyc': 'AMD / EPYC', 'amd/ryzen': 'AMD / Ryzen', 'amd/gpu': 'AMD / GPU',
      'intel/xeon': 'Intel / Xeon', 'intel/client': 'Intel / Client', 'intel/graphics': 'Intel / Graphics',
      'nvidia/datacenter': 'NVIDIA / Data Center', 'nvidia/geforce': 'NVIDIA / GeForce',
      'nvidia/cpu': 'NVIDIA / CPU', 'ampere/processors': 'Ampere / Processors',
    };
    return labels[tab] || tab;
  }

  function dashboardProductUrl(product) {
    const [vendor, tab] = product.dashboardTabs[0].split('/');
    const url = new URL('../', location.href);
    url.searchParams.set('site', '20261007-shared-shell-2');
    url.searchParams.set('vendor', vendor);
    url.searchParams.set('tab', tab);
    url.searchParams.set('q', product.model);
    return url.href;
  }

  function productForResult(result) {
    return state.catalog.productByClaim?.get(catalogClaimKey(result.vendor, result.model, result.metric)) || null;
  }

  function productSpecText(product) {
    if (!product?.productSpecs || !product.types.some(type => type === 'enterprise' || type === 'client')) return '';
    const { coreLabel, clockLabel, powerLabel } = product.productSpecs;
    return [coreLabel, clockLabel, powerLabel].filter(Boolean).join(' · ');
  }

  function productSpecNode(product, tag = 'div', linked = false) {
    const specs = productSpecText(product);
    if (!specs) return null;
    const node = createElement(tag, 'benchmark-product-specs', `Catalog CPU specs · ${specs}`);
    if (linked) {
      const link = createElement('a', 'benchmark-product-spec-link', 'Product specs ↗');
      link.href = dashboardProductUrl(product);
      link.setAttribute('aria-label', `View dashboard product specifications for ${product.vendor} ${product.model}`);
      node.append(link);
    }
    return node;
  }

  function resultSpecNode(result, tag = 'div', linked = false) {
    if (!isEnterprise() && state.mode !== 'client') return null;
    return productSpecNode(productForResult(result), tag, linked);
  }

  function catalogStatusFor(product) {
    if (state.catalog.resultsByProduct.get(product.id)?.length) return 'matched';
    if (product.snapshotMetrics.some(metric => state.datasets[catalogDataKeyByMetric[metric]].error)) return 'unavailable';
    return 'unscored';
  }

  async function loadCatalog() {
    try {
      const payload = await fetchJson('../js/data/benchmark-catalog.json');
      const meta = payload?.meta;
      if (!meta || !Array.isArray(payload.products) || !Number.isInteger(meta.uniqueCatalogProducts) ||
        !Number.isInteger(meta.displayedPlacements) || !Number.isInteger(meta.productsInCurrentSnapshots)) throw new Error('Invalid catalog metadata');
      const products = payload.products.map(normalizedCatalogProduct);
      if (products.some(product => !product) || products.length !== meta.uniqueCatalogProducts ||
        new Set(products.map(product => product.id)).size !== products.length ||
        products.reduce((sum, product) => sum + product.placements.length, 0) !== meta.displayedPlacements ||
        products.filter(product => product.snapshotMetrics.length).length !== meta.productsInCurrentSnapshots) throw new Error('Catalog count or row mismatch');
      const claims = new Map();
      const productByClaim = new Map();
      products.forEach(product => product.snapshotMetrics.forEach(metric => {
        const key = catalogClaimKey(product.vendor, product.model, metric);
        if (claims.has(key)) throw new Error('Ambiguous catalog score match');
        claims.set(key, product.id);
        productByClaim.set(key, product);
      }));
      if (!Array.isArray(meta.benchmarkSnapshots) || meta.benchmarkSnapshots.length !== catalogMetricConfigs.length ||
        meta.benchmarkSnapshots.some(snapshot => !Object.hasOwn(catalogMetricInfo, snapshot.metric) ||
          products.filter(product => product.snapshotMetrics.includes(snapshot.metric)).length !== snapshot.coveredProducts)) throw new Error('Snapshot coverage mismatch');
      const resultsByProduct = new Map();
      Object.values(state.datasets).forEach(dataset => {
        if (dataset.error) return;
        dataset.results.forEach(result => {
          const productId = claims.get(catalogClaimKey(result.vendor, result.model, result.metric));
          if (!productId) throw new Error('Benchmark result does not uniquely match a catalog product');
          if (!resultsByProduct.has(productId)) resultsByProduct.set(productId, []);
          resultsByProduct.get(productId).push(result);
        });
      });
      products.forEach(product => product.snapshotMetrics.forEach(metric => {
        if (!state.datasets[catalogDataKeyByMetric[metric]].error &&
          !resultsByProduct.get(product.id)?.some(result => result.metric === metric)) throw new Error('Missing score for catalog claim');
      }));
      state.catalog = { products, meta, resultsByProduct, productByClaim, error: false };
    } catch {
      state.catalog = { products: [], meta: {}, resultsByProduct: new Map(), productByClaim: new Map(), error: true };
    }
    renderCatalog();
  }

  function sortedResults(list) {
    return [...list].sort((a, b) => b.score - a.score || a.model.localeCompare(b.model));
  }

  function modelKey(result) {
    return JSON.stringify([result.vendor.toLowerCase(), result.model.toLowerCase()]);
  }

  /** The lower middle linked report is a stable disclosure, never a computed CPU score. */
  function modelEvidence(list) {
    const groups = new Map();
    for (const result of list) {
      const key = modelKey(result);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(result);
    }
    return [...groups].map(([key, reports]) => {
      reports.sort((a, b) => a.score - b.score || a.sourceUrl.localeCompare(b.sourceUrl));
      const representative = isEnterprise()
        ? reports[Math.floor((reports.length - 1) / 2)]
        : reports[reports.length - 1];
      return { key, reports, representative, minimum: reports[0].score, maximum: reports[reports.length - 1].score };
    }).sort((a, b) => b.representative.score - a.representative.score || a.representative.model.localeCompare(b.representative.model));
  }

  let modelEvidenceViewKey = null;
  let modelEvidenceViewGroups = [];
  function visibleModelEvidence() {
    const key = activeViewKey();
    if (modelEvidenceViewKey !== key) {
      modelEvidenceViewKey = key;
      modelEvidenceViewGroups = modelEvidence(visibleResults());
    }
    return modelEvidenceViewGroups;
  }

  /** The ranking and model chart share the exact same searched result set. */
  function visibleResults(cohort = cohortResults()) {
    return cohort.filter(result => `${result.model} ${result.vendor} ${result.productLine} ${result.submitter || ''} ${result.systemName || ''} ${result.platform || ''} ${result.resultId || ''}`.toLowerCase().includes(state.search));
  }

  function activeViewKey() {
    return JSON.stringify([state.mode, state.clientSegment, state.suite, state.specBuild, state.metric, state.scenario, state.cpuCount, state.manufacturer, state.coreLo, state.coreHi, state.version, state.compute, state.search]);
  }

  function formatRatio(score, baselineScore) {
    if (score === baselineScore) return '1.00×';
    const ratio = score / baselineScore;
    for (let digits = 2; digits <= 6; digits += 1) {
      const rounded = ratio.toFixed(digits);
      if (Number(rounded) !== 1) return `${rounded}×`;
    }
    return `${score > baselineScore ? '>' : '<'}1.00×`;
  }

  function displayBenchmarkVersion(result) {
    return result.resultId ? result.benchmarkVersion.replace(/^MLPerf(?=\s)/, 'MLPerf®') : result.benchmarkVersion;
  }

  function isEnterprise() { return state.mode === 'enterprise'; }
  function isAccelerator() { return state.mode === 'accelerator'; }
  function enterpriseSuite() { return enterpriseSuites[state.suite]; }
  function enterpriseMetric() { return enterpriseSuite().metrics[state.metric]; }
  function acceleratorTest() { return acceleratorTests[state.scenario]; }
  function activeDataset() { return state.datasets[isEnterprise() ? enterpriseMetric().key : isAccelerator() ? acceleratorTest().key : 'blender']; }
  function enterpriseBuildResults() {
    return activeDataset().results.filter(result => state.suite !== '2026' || result.benchmarkVersion === state.specBuild);
  }
  function syncSpecBuild() {
    if (!isEnterprise()) return;
    const builds = [...new Set(activeDataset().results.map(result => result.benchmarkVersion))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (!builds.includes(state.specBuild)) state.specBuild = builds[0] || '';
  }
  function deviceResults() {
    const device = state.mode === 'graphics' ? 'GPU' : 'CPU';
    return state.datasets.blender.results.filter(result => result.deviceType === device);
  }
  function versionResults() { return deviceResults().filter(result => result.blenderVersion === state.version); }
  function unfilteredCohortResults() {
    return isEnterprise()
      ? sortedResults(enterpriseBuildResults().filter(result => result.cpuCount === state.cpuCount))
      : isAccelerator()
        ? sortedResults(activeDataset().results)
      : sortedResults(versionResults().filter(result => result.computeType === state.compute &&
          (state.mode !== 'client' || state.clientSegment === 'all' || result.deviceSegments.includes(state.clientSegment))));
  }

  /** Core stops come only from exact, positive counts attached to benchmark models. */
  function coreStops() {
    if (!isEnterprise() && state.mode !== 'client') return [];
    return [...new Set(unfilteredCohortResults().map(result => result.coreCount).filter(count => Number.isInteger(count) && count > 0))]
      .sort((a, b) => a - b);
  }

  function cohortResults() {
    const stops = coreStops();
    const limitedCores = stops.length > 1 && (state.coreLo > 0 || state.coreHi < stops.length - 1);
    const minimum = stops[state.coreLo];
    const maximum = stops[state.coreHi];
    return unfilteredCohortResults().filter(result =>
      (!state.manufacturer || result.vendor === state.manufacturer) &&
      (!limitedCores || (result.coreCount !== null && result.coreCount >= minimum && result.coreCount <= maximum)));
  }

  /** Keep vendor selection only when it exists in the new test and reset the core span. */
  function syncCohortFilters(clearManufacturer = false) {
    state.focusQuery = '';
    elements.focusModelQuery.value = '';
    const vendors = new Set(unfilteredCohortResults().map(result => result.vendor));
    if (clearManufacturer || !vendors.has(state.manufacturer)) state.manufacturer = '';
    const stops = coreStops();
    state.coreLo = 0;
    state.coreHi = Math.max(0, stops.length - 1);
  }

  function mostPopulated(list, field) {
    const counts = new Map();
    list.forEach(item => counts.set(item[field], (counts.get(item[field]) || 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0], undefined, { numeric: true }))[0]?.[0] || '';
  }

  function setOptions(select, values, selected, emptyLabel) {
    select.replaceChildren();
    if (!values.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = emptyLabel;
      select.append(option);
      select.disabled = true;
      return;
    }
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
    select.value = selected;
    select.disabled = values.length === 1;
  }

  function resetSelection() {
    state.selected = [];
    state.baseline = null;
  }

  function selectMode(mode) {
    if (!['enterprise', 'accelerator', 'client', 'graphics'].includes(mode)) return;
    state.mode = mode;
    syncSpecBuild();
    const counts = enterpriseBuildResults().map(result => result.cpuCount);
    if (isEnterprise() && !counts.includes(state.cpuCount)) state.cpuCount = counts.includes(1) ? 1 : counts[0] || 1;
    state.showAllChartModels = false;
    if (!isEnterprise() && !isAccelerator()) {
      state.version = mostPopulated(deviceResults(), 'blenderVersion');
      state.compute = mostPopulated(versionResults(), 'computeType');
    }
    state.search = '';
    elements.modelSearch.value = '';
    syncCohortFilters(true);
    resetSelection();
    render();
  }

  function selectClientSegment(segment) {
    if (!['all', 'desktop', 'laptop'].includes(segment) || segment === state.clientSegment) return;
    state.clientSegment = segment;
    state.showAllChartModels = false;
    state.search = '';
    elements.modelSearch.value = '';
    syncCohortFilters(true);
    resetSelection();
    render();
  }

  function selectMetric(metric) {
    if (!Object.hasOwn(enterpriseSuite().metrics, metric) || metric === state.metric) return;
    state.metric = metric;
    syncSpecBuild();
    const counts = [...new Set(enterpriseBuildResults().map(result => result.cpuCount))].sort((a, b) => a - b);
    if (!counts.includes(state.cpuCount)) state.cpuCount = counts[0] || 1;
    state.search = '';
    elements.modelSearch.value = '';
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectSuite(suite) {
    if (!Object.hasOwn(enterpriseSuites, suite) || suite === state.suite) return;
    state.suite = suite;
    const metrics = enterpriseSuite().metrics;
    if (!Object.hasOwn(metrics, state.metric) || !state.datasets[metrics[state.metric].key].results.length) {
      state.metric = Object.keys(metrics).find(metric => state.datasets[metrics[metric].key].results.length) || Object.keys(metrics)[0];
    }
    syncSpecBuild();
    const counts = [...new Set(enterpriseBuildResults().map(result => result.cpuCount))].sort((a, b) => a - b);
    state.cpuCount = counts.includes(state.cpuCount) ? state.cpuCount : counts[0] || 1;
    state.search = '';
    elements.modelSearch.value = '';
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectAcceleratorTest(scenario) {
    if (!Object.hasOwn(acceleratorTests, scenario) || scenario === state.scenario) return;
    state.scenario = scenario;
    state.search = '';
    elements.modelSearch.value = '';
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectVersion(version) {
    state.version = version;
    state.compute = mostPopulated(versionResults(), 'computeType');
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectCompute(compute) {
    state.compute = compute;
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectCpuCount(value) {
    state.cpuCount = Number(value);
    syncCohortFilters();
    resetSelection();
    render();
  }

  function selectManufacturer(vendor) {
    state.manufacturer = unfilteredCohortResults().some(result => result.vendor === vendor) ? vendor : '';
    resetSelection();
    render();
  }

  function selectCoreEnd(end, value) {
    const stops = coreStops();
    if (stops.length < 2) return;
    const index = Math.max(0, Math.min(stops.length - 1, Number(value) || 0));
    if (end === 'min') state.coreLo = Math.min(index, state.coreHi);
    else state.coreHi = Math.max(index, state.coreLo);
    resetSelection();
    render();
  }

  function vendorColor(vendor) {
    const name = vendor.toLowerCase();
    if (name.includes('amd')) return '#c94549';
    if (name.includes('intel')) return '#8d9da9';
    if (name.includes('nvidia')) return '#9eaa83';
    if (name.includes('ampere')) return '#b69272';
    return '#ada0af';
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function emptyMessage(title, description, retry) {
    const box = createElement('li', 'benchmark-empty');
    box.append(createElement('strong', '', title), createElement('p', '', description));
    if (retry) {
      const button = createElement('button', 'benchmark-text-button', 'Retry loading data');
      button.type = 'button';
      button.addEventListener('click', loadData);
      box.append(button);
    }
    return box;
  }

  function renderControls() {
    document.body.dataset.mode = state.mode;
    elements.clientSegmentControls.hidden = state.mode !== 'client';
    elements.clientSegmentNote.hidden = state.mode !== 'client';
    if (state.mode === 'client') {
      const rows = versionResults().filter(result => result.computeType === state.compute);
      elements.clientSegmentControls.querySelectorAll('[data-segment]').forEach(button => {
        const segment = button.dataset.segment;
        const count = rows.filter(result => segment === 'all' || result.deviceSegments.includes(segment)).length;
        button.classList.toggle('active', segment === state.clientSegment);
        button.setAttribute('aria-pressed', String(segment === state.clientSegment));
        button.querySelector('span').textContent = `${count} models`;
      });
      const shared = rows.filter(result => result.deviceSegments.length > 1).length;
      const unknown = rows.filter(result => !result.deviceSegments.length).length;
      elements.clientSegmentNote.textContent = `Form factors come from manufacturer specifications. ${shared ? `${shared} models are listed for both. ` : ''}Blender medians pool submitted systems; these are not separate laptop and desktop test runs.${unknown ? ` ${unknown} unclassified models remain in All client.` : ''}`;
    }
    for (const button of elements.modeButtons) {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    for (const button of elements.metricButtons) {
      const active = button.dataset.metric === state.metric;
      const metric = enterpriseSuite().metrics[button.dataset.metric];
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('strong').textContent = button.dataset.metric === 'integer' ? 'Integer Rate' : 'Floating-point Rate';
      button.querySelector('span').textContent = metric.name;
      elements.metricDescriptions[button.dataset.metric].textContent = metric.description;
    }
    for (const button of elements.suiteButtons) {
      const active = button.dataset.suite === state.suite;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    for (const button of elements.acceleratorTestButtons) {
      const active = button.dataset.scenario === state.scenario;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    elements.enterpriseTestControls.hidden = !isEnterprise();
    elements.acceleratorTestControls.hidden = !isAccelerator();
    elements.enterpriseMetricSwitch.setAttribute('aria-label', `${enterpriseSuite().label} benchmark test`);
    elements.testGuideLink.hidden = false;
    elements.socketField.hidden = !isEnterprise();
    const specBuilds = [...new Set(activeDataset().results.map(result => result.benchmarkVersion))].filter(Boolean).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    elements.specBuildField.hidden = !isEnterprise() || state.suite !== '2026' || specBuilds.length < 2;
    if (isEnterprise()) setOptions(elements.specBuildSelect, specBuilds, state.specBuild, 'No builds');
    elements.versionField.hidden = isEnterprise() || isAccelerator();
    elements.computeField.hidden = isEnterprise() || isAccelerator();
    const manufacturers = [...new Set(unfilteredCohortResults().map(result => result.vendor))].sort((a, b) => a.localeCompare(b));
    elements.manufacturerSelect.replaceChildren();
    const allManufacturers = createElement('option', '', 'All');
    allManufacturers.value = '';
    elements.manufacturerSelect.append(allManufacturers);
    manufacturers.forEach(vendor => {
      const option = createElement('option', '', vendor);
      option.value = vendor;
      elements.manufacturerSelect.append(option);
    });
    const catalogVendors = [...new Set(state.catalog.products.filter(product => product.types.includes(state.mode)).map(product => product.vendor.toLowerCase()))];
    const missingVendors = catalogVendors.filter(vendor => !manufacturers.some(name => name.toLowerCase() === vendor)).sort();
    const vendorNames = { amd: 'AMD', intel: 'Intel', nvidia: 'NVIDIA', ampere: 'Ampere' };
    missingVendors.forEach(vendor => {
      const option = createElement('option', '', `${vendorNames[vendor] || vendor} — no imported result`);
      option.value = vendor;
      option.disabled = true;
      elements.manufacturerSelect.append(option);
    });
    elements.manufacturerSelect.value = state.manufacturer;
    elements.manufacturerSelect.disabled = manufacturers.length === 0;
    elements.manufacturerHelp.hidden = missingVendors.length === 0;
    elements.manufacturerHelp.textContent = missingVendors.length
      ? `${missingVendors.map(vendor => vendorNames[vendor] || vendor).join(', ')}: no imported result for this ${isEnterprise() ? 'test and CPU count' : 'view'}. Public scores may exist outside this snapshot.` : '';

    const stops = coreStops();
    const coreFilterAvailable = stops.length > 1;
    elements.coreField.hidden = !coreFilterAvailable;
    if (coreFilterAvailable) {
      const last = stops.length - 1;
      state.coreLo = Math.max(0, Math.min(last, state.coreLo));
      state.coreHi = Math.max(state.coreLo, Math.min(last, state.coreHi));
      for (const input of [elements.coreMin, elements.coreMax]) {
        input.min = '0';
        input.max = String(last);
        input.step = '1';
      }
      elements.coreMin.value = String(state.coreLo);
      elements.coreMax.value = String(state.coreHi);
      elements.coreMinValue.textContent = String(stops[state.coreLo]);
      elements.coreMaxValue.textContent = String(stops[state.coreHi]);
      elements.coreMin.setAttribute('aria-valuetext', `${stops[state.coreLo]} cores per CPU`);
      elements.coreMax.setAttribute('aria-valuetext', `${stops[state.coreHi]} cores per CPU`);
      elements.coreField.style.setProperty('--core-start', `${100 * state.coreLo / last}%`);
      elements.coreField.style.setProperty('--core-end', `${100 * state.coreHi / last}%`);
      elements.coreFieldHint.textContent = isEnterprise() ? 'SPEC enabled cores ÷ CPUs' : 'Official product specs, not Blender';
    }
    if (isEnterprise()) {
      const counts = [...new Set(enterpriseBuildResults().map(result => result.cpuCount))].sort((a, b) => a - b);
      elements.socketSelect.replaceChildren();
      if (!counts.length) {
        const option = createElement('option', '', 'No results');
        option.value = '';
        elements.socketSelect.append(option);
      } else {
        counts.forEach(count => {
          const option = createElement('option', '', `${count} ${count === 1 ? 'CPU' : 'CPUs'}`);
          option.value = String(count);
          elements.socketSelect.append(option);
        });
        if (!counts.includes(state.cpuCount)) state.cpuCount = counts[0];
        elements.socketSelect.value = String(state.cpuCount);
      }
      elements.socketSelect.disabled = counts.length <= 1;
      return;
    }
    if (isAccelerator()) return;
    const versions = [...new Set(deviceResults().map(result => result.blenderVersion))]
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    setOptions(elements.versionSelect, versions, state.version, 'No results');
    const computeTypes = [...new Set(versionResults().map(result => result.computeType))].sort();
    setOptions(elements.computeSelect, computeTypes, state.compute, 'No results');
    elements.versionField.hidden = versions.length <= 1;
    elements.computeField.hidden = computeTypes.length <= 1;
  }

  function displayDate(value) {
    const stamp = typeof value === 'string' ? value.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp || 'Not stated';
    const date = new Date(`${stamp}T00:00:00Z`);
    return Number.isNaN(date.valueOf()) ? stamp : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function renderContext() {
    const enterprise = isEnterprise();
    const accelerator = isAccelerator();
    const dataset = activeDataset();
    const meta = dataset.meta;
    const device = state.mode === 'graphics' ? 'GPU' : 'CPU';
    const suite = enterpriseSuite();
    const metric = enterpriseMetric();
    const publishedVersions = [...new Set((enterprise ? enterpriseBuildResults() : dataset.results).map(result => result.benchmarkVersion))];
    const versionNote = enterprise && publishedVersions.length > 1
      ? ` Published reports also use ${publishedVersions.length} benchmark versions; check each disclosure before interpreting ratios.`
      : '';
    elements.workbenchTitle.textContent = enterprise ? 'Enterprise CPU systems' : accelerator ? 'Datacenter accelerator systems' : state.mode === 'client' ? 'Client CPU rendering' : 'Graphics rendering';
    elements.metricNote.textContent = enterprise ? `${suite.label} / ${metric.name}` : accelerator ? `MLPerf® Inference v6.0 / Llama 2 70B / ${acceleratorTest().scenario}` : 'BLENDER OPEN DATA / MEDIAN SAMPLES PER MINUTE';
    elements.benchmarkPickerTitle.textContent = enterprise ? 'What work are you comparing?' : accelerator ? 'How will AI requests arrive?' : '3D rendering';
    elements.comparisonTitle.textContent = enterprise || accelerator ? 'Selected system results' : 'Selected comparison';
    elements.baselineLabelText.textContent = enterprise || accelerator ? 'BASELINE SYSTEM RESULT' : 'BASELINE MODEL';
    elements.baselineSelect.setAttribute('aria-label', enterprise || accelerator ? 'Comparison baseline system result' : 'Comparison baseline model');
    elements.workloadQuestion.textContent = enterprise
      ? state.metric === 'integer'
        ? 'How much integer-heavy work can this server handle at once?'
        : 'How much scientific and simulation work can this server handle at once?'
      : accelerator
        ? `How quickly can an eight-accelerator system serve ${acceleratorTest().scenario === 'Server' ? 'a stream of' : 'a batch of'} AI requests?`
        : `How quickly can this ${device} render a Blender scene?`;
    elements.testDescription.textContent = enterprise
      ? `${metric.description} SPECspeed is a separate single-task test; its scores cannot be compared with these SPECrate scores.`
      : accelerator
        ? acceleratorTest().description
      : `Blender Open Data measures ${device} rendering throughput as median samples completed per minute in Blender ${state.version || '5.2.0'}. Higher scores mean more rendering work completed for this workload.`;
    elements.testGuideLink.href = enterprise ? suite.guideUrl : accelerator ? 'https://docs.mlcommons.org/inference/submission/' : 'https://opendata.blender.org/about/';
    elements.testGuideLink.textContent = enterprise ? 'How SPEC defines this test ↗' : accelerator ? 'How MLPerf® Inference v6.0 defines this test ↗' : 'How Blender defines this test ↗';
    elements.rankingIntro.textContent = enterprise || accelerator ? 'Individual published system submissions behind the model overview. Inspect the configuration, open the source, or select up to three to compare.' : 'Community medians for the selected rendering test. Open the source to inspect the submissions behind each score.';
    document.getElementById('modelChartTitle').textContent = enterprise ? 'Server scores by CPU model' : accelerator ? 'System scores by accelerator' : 'Model scores';
    document.getElementById('rankingTitle').textContent = enterprise || accelerator ? 'Imported system reports' : 'Imported rendering results';
    elements.comparisonIntro.textContent = enterprise
      ? 'The markers use the same SPEC system-score scale as the ranking. Ratios use the displayed published results. Catalog CPU specs describe the processor; the SPEC score and enabled cores describe the submitted system. Boost GHz is not a measured benchmark clock.'
      : accelerator
        ? 'The markers use whole-system Tokens/s from the selected cohort. Ratios compare individual eight-accelerator SUT results.'
      : 'The markers use the same rendering-score scale as the ranking. Ratios compare the displayed community medians.';
    elements.cohortNote.textContent = enterprise
      ? `Published ${state.cpuCount}-CPU systems using ${metric.name}. Scores reflect the tested server, including memory and compiler choices. Scores from different SPEC suites or tests cannot be compared directly.${versionNote}`
      : accelerator
        ? `MLPerf® Inference v6.0 · Closed division · Available · Llama 2 70B 99% · ${acceleratorTest().scenario} · 8 accelerators in one node. Scores are whole-system Tokens/s; software and host configurations differ. This view covers ${new Set(dataset.results.map(modelKey)).size} exact ChipIndex models; B300 is omitted pending alias review.`
      : `${device} results use Blender ${state.version || '5.2.0'} and ${state.compute || 'mixed'} compute grouping. Community medians pool operating systems and system configurations; ratios are exploratory.`;
    elements.benchmarkScope.hidden = accelerator;
    if (enterprise) {
      const scopedReports = cohortResults();
      const scopedModels = new Set(scopedReports.map(modelKey));
      elements.benchmarkScopeLabel.textContent = 'SELECTED SPEC SNAPSHOT';
      elements.benchmarkScopeText.textContent = `This selected sample contains ${scopedModels.size} CPU ${scopedModels.size === 1 ? 'model' : 'models'} and ${scopedReports.length} linked system ${scopedReports.length === 1 ? 'report' : 'reports'} for ${state.cpuCount}-CPU ${suite.label} ${metric.label.toLowerCase()}. It is not SPEC's full database; a model can have multiple submissions. Search can narrow the view further.`;
      elements.benchmarkScopeLink.href = metric.officialResultsUrl;
      elements.benchmarkScopeLink.textContent = `Browse all SPEC ${state.suite} ${state.metric === 'integer' ? 'integer' : 'floating-point'} rate results ↗`;
    } else if (!accelerator) {
      const selectedModels = new Set(unfilteredCohortResults().map(modelKey));
      const minimumSamples = Number(meta.minimumSamples);
      const sampleRule = Number.isInteger(minimumSamples) && minimumSamples > 0 ? ` with at least ${minimumSamples} submissions` : '';
      elements.benchmarkScopeLabel.textContent = 'SELECTED BLENDER SNAPSHOT';
      elements.benchmarkScopeText.textContent = state.mode === 'client'
        ? `ChipIndex shows ${selectedModels.size} matched client CPU models${sampleRule} in this Blender ${state.version} rendering snapshot. SPEC CPU results are separate; this rendering score is not an overall laptop CPU rating. Laptop power limits and cooling affect results. An unlisted chip may still have public scores.`
        : `ChipIndex shows ${selectedModels.size} matched graphics models${sampleRule} in this Blender ${state.version} rendering snapshot. This measures rendering, not gaming or AI performance. Laptop and desktop GPU variants are distinct, and system power limits affect results. An unlisted GPU may still have public scores.`;
      elements.benchmarkScopeLink.href = safeHttpsUrl(meta.sourceUrl) || 'https://opendata.blender.org/benchmarks/query/';
      elements.benchmarkScopeLink.textContent = 'Browse Blender Open Data ↗';
    }
    elements.methodIntro.textContent = enterprise
      ? 'Published system disclosures make the server workload and tested configurations visible. This is a selected snapshot, not an exhaustive leaderboard.'
      : accelerator
        ? `Published MLPerf® Inference v6.0 system records make the workload, submitter, and tested configurations visible. The chart contains one fixed ${acceleratorTest().scenario} cohort.`
      : 'Community rendering results make the source and grouping visible. This is a selected snapshot, not an exhaustive leaderboard.';
    elements.methodSource.textContent = enterprise
      ? 'Each result links to its full SPEC disclosure, including benchmark version. The same CPU model can use different test settings across integer and floating-point results.'
      : accelerator
        ? 'Each result lists its MLPerf® Inference v6.0 result ID, submitter, and exact submitted system, with links to its official SUT disclosure and summary result.'
      : 'Each result links to its Blender Open Data query. The submission count appears beside the model when available.';
    elements.methodCohort.textContent = enterprise
      ? `The chart uses ${suite.label} ${metric.name}${state.suite === '2026' ? ` (${state.specBuild})` : ''} for ${state.cpuCount}-CPU systems only. Memory, compiler, tuning, and other system choices still differ. Other suites and tests use separate scales.${versionNote}`
      : accelerator
        ? `The comparison uses MLPerf® Inference v6.0, Closed/Available, Llama 2 70B 99%, ${acceleratorTest().scenario}, and exactly eight accelerators per system. The values are not per-accelerator rates.`
      : 'Client CPU and GPU scores stay separate. Every result shown uses the selected Blender version and compute grouping.';
    elements.methodCoverage.textContent = enterprise
      ? 'Only selected published systems are shown, and coverage varies by test. A model absent from this view has no selected result, not a score of zero. This is system throughput, not overall CPU performance.'
      : accelerator
        ? `This view selects published SUTs for ${new Set(dataset.results.map(modelKey)).size} matched catalog models. Multiple records can name one model. Unmatched hardware and other workloads remain outside this view.`
      : 'Only selected ChipIndex models are shown. Missing models have no qualified result in this sample, not a score of zero. Rendering is one workload.';
    elements.specAttribution.hidden = !enterprise;
    elements.mlperfAttribution.hidden = !accelerator;
    const scoredResults = visibleResults();
    const scoredModels = new Set(scoredResults.map(result => JSON.stringify([result.vendor.toLowerCase(), result.model.toLowerCase()])));
    elements.coverageCount.textContent = dataset.error ? '—' : formatScore.format(scoredModels.size);
    elements.coverageLabel.textContent = enterprise
      ? 'CPU models matching this view'
      : accelerator
        ? 'accelerator models matching this view'
      : `${device} models matching this view`;
    elements.sourceName.textContent = enterprise ? suite.label : accelerator ? 'MLPerf® Inference v6.0' : 'Blender Open Data';
    const captured = /^\d{4}-\d{2}-\d{2}$/.test(meta.snapshotDate || '') ? Date.parse(`${meta.snapshotDate}T00:00:00Z`) : NaN;
    const age = Math.floor((Date.now() - captured) / 86400000);
    const freshness = document.getElementById('freshnessNotice');
    freshness.hidden = dataset.error || !Number.isFinite(age) || age <= 30;
    freshness.textContent = `Snapshot captured ${age} days ago. Newer public results may be available.`;
    elements.snapshotLabel.textContent = 'Last updated';
    elements.snapshotDate.textContent = dataset.error ? 'Unavailable' : displayDate(dataset.meta.snapshotDate);
    const snapshotDate = !dataset.error && /^\d{4}-\d{2}-\d{2}$/.test(meta.snapshotDate || '')
      ? meta.snapshotDate : '';
    elements.rankingUpdatedDate.textContent = dataset.error ? 'Unavailable' : snapshotDate ? displayDate(snapshotDate) : 'Not stated';
    elements.coverageMix.textContent = enterprise || accelerator ? `${scoredResults.length} system reports` : `${scoredResults.length} community medians`;
    renderScoreGuide();
    const sourceUrl = safeHttpsUrl(dataset.meta.sourceUrl);
    elements.datasetLink.href = sourceUrl || (enterprise ? suite.resultsUrl : accelerator ? 'https://mlcommons.org/working-groups/benchmarks/inference/' : 'https://opendata.blender.org/');
    elements.datasetLink.textContent = enterprise ? `Visit ${suite.label} results ↗` : accelerator ? 'Visit MLPerf® Inference v6.0 results ↗' : 'Visit Blender Open Data ↗';
    elements.specBenchmarkLink.href = suite.benchmarkUrl;
    elements.specBenchmarkLink.textContent = `${suite.label} benchmark`;
    elements.mlperfTrademarkNotice.textContent = meta.trademarkNotice || 'The MLPerf name and logo are trademarks of MLCommons Association.';
    elements.mlperfFootnoteContext.textContent = `MLPerf® Inference v6.0 · Closed division · Available · Llama 2 70B 99% · ${acceleratorTest().scenario} · 8 accelerators.`;
    elements.mlperfOfficialLink.href = sourceUrl || 'https://mlcommons.org/working-groups/benchmarks/inference/';
    elements.mlperfRetrievedDate.textContent = displayDate(meta.snapshotDate);
    elements.mlperfGuidelinesLink.href = safeHttpsUrl(meta.messagingGuidelinesUrl) || 'https://github.com/mlcommons/policies/blob/master/MLPerf_Results_Messaging_Guidelines.adoc';
  }

  function renderFocus() {
    elements.enterpriseFocus.hidden = !isEnterprise();
    if (!isEnterprise()) {
      elements.focusStatus.textContent = '';
      return;
    }
    const allGroups = visibleModelEvidence();
    const groups = allGroups.filter(group => `${group.representative.vendor} ${group.representative.model}`.toLowerCase().includes(state.focusQuery));
    elements.focusModelSelect.replaceChildren();
    elements.focusPeerSelect.replaceChildren();
    elements.focusOverview.replaceChildren();
    if (!groups.length) {
      state.focusModelKey = null;
      state.focusPeerKey = null;
      const noModel = createElement('option', '', 'No models match this view');
      noModel.value = '';
      elements.focusModelSelect.append(noModel);
      elements.focusModelSelect.disabled = true;
      const noPeer = createElement('option', '', 'No comparable model');
      noPeer.value = '';
      elements.focusPeerSelect.append(noPeer);
      elements.focusPeerSelect.disabled = true;
      elements.focusStatus.textContent = activeDataset().error ? 'SPEC results are unavailable.'
        : allGroups.length ? 'No CPU model matches this name.' : 'No reports match these filters.';
      elements.focusOverview.append(createElement('p', 'benchmark-focus-empty', activeDataset().error
        ? 'SPEC results are unavailable. Reload the data to see model evidence.'
        : allGroups.length ? 'No CPU model matches this name. Clear the CPU model search or try another name.'
          : 'No listed reports match these filters. Change the report search or filters to see a comparison.'));
      return;
    }
    const focus = groups.find(group => group.key === state.focusModelKey) || groups[0];
    state.focusModelKey = focus.key;
    groups.forEach(group => {
      const option = createElement('option', '', `${group.representative.vendor} ${group.representative.model}`);
      option.value = group.key;
      elements.focusModelSelect.append(option);
    });
    elements.focusModelSelect.value = focus.key;
    elements.focusModelSelect.disabled = groups.length === 1;
    const peers = allGroups.filter(group => group.key !== focus.key);
    const peer = peers.find(group => group.key === state.focusPeerKey) || peers[0] || null;
    state.focusPeerKey = peer?.key || null;
    elements.focusStatus.textContent = `${focus.representative.vendor} ${focus.representative.model}: ${formatScore.format(focus.representative.score)} base rate from one linked system report; ${focus.reports.length} listed ${focus.reports.length === 1 ? 'report' : 'reports'} in this view.${peer ? ` Compared with ${peer.representative.model}: ${formatRatio(focus.representative.score, peer.representative.score)}.` : ' No peer model available.'}`;
    if (!peer) {
      const option = createElement('option', '', 'No other model in this view');
      option.value = '';
      elements.focusPeerSelect.append(option);
      elements.focusPeerSelect.disabled = true;
    } else {
      peers.forEach(group => {
        const option = createElement('option', '', `${group.representative.vendor} ${group.representative.model}`);
        option.value = group.key;
        elements.focusPeerSelect.append(option);
      });
      elements.focusPeerSelect.value = peer.key;
      elements.focusPeerSelect.disabled = false;
    }

    const selected = focus.representative;
    const scoreCard = createElement('div', 'benchmark-focus-card benchmark-focus-score');
    scoreCard.append(createElement('span', 'benchmark-focus-card-label', focus.reports.length === 1 ? 'ONE LISTED SYSTEM RESULT' : 'MIDDLE LISTED SYSTEM RESULT'));
    scoreCard.append(createElement('strong', 'benchmark-focus-score-number', formatScore.format(selected.score)));
    scoreCard.append(createElement('span', 'benchmark-focus-score-unit', `${enterpriseMetric().name} · higher is better`));
    scoreCard.append(createElement('div', 'benchmark-focus-model-name', `${selected.vendor} ${selected.model}`));
    const selectedSpecs = resultSpecNode(selected, 'div', true);
    if (selectedSpecs) scoreCard.append(selectedSpecs);
    scoreCard.append(createElement('span', 'benchmark-focus-sponsor', `Submitted by ${selected.sponsor}`));
    const source = createElement('a', 'benchmark-focus-source', 'Open this exact SPEC report ↗');
    source.href = selected.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    scoreCard.append(source);

    const evidence = createElement('div', 'benchmark-focus-card benchmark-focus-evidence');
    evidence.append(createElement('span', 'benchmark-focus-card-label', 'EVIDENCE IN THIS CHIPINDEX VIEW'));
    evidence.append(createElement('strong', 'benchmark-focus-evidence-count', `${focus.reports.length} ${focus.reports.length === 1 ? 'system report' : 'system reports'}`));
    evidence.append(createElement('span', 'benchmark-focus-range', focus.reports.length === 1
      ? `Only listed score: ${formatScore.format(focus.minimum)}`
      : `Listed score range: ${formatScore.format(focus.minimum)}–${formatScore.format(focus.maximum)}`));
    const dates = focus.reports.map(report => report.publishedDate).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
    evidence.append(createElement('span', 'benchmark-focus-dates', dates.length
      ? `Published ${displayDate(dates[0])}${dates.length > 1 && dates[0] !== dates[dates.length - 1] ? ` – ${displayDate(dates[dates.length - 1])}` : ''}`
      : 'Publication date: see individual reports'));

    const peerCard = createElement('div', 'benchmark-focus-card benchmark-focus-peer');
    peerCard.append(createElement('span', 'benchmark-focus-card-label', 'CHIPINDEX RATIO / PEER SYSTEM'));
    if (peer) {
      peerCard.append(createElement('strong', 'benchmark-focus-ratio', formatRatio(selected.score, peer.representative.score)));
      peerCard.append(createElement('span', 'benchmark-focus-peer-name', `vs ${peer.representative.vendor} ${peer.representative.model}`));
      const peerSpecs = resultSpecNode(peer.representative, 'div', true);
      if (peerSpecs) peerCard.append(peerSpecs);
      peerCard.append(createElement('span', 'benchmark-focus-peer-score', `${formatScore.format(selected.score)} vs ${formatScore.format(peer.representative.score)} base rate`));
      peerCard.append(createElement('span', 'benchmark-focus-sponsor', `Peer submitted by ${peer.representative.sponsor}`));
      const peerSource = createElement('a', 'benchmark-focus-source', 'Open peer SPEC report ↗');
      peerSource.href = peer.representative.sourceUrl;
      peerSource.target = '_blank';
      peerSource.rel = 'noopener noreferrer';
      peerCard.append(peerSource);
      peerCard.append(createElement('span', 'benchmark-focus-peer-note', 'ChipIndex ratio of one linked system report per model; configurations differ.'));
    } else {
      peerCard.append(createElement('strong', 'benchmark-focus-ratio', '—'));
      peerCard.append(createElement('span', 'benchmark-focus-peer-note', 'Choose broader filters to show another model using this test and CPU count.'));
    }
    elements.focusOverview.append(scoreCard, evidence, peerCard);

    const disclosure = createElement('details', 'benchmark-focus-disclosure');
    disclosure.append(createElement('summary', '', `Tested system and all ${focus.reports.length} listed ${focus.reports.length === 1 ? 'report' : 'reports'}`));
    const system = createElement('div', 'benchmark-focus-system');
    system.append(createElement('strong', '', selected.systemName));
    const grid = createElement('dl', 'benchmark-system-grid');
    [
      ['Tested component', selected.testedComponent || 'CPU system'],
      ['Concurrent copies', selected.baseCopies ? String(selected.baseCopies) : 'See source'],
      ['CPU count', String(selected.cpuCount)],
      ['Enabled cores', selected.enabledCores ? String(selected.enabledCores) : 'See source'],
      ['Memory', selected.memory || 'See source'],
      ['OS', selected.operatingSystem || 'See source'],
      ['Compiler', selected.compiler || 'See source'],
      ['Benchmark version', selected.benchmarkVersion],
      ['Test date', selected.testDate || 'See source'],
    ].forEach(([label, value]) => grid.append(createElement('dt', '', label), createElement('dd', '', value)));
    system.append(grid);
    disclosure.append(system);
    const reports = createElement('ol', 'benchmark-focus-report-list');
    [...focus.reports].reverse().forEach(report => {
      const item = createElement('li', '');
      item.append(createElement('strong', '', formatScore.format(report.score)),
        createElement('span', '', `${report.systemName} · ${report.sponsor} · ${displayDate(report.publishedDate)}`));
      const link = createElement('a', '', 'SPEC report ↗');
      link.href = report.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      item.append(link);
      reports.append(item);
    });
    disclosure.append(reports);
    elements.focusOverview.append(disclosure);
  }

  function updateRankingScroll() {
    const viewport = elements.rankedResultsViewport;
    const scrollable = viewport.scrollHeight > viewport.clientHeight + 1;
    viewport.tabIndex = scrollable ? 0 : -1;
    if (scrollable) viewport.setAttribute('aria-describedby', 'rankingScrollHint');
    else viewport.removeAttribute('aria-describedby');
    elements.rankingScrollHint.hidden = !scrollable;
    elements.rankingScrollCount.textContent = String(rankingVisibleCount);
  }

  function updateModelChartScroll() {
    const viewport = elements.modelChartViewport;
    const scrollable = state.display === 'chart' && state.section === 'results' && elements.modelChartDisclosure.open && viewport.scrollWidth > viewport.clientWidth + 1;
    viewport.tabIndex = scrollable ? 0 : -1;
    elements.modelChartScrollHint.hidden = !scrollable;
  }

  function highlightFocusedModelChart() {
    for (const item of elements.modelChartPlot.querySelectorAll('.benchmark-model-chart-item')) {
      item.classList.toggle('is-focused', isEnterprise() && item.dataset.modelKey === state.focusModelKey);
    }
  }

  /** Plot one source-linked representative per vendor/model; retain every report in the ranking. */
  function renderModelChart() {
    const allGroups = visibleModelEvidence();
    const limited = allGroups.length > 25;
    const groups = limited && !state.showAllChartModels ? allGroups.slice(0, 25) : allGroups;
    const models = groups.map(group => group.representative);
    elements.modelChartRangeButton.hidden = !limited;
    elements.modelChartRangeButton.textContent = state.showAllChartModels ? 'Show top 25' : `Show all ${allGroups.length} models`;
    const viewKey = activeViewKey();
    const viewChanged = modelChartScrollKey !== viewKey;
    const scrollLeft = viewChanged ? 0 : elements.modelChartViewport.scrollLeft;
    modelChartScrollKey = viewKey;
    const focusedId = elements.modelChartPlot.contains(document.activeElement)
      ? document.activeElement.closest('.benchmark-model-chart-bar')?.dataset.resultId : null;
    const max = models[0]?.score || 1;
    const units = isEnterprise() ? 'base rate' : isAccelerator() ? 'whole-system Tokens/s' : 'median samples/min';
    const test = isEnterprise() ? enterpriseMetric().name
      : isAccelerator() ? `MLPerf v6 ${acceleratorTest().scenario}` : `Blender ${state.version} ${state.compute}`;
    elements.modelChartMetric.textContent = models.length
      ? `${limited && !state.showAllChartModels ? `TOP ${models.length} OF ${allGroups.length}` : models.length} ${allGroups.length === 1 ? 'MODEL' : 'MODELS'} / ${test} / ${units.toUpperCase()} · HIGHER IS BETTER`
      : `${test} / NO SCORES TO PLOT`;
    elements.modelChartSelectionLegend.textContent = `${state.selected.length}/3 selected · click a bar to compare`;
    document.getElementById('viewComparison').hidden = state.selected.length === 0;
    document.getElementById('viewComparison').textContent = `View comparison (${state.selected.length})`;
    document.querySelectorAll('.benchmark-model-chart-y-axis span').forEach((tick, index) => { tick.textContent = models.length ? formatScore.format(max * (4 - index) / 4) : '—'; });
    elements.modelChartDescription.textContent = isEnterprise()
      ? "Each bar uses one linked server report for a CPU model: the lower middle published Base score among imported reports in this view. This is ChipIndex's model order, not a SPEC processor ranking or a CPU-only score. Select a bar to inspect the server and source."
      : isAccelerator()
        ? 'Best listed eight-accelerator system per model. The vertical axis is whole-system tokens per second. Select a bar to compare.'
        : `One Blender community median per model. The vertical axis is samples per minute. Select a bar to compare.${limited && !state.showAllChartModels ? ' The top 25 are shown; search or use Show all to reach other models.' : ''}`;
    if ((isEnterprise() || isAccelerator()) && limited && !state.showAllChartModels) elements.modelChartDescription.textContent += ' The top 25 are shown; search or use Show all to reach other models.';
    elements.modelChartStatus.textContent = '';
    elements.modelChartStatus.hidden = true;
    elements.modelChartPlot.replaceChildren();
    elements.modelChartPlot.style.setProperty('--model-count', String(models.length));
    const longestLabel = Math.max(0, ...models.map(result => result.model.length));
    elements.modelChartPlot.style.setProperty('--model-plot-height', `${models.length ? Math.min(296, Math.max(245, 197 + Math.ceil(longestLabel * 4.5))) : 150}px`);
    elements.modelChartPlot.classList.toggle('is-empty', models.length === 0);
    if (!models.length) {
      elements.modelChartPlot.append(createElement('p', 'benchmark-model-chart-empty', activeDataset().error
        ? 'Results unavailable. Try reloading the data.' : 'No model scores match these filters.'));
    }
    for (const group of groups) {
      const result = group.representative;
      const item = createElement('div', 'benchmark-model-chart-item');
      item.setAttribute('role', 'listitem');
      item.dataset.score = String(result.score);
      item.dataset.modelKey = group.key;
      item.style.setProperty('--row-color', vendorColor(result.vendor));
      item.style.setProperty('--bar-height', `${Math.max(3, 145 * result.score / max).toFixed(2)}px`);
      const selected = state.selected.includes(result.id);
      item.classList.toggle('is-selected', selected);
      item.classList.toggle('is-focused', isEnterprise() && group.key === state.focusModelKey);
      const bar = createElement('button', 'benchmark-model-chart-bar');
      bar.type = 'button';
      bar.dataset.resultId = result.id;
      bar.setAttribute('aria-pressed', String(selected));
      const subject = isEnterprise() ? `${result.cpuCount}-CPU tested system ${result.systemName}`
        : isAccelerator() ? `eight-accelerator SUT ${result.systemName}, result ${result.resultId}`
          : 'Blender community median';
      const chartSpecs = (isEnterprise() || state.mode === 'client') ? productSpecText(productForResult(result)) : '';
      bar.setAttribute('aria-label', `${result.vendor} ${result.model}, ${formatScore.format(result.score)} ${units}, ${isEnterprise() ? `lower-middle of ${group.reports.length} listed system reports, ` : ''}${subject}.${chartSpecs ? ` Catalog CPU specs: ${chartSpecs}.` : ''} ${selected ? 'Selected; activate to remove from comparison.' : state.selected.length >= 3 ? 'Comparison is full; remove one result to add this model.' : 'Activate to add this source result to comparison.'}`);
      if (chartSpecs) bar.title = `${result.vendor} ${result.model} · Catalog CPU specs: ${chartSpecs}`;
      bar.append(createElement('span', 'benchmark-model-chart-score', formatScore.format(result.score)));
      const fill = createElement('span', 'benchmark-model-chart-fill');
      fill.setAttribute('aria-hidden', 'true');
      bar.append(fill);
      bar.addEventListener('click', () => {
        if (!state.selected.includes(result.id) && state.selected.length >= 3) {
          elements.modelChartStatus.hidden = false;
          elements.modelChartStatus.textContent = 'Comparison full (3 results). Remove one below to add another model.';
          return;
        }
        if (isEnterprise()) state.focusModelKey = group.key;
        toggleSelected(result.id);
        elements.modelChartStatus.hidden = false;
        elements.modelChartStatus.textContent = `${result.model} ${selected ? 'removed from' : 'added to'} comparison.`;
      });
      const label = createElement('span', 'benchmark-model-chart-x-label', result.model);
      label.setAttribute('aria-hidden', 'true');
      item.append(bar, label);
      elements.modelChartPlot.append(item);
    }
    elements.modelChartViewport.scrollLeft = scrollLeft;
    renderModelTable(groups);
    applyDisplay();
    updateModelChartScroll();
    if (focusedId) {
      const matchingBar = [...elements.modelChartPlot.querySelectorAll('.benchmark-model-chart-bar')]
        .find(button => button.dataset.resultId === focusedId);
      matchingBar?.focus({ preventScroll: true });
      elements.modelChartViewport.scrollLeft = scrollLeft;
    }
  }

  function renderRanking() {
    const cohort = cohortResults();
    const max = cohort[0]?.score || 1;
    const visible = visibleResults(cohort);
    const scrollKey = activeViewKey();
    const scrollTop = rankingScrollKey === scrollKey ? elements.rankedResultsViewport.scrollTop : 0;
    if (rankingScrollKey !== scrollKey) state.rankingLimit = 100;
    rankingScrollKey = scrollKey;
    const displayed = visible.slice(0, state.rankingLimit);
    rankingVisibleCount = displayed.length;
    const pagination = document.getElementById('rankingPagination');
    pagination.hidden = visible.length <= 100;
    document.getElementById('rankingPageStatus').textContent = `Showing ${displayed.length} of ${visible.length} results`;
    document.getElementById('rankingMore').hidden = displayed.length >= visible.length;
    const rankById = new Map(cohort.map((result, index) => [result.id, index + 1]));
    const finish = () => {
      elements.rankedResultsViewport.scrollTop = scrollTop;
      updateRankingScroll();
    };
    elements.rankingCount.textContent = isEnterprise()
      ? `${visible.length} CHIPINDEX ${visible.length === 1 ? 'RESULT' : 'RESULTS'}`
      : `${visible.length} ${visible.length === 1 ? 'RESULT' : 'RESULTS'}`;
    elements.filterStatus.textContent = `${visible.length} ${isEnterprise() ? `${enterpriseMetric().name} enterprise CPU system` : isAccelerator() ? 'datacenter accelerator SUT' : state.mode === 'client' ? 'client CPU' : 'graphics'} benchmark ${visible.length === 1 ? 'result' : 'results'} match. ${displayed.length} loaded in the list.`;
    elements.rankedResults.replaceChildren();
    if (!cohort.length) {
      const description = activeDataset().error
        ? 'The result snapshot could not be loaded. Check the connection, then try again.'
        : 'No source-linked result is available for this selection.';
      elements.rankedResults.append(emptyMessage(activeDataset().error ? 'Results unavailable' : 'No results in this cohort', description, activeDataset().error));
      finish();
      return;
    }
    if (!visible.length) {
      elements.rankedResults.append(emptyMessage('No matching result', 'Try a model, submitter, system, platform, or result ID, or clear the search field.', false));
      finish();
      return;
    }
    displayed.forEach(result => {
      const row = createElement('li', 'benchmark-rank-row');
      row.dataset.resultId = result.id;
      row.style.setProperty('--row-color', vendorColor(result.vendor));
      row.append(createElement('span', 'benchmark-rank-number', String(rankById.get(result.id)).padStart(2, '0')));

      const main = createElement('div', 'benchmark-rank-main');
      main.append(createElement('div', 'benchmark-rank-title', result.model));
      const rankSpecs = resultSpecNode(result, 'div', true);
      if (rankSpecs) main.append(rankSpecs);
      const sub = createElement('div', 'benchmark-rank-sub');
      sub.append(createElement('span', 'benchmark-vendor-dot'));
      sub.append(createElement('span', '', [result.vendor, result.productLine].filter(Boolean).join(' / ')));
      if (isEnterprise()) sub.append(createElement('span', '', `· Sponsor: ${result.sponsor}`));
      if (isAccelerator()) sub.append(createElement('span', '', `· Submitter: ${result.submitter}`));
      if (!isEnterprise() && !isAccelerator() && result.samples) sub.append(createElement('span', '', `· ${formatScore.format(result.samples)} ${result.samples === 1 ? 'submission' : 'submissions'}`));
      const source = createElement('a', 'benchmark-source-link', isAccelerator() ? 'SUT source ↗' : 'Source ↗');
      source.href = result.sourceUrl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.setAttribute('aria-label', `Open ${isEnterprise() ? 'SPEC disclosure' : isAccelerator() ? 'MLPerf® Inference v6.0 SUT disclosure' : 'Blender Open Data source'} for ${result.model}${isAccelerator() ? ` result ${result.resultId}` : ''}`);
      sub.append(source);
      if (isAccelerator()) {
        const summary = createElement('a', 'benchmark-source-link', 'Result summary ↗');
        summary.href = result.summaryUrl;
        summary.target = '_blank';
        summary.rel = 'noopener noreferrer';
        summary.setAttribute('aria-label', `Open official MLPerf® Inference v6.0 result summary for ${result.resultId}`);
        sub.append(summary);
      }
      main.append(sub);
      if (isEnterprise()) {
        main.append(createElement('div', 'benchmark-rank-system', `${result.systemName} · ${result.testedComponent ? result.testedComponent + ' · ' : ''}${result.cpuCount} CPU · ${result.benchmarkVersion} · published ${displayDate(result.publishedDate)}`));
        const details = createElement('details', 'benchmark-system-details');
        const summary = createElement('summary', '', 'System configuration');
        details.append(summary);
        const grid = createElement('dl', 'benchmark-system-grid');
        const fields = [
          ['Benchmark', result.benchmarkVersion],
          ['Metric', result.metric],
          ['Test date', result.testDate],
          ['Enabled cores', result.enabledCores ? String(result.enabledCores) : 'See source'],
          ['Concurrent copies', result.baseCopies ? String(result.baseCopies) : 'See source'],
          ['Memory', result.memory || 'See source'],
          ['OS', result.operatingSystem || 'See source'],
          ['Compiler', result.compiler || 'See source'],
        ];
        fields.forEach(([label, value]) => {
          grid.append(createElement('dt', '', label), createElement('dd', '', value));
        });
        details.append(grid);
        main.append(details);
      } else if (isAccelerator()) {
        main.append(createElement('div', 'benchmark-rank-system', `${result.systemName} · ${result.precision || 'weight precision in source'} weights · platform ${result.platform}`));
        const provenance = createElement('div', 'benchmark-result-provenance', `ID ${result.resultId} · ${displayBenchmarkVersion(result)} · Closed / Available · Llama 2 70B 99% · ${result.scenario} · ${result.acceleratorCount} accelerators · retrieved ${displayDate(result.retrievedDate)} · `);
        const resultLink = createElement('a', 'benchmark-source-link', 'official result ↗');
        resultLink.href = result.summaryUrl;
        resultLink.target = '_blank';
        resultLink.rel = 'noopener noreferrer';
        resultLink.setAttribute('aria-label', `Open official MLPerf® Inference v6.0 result ${result.resultId}`);
        provenance.append(resultLink);
        const footnote = createElement('a', 'benchmark-footnote-link', ' †');
        footnote.href = '#mlperfAttribution';
        footnote.setAttribute('aria-label', `Read MLPerf® Inference v6.0 attribution for result ${result.resultId}`);
        provenance.append(footnote);
        main.append(provenance);
        const details = createElement('details', 'benchmark-system-details');
        details.append(createElement('summary', '', 'Submitted system details'));
        const grid = createElement('dl', 'benchmark-system-grid');
        const fields = [
          ['Result ID', result.resultId],
          ['Release', displayBenchmarkVersion(result)],
          ['Division', result.division],
          ['Availability', result.availability],
          ['Workload / scenario', `${result.workload} / ${result.scenario}`],
          ['Accelerators / nodes', `${result.acceleratorCount} / ${result.nodes}`],
          ['Submitted SUT', result.systemName],
          ['Platform ID', result.platform],
          ['Source accelerator', result.sourceAcceleratorName],
          ['Model weight precision', result.precision || 'See source'],
          ['Host processor', result.hostProcessor || 'See source'],
          ['OS', result.operatingSystem || 'See source'],
          ['Software', result.software || 'See source'],
          ['Performance run', result.sourceLocation || 'See source'],
        ];
        fields.forEach(([label, value]) => {
          grid.append(createElement('dt', '', label), createElement('dd', '', value));
        });
        details.append(grid);
        main.append(details);
      }
      const barTrack = createElement('div', 'benchmark-bar-track');
      barTrack.setAttribute('aria-hidden', 'true');
      const barFill = createElement('div', 'benchmark-bar-fill');
      barFill.style.width = `${(result.score / max) * 100}%`;
      barTrack.append(barFill);
      main.append(barTrack);
      row.append(main);

      const score = createElement('div', 'benchmark-rank-score', formatScore.format(result.score));
      score.append(createElement('small', '', isEnterprise() ? enterpriseMetric().shortLabel : isAccelerator() ? 'WHOLE SYSTEM · TOKENS/S' : 'MEDIAN SAMPLES/MIN'));
      row.append(score);
      const action = createElement('div', 'benchmark-row-action');
      const selected = state.selected.includes(result.id);
      const button = createElement('button', 'benchmark-select-button', selected ? 'Selected ✓' : 'Compare +');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${result.model}${isAccelerator() ? ` result ${result.resultId}` : ''} ${selected ? 'from' : 'to'} comparison`);
      button.disabled = !selected && state.selected.length >= 3;
      button.addEventListener('click', () => {
        if (isEnterprise()) state.focusModelKey = modelKey(result);
        toggleSelected(result.id);
      });
      action.append(button);
      row.append(action);
      elements.rankedResults.append(row);
    });
    finish();
  }

  function toggleSelected(id) {
    if (state.selected.includes(id)) {
      state.selected = state.selected.filter(value => value !== id);
    } else if (state.selected.length < 3) {
      state.selected.push(id);
    }
    if (!state.selected.includes(state.baseline)) state.baseline = state.selected[0] ?? null;
    const restoreFocus = elements.rankedResults.contains(document.activeElement);
    renderRanking();
    renderComparison();
    renderFocus();
    renderModelChart();
    syncViewUrl();
    if (restoreFocus) {
      const row = [...elements.rankedResults.children].find(item => item.dataset.resultId === id);
      row?.querySelector('.benchmark-select-button')?.focus({ preventScroll: true });
    }
  }

  function renderComparison() {
    const cohort = cohortResults();
    const selected = sortedResults(cohort.filter(result => state.selected.includes(result.id)));
    elements.clearComparison.disabled = selected.length === 0;
    elements.baselineSelect.replaceChildren();
    elements.comparisonDiagram.replaceChildren();
    if (!selected.length) {
      const option = createElement('option', '', 'Select a model');
      option.value = '';
      elements.baselineSelect.append(option);
      elements.baselineSelect.disabled = true;
      const empty = createElement('div', 'benchmark-empty');
      empty.append(createElement('strong', '', 'Build a comparison'), createElement('p', '', isAccelerator()
        ? 'Select bars in the chart or use Compare in the table to add up to three tested systems.'
        : 'Select bars in the chart or use Compare in the table to add up to three models.'));
      elements.comparisonDiagram.append(empty);
      elements.comparisonInsight.textContent = isEnterprise()
        ? `Selections use ${state.cpuCount}-CPU published systems and ${enterpriseMetric().name} only.`
        : isAccelerator()
          ? `Selections use published ${acceleratorTest().scenario} systems with eight accelerators, Llama 2 70B 99%, and Tokens/s only.`
        : 'Selections use the current device type, Blender version, and compute grouping.';
      return;
    }
    if (!selected.some(result => result.id === state.baseline)) state.baseline = selected[0].id;
    selected.forEach(result => {
      const option = createElement('option', '', isAccelerator()
        ? `${result.model} · ${result.submitter} · ${result.platform} · ${result.resultId}`
        : isEnterprise() ? `${result.model} · ${result.systemName} · ${formatScore.format(result.score)}` : result.model);
      option.value = String(result.id);
      elements.baselineSelect.append(option);
    });
    elements.baselineSelect.value = String(state.baseline);
    elements.baselineSelect.disabled = selected.length === 1;
    const baseline = selected.find(result => result.id === state.baseline);
    const max = cohort[0]?.score || 1;

    const top = createElement('div', 'benchmark-compare-top');
    top.append(
      createElement('span', '', isEnterprise()
        ? `${enterpriseSuite().label} / ${enterpriseMetric().name} / ${state.cpuCount} CPU / RETRIEVED ${displayDate(activeDataset().meta.snapshotDate)}`
        : isAccelerator()
          ? `MLPerf® Inference v6.0 / Llama 2 70B 99% / ${acceleratorTest().scenario} / 8 accelerators / Tokens/s`
        : `${state.mode === 'graphics' ? 'GPU' : 'CPU'} / BLENDER ${state.version} / COMPUTE: ${state.compute.toUpperCase()}`),
      createElement('span', '', 'RELATIVE TO BASELINE')
    );
    elements.comparisonDiagram.append(top);
    selected.forEach(result => {
      const row = createElement('div', 'benchmark-compare-row');
      row.style.setProperty('--row-color', vendorColor(result.vendor));
      const heading = createElement('div', 'benchmark-compare-row-top');
      heading.append(createElement('span', 'benchmark-compare-name', isAccelerator()
        ? `${result.model} · ${result.submitter} · ${result.resultId}`
        : result.model));
      const actions = createElement('span', 'benchmark-compare-actions');
      actions.append(createElement('strong', 'benchmark-compare-ratio', formatRatio(result.score, baseline.score)));
      const remove = createElement('button', 'benchmark-remove-button', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${result.model}${isAccelerator() ? ` result ${result.resultId}` : ''} from comparison`);
      remove.addEventListener('click', () => toggleSelected(result.id));
      actions.append(remove);
      heading.append(actions);
      row.append(heading);
      const compareSpecs = resultSpecNode(result, 'div', true);
      if (compareSpecs) row.append(compareSpecs);
      const track = createElement('div', 'benchmark-compare-track');
      track.setAttribute('aria-hidden', 'true');
      const position = (result.score / max) * 100;
      const fill = createElement('div', 'benchmark-compare-fill');
      fill.style.width = `${position}%`;
      const marker = createElement('span', 'benchmark-compare-marker');
      marker.style.left = `${position}%`;
      track.append(fill, marker);
      row.append(track);
      row.append(createElement('div', 'benchmark-compare-meta', isEnterprise()
        ? `${formatScore.format(result.score)} ${result.metric} · ${result.benchmarkVersion} · ${result.systemName} · ${result.cpuCount} CPU`
        : isAccelerator()
          ? `${formatScore.format(result.score)} Tokens/s · ${displayBenchmarkVersion(result)} · ${result.systemName} · platform ${result.platform} · ${result.acceleratorCount} accelerators · ${result.precision || 'precision in source'}`
        : `${formatScore.format(result.score)} median samples/min · ${result.vendor}`));
      elements.comparisonDiagram.append(row);
    });
    const axis = createElement('div', 'benchmark-compare-axis');
    axis.append(createElement('span', '', '0'), createElement('span', '', `COHORT MAX ${formatScore.format(max)}`));
    elements.comparisonDiagram.append(axis);

    if (selected.length === 1) {
      elements.comparisonInsight.textContent = isEnterprise()
        ? 'Add a second published system to see its SPEC score ratio against the baseline.'
        : isAccelerator()
          ? 'Add a second published SUT to see its whole-system Tokens/s ratio against the baseline.'
        : 'Add a second model to see its Blender score ratio against the baseline.';
    } else {
      const ratios = selected.filter(result => result.id !== baseline.id)
        .map(result => `${result.model}${isAccelerator() ? ` (${result.submitter}, ${result.resultId})` : ''}: ${formatRatio(result.score, baseline.score)}`);
      elements.comparisonInsight.textContent = isEnterprise()
        ? `Using the ${baseline.systemName} (${baseline.model}) system as 1.00×, ${ratios.join(' · ')}. Ratios describe these published system results; memory, OS, compiler, and tuning differ.`
        : isAccelerator()
          ? `Using ${baseline.model} (${baseline.submitter}, ${baseline.resultId}) as 1.00×, ${ratios.join(' · ')}. Ratios describe published eight-accelerator systems; hosts, model weight precision, and software stacks differ.`
        : `Using ${baseline.model} as 1.00×, ${ratios.join(' · ')}. These community medians pool operating systems, compute backends, and system configurations.`;
    }
  }

  function render() {
    renderControls();
    renderContext();
    renderFocus();
    renderRanking();
    renderComparison();
    renderModelChart();
    syncViewUrl();
  }

  function catalogScoreNode(result) {
    const info = catalogMetricInfo[result.metric];
    const item = createElement('div', 'benchmark-catalog-score');
    item.append(createElement('span', 'benchmark-catalog-score-name', info.label),
      createElement('strong', 'benchmark-catalog-score-value', `${formatScore.format(result.score)} ${info.units}`));
    const meta = createElement('div', 'benchmark-catalog-score-meta');
    if (result.resultId) {
      meta.append(createElement('span', '', `MLPerf® Inference v6.0 · ${result.scenario} · 8 accelerators · ${result.submitter} · ${result.systemName} · ${result.platform} · ID ${result.resultId} · ${result.precision || 'precision in source'} weights · retrieved ${displayDate(result.retrievedDate)} · `));
    } else if (result.cpuCount) {
      const snapshotDate = state.datasets[catalogDataKeyByMetric[result.metric]].meta.snapshotDate;
      meta.append(createElement('span', '', `${result.systemName} · ${result.cpuCount} CPU · ${result.benchmarkVersion} · sponsor ${result.sponsor} · published ${displayDate(result.publishedDate)} · snapshot retrieved ${displayDate(snapshotDate)} · `));
    } else {
      meta.append(createElement('span', '', `Blender ${result.blenderVersion} · ${result.computeType} · ${result.samples || 'see source'} samples · `));
    }
    const source = createElement('a', '', result.resultId ? 'Official SUT ↗' : 'Benchmark source ↗');
    source.href = result.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.setAttribute('aria-label', `Open benchmark source for ${result.model}${result.resultId ? ` result ${result.resultId}` : ''}`);
    meta.append(source);
    if (result.resultId) {
      const summary = createElement('a', '', ' Official result ↗');
      summary.href = result.summaryUrl;
      summary.target = '_blank';
      summary.rel = 'noopener noreferrer';
      summary.setAttribute('aria-label', `Open official MLPerf® Inference v6.0 result ${result.resultId}`);
      const footnote = createElement('a', 'benchmark-footnote-link', ' †');
      footnote.href = '#catalogMlperfAttribution';
      footnote.setAttribute('aria-label', `Read MLPerf® Inference v6.0 attribution for result ${result.resultId}`);
      meta.append(summary, footnote);
    }
    item.append(meta);
    return item;
  }

  function catalogProductNode(product) {
    const results = [...(state.catalog.resultsByProduct.get(product.id) || [])].sort((a, b) =>
      catalogMetricInfo[a.metric].order - catalogMetricInfo[b.metric].order || b.score - a.score || a.id.localeCompare(b.id));
    const status = catalogStatusFor(product);
    const row = createElement('li', 'benchmark-catalog-row');
    const head = createElement('div', 'benchmark-catalog-row-head');
    const main = createElement('div', 'benchmark-catalog-row-main');
    main.append(createElement('div', 'benchmark-catalog-row-title', `${product.vendor} ${product.model}`));
    const meta = createElement('div', 'benchmark-catalog-row-meta', [product.sourceSeries, product.productId && `Product ID ${product.productId}`, product.dashboardTabs.map(catalogTabLabel).join(' · ')].filter(Boolean).join(' · '));
    main.append(meta);
    const coverageSpecs = ['graphics', 'accelerator'].includes(state.catalogType) ? null : productSpecNode(product);
    if (coverageSpecs) main.append(coverageSpecs);
    const dashboard = createElement('a', 'benchmark-catalog-dashboard-link', 'Find in product dashboard ↗');
    dashboard.href = dashboardProductUrl(product);
    dashboard.setAttribute('aria-label', `Find ${product.vendor} ${product.model} in the product dashboard`);
    main.append(dashboard);
    head.append(main);
    const label = status === 'matched' ? 'Selected snapshot result' : status === 'unavailable' ? 'Snapshot data unavailable' : 'No result in these selected snapshots';
    head.append(createElement('span', `benchmark-catalog-status${status === 'matched' ? ' matched' : ''}`, label));
    row.append(head);
    if (results.length || status === 'unavailable') {
      const details = createElement('details', 'benchmark-catalog-details');
      const pending = product.snapshotMetrics.filter(metric => state.datasets[catalogDataKeyByMetric[metric]].error);
      const summaryLabel = results.length
        ? `View ${results.length} exact ${results.length === 1 ? 'result' : 'results'} across ${new Set(results.map(result => result.metric)).size} ${new Set(results.map(result => result.metric)).size === 1 ? 'test' : 'tests'}${pending.length ? `; ${pending.length} test files unavailable` : ''}`
        : `${pending.length} selected snapshot ${pending.length === 1 ? 'file is' : 'files are'} unavailable`;
      details.append(createElement('summary', '', summaryLabel));
      const scores = createElement('div', 'benchmark-catalog-scores');
      results.forEach(result => scores.append(catalogScoreNode(result)));
      pending.forEach(metric => {
        const item = createElement('div', 'benchmark-catalog-score');
        item.append(createElement('span', 'benchmark-catalog-score-name', catalogMetricInfo[metric].label),
          createElement('strong', 'benchmark-catalog-score-value', 'Data unavailable'),
          createElement('span', 'benchmark-catalog-score-meta', 'The snapshot file could not be loaded or validated; no score is shown.'));
        scores.append(item);
      });
      details.append(scores);
      row.append(details);
    }
    return row;
  }

  function renderCatalog() {
    const { products, meta, error, resultsByProduct } = state.catalog;
    elements.catalogResults.replaceChildren();
    if (error) {
      elements.catalogMatchedCount.textContent = '—';
      elements.catalogTotalCount.textContent = '—';
      elements.catalogCoverageNote.textContent = 'The catalog index could not be loaded or validated. Try reloading this page.';
      elements.catalogResultStatus.textContent = 'Catalog unavailable';
      elements.catalogPageStatus.textContent = '';
      elements.catalogMore.hidden = true;
      elements.catalogMlperfAttribution.hidden = true;
      elements.catalogSpecAttribution.hidden = true;
      elements.catalogResults.append(emptyMessage('Catalog unavailable', 'Coverage counts and product matches are hidden until the index validates.', false));
      return;
    }
    const unavailableCount = Object.values(state.datasets).filter(dataset => dataset.error).length;
    const matched = products.filter(product => resultsByProduct.has(product.id)).length;
    const subset = state.catalogType === 'all' ? products : products.filter(product => product.types.includes(state.catalogType));
    const subsetMatched = subset.filter(product => resultsByProduct.has(product.id)).length;
    elements.catalogMatchedCount.textContent = formatScore.format(subsetMatched);
    elements.catalogTotalCount.textContent = formatScore.format(subset.length);
    elements.catalogCoverageNote.textContent = `${state.catalogType === 'all' ? 'Across all indexed dashboard products' : `Within ${catalogTypeLabels[state.catalogType].toLowerCase()}`}, ${formatScore.format(subsetMatched)} have a loaded result in these selected snapshots.${unavailableCount ? ` ${unavailableCount} snapshot ${unavailableCount === 1 ? 'file is' : 'files are'} unavailable, so this count is partial.` : ''} The index contains ${formatScore.format(meta.uniqueCatalogProducts)} distinct products and ${formatScore.format(meta.displayedPlacements)} displayed table placements.`;
    elements.catalogAllButton.classList.toggle('active', state.catalogType === 'all');
    elements.catalogAllButton.setAttribute('aria-pressed', String(state.catalogType === 'all'));
    elements.catalogTypeButtons.forEach(button => {
      const type = button.dataset.catalogType;
      const typeProducts = products.filter(product => product.types.includes(type));
      button.querySelector('span').textContent = `${typeProducts.filter(product => resultsByProduct.has(product.id)).length} matched / ${formatScore.format(typeProducts.length)} indexed`;
      button.classList.toggle('active', state.catalogType === type);
      button.setAttribute('aria-pressed', String(state.catalogType === type));
    });
    const visible = subset.filter(product =>
      (state.catalogStatus === 'all' || catalogStatusFor(product) === state.catalogStatus) &&
      product.searchText.includes(state.catalogSearch));
    const sortRank = { matched: 0, unavailable: 1, unscored: 2 };
    visible.sort((a, b) => sortRank[catalogStatusFor(a)] - sortRank[catalogStatusFor(b)] ||
      a.vendor.localeCompare(b.vendor) || a.model.localeCompare(b.model, undefined, { numeric: true }));
    const shown = visible.slice(0, state.catalogShown);
    shown.forEach(product => elements.catalogResults.append(catalogProductNode(product)));
    if (!visible.length) elements.catalogResults.append(emptyMessage('No matching product', 'Try another model, vendor, product ID, type, or snapshot status.', false));
    elements.catalogResultStatus.textContent = `${formatScore.format(visible.length)} ${visible.length === 1 ? 'product' : 'products'} in this lookup`;
    elements.catalogPageStatus.textContent = visible.length ? `Showing ${formatScore.format(shown.length)} of ${formatScore.format(visible.length)}` : '';
    elements.catalogMore.hidden = shown.length >= visible.length;
    const hasMlperf = shown.some(product => resultsByProduct.get(product.id)?.some(result => result.resultId));
    const hasSpec = shown.some(product => resultsByProduct.get(product.id)?.some(result => result.cpuCount));
    elements.catalogMlperfAttribution.hidden = !hasMlperf;
    elements.catalogSpecAttribution.hidden = !hasSpec;
    if (hasMlperf) {
      const mlperfMeta = state.datasets.acceleratorServer.error ? state.datasets.acceleratorOffline.meta : state.datasets.acceleratorServer.meta;
      const scenarios = Object.values(acceleratorTests).filter(test => !state.datasets[test.key].error).map(test => test.scenario).join(' and ');
      elements.catalogMlperfAttribution.replaceChildren(createElement('span', '', `${mlperfMeta.trademarkNotice} MLPerf® Inference v6.0 · Closed division · Available · Llama 2 70B 99% · ${scenarios} · eight-accelerator whole-system Tokens/s. Selected official results retrieved ${displayDate(mlperfMeta.snapshotDate)} from `));
      const source = createElement('a', '', 'MLCommons published results');
      source.href = safeHttpsUrl(mlperfMeta.sourceUrl) || 'https://mlcommons.org/working-groups/benchmarks/inference/';
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      elements.catalogMlperfAttribution.append(source, createElement('span', '', '. Each listed score carries its submitter, SUT, result ID, official result and SUT links. This independent ChipIndex site is not endorsed by MLCommons.'));
    }
  }


  /** Explain the unit and system boundary beside the results, in everyday language. */
  function renderScoreGuide() {
    const unit = document.getElementById('scoreUnit');
    const meaning = document.getElementById('scoreMeaning');
    const config = document.getElementById('activeConfiguration');
    if (isEnterprise()) {
      unit.textContent = 'SPEC base rate · higher is better';
      meaning.textContent = 'Throughput relative to SPEC’s reference system. For example, 200 vs 100 means twice the throughput in this same test. The score includes the server’s memory and compiler configuration.';
      config.textContent = `${state.suite === '2026' ? state.specBuild + ' · ' : ''}${enterpriseMetric().name} · ${state.cpuCount} ${state.cpuCount === 1 ? 'CPU' : 'CPUs'} per tested server`;
    } else if (isAccelerator()) {
      unit.textContent = 'Tokens per second · higher is better';
      meaning.textContent = 'How much text the complete system generates while meeting this workload’s quality and scenario requirements. This is the combined throughput of eight accelerators.';
      config.textContent = `MLPerf Inference v6.0 · Llama 2 70B 99% · ${acceleratorTest().scenario} · 8 accelerators`;
    } else {
      unit.textContent = 'Samples per minute · higher is better';
      meaning.textContent = `How much Blender rendering work the ${state.mode === 'graphics' ? 'GPU' : 'CPU'} completes per minute. Scores are community medians; ${state.mode === 'graphics' ? 'gaming frame rates' : 'everyday responsiveness and gaming performance'} require different tests.`;
      config.textContent = `Blender ${state.version || '5.2.0'} · ${state.mode === 'graphics' ? 'GPU' : state.clientSegment === 'all' ? 'All client CPUs' : `${state.clientSegment === 'desktop' ? 'Desktop' : 'Laptop'} CPUs`} rendering · ${state.compute || 'mixed'} compute grouping`;
    }
  }

  function setSection(section, focus = false) {
    state.section = ['results', 'coverage', 'sources'].includes(section) ? section : 'results';
    document.querySelectorAll('[data-section]').forEach(button => {
      const active = button.dataset.section === state.section;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      document.getElementById(`${button.dataset.section}Panel`).hidden = !active;
      if (active && focus) button.focus();
    });
    updateRankingScroll();
    updateModelChartScroll();
    syncViewUrl();
  }

  function applyDisplay() {
    document.querySelector('.benchmark-model-chart-body').hidden = state.display !== 'chart';
    document.getElementById('modelTableViewport').hidden = state.display !== 'table';
    document.querySelectorAll('[data-display]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.display === state.display)));
    updateModelChartScroll();
  }

  /** A tabular view uses exactly the same sourced model representatives as the chart. */
  function renderModelTable(groups) {
    const body = document.getElementById('modelTableBody');
    const focused = body.contains(document.activeElement) ? document.activeElement.dataset.resultId : null;
    body.replaceChildren();
    document.querySelector('.benchmark-model-table th:nth-child(4)').textContent = isEnterprise() || isAccelerator() ? 'Reports' : 'Submissions';
    groups.forEach((group, index) => {
      const result = group.representative;
      const row = createElement('tr', '');
      row.dataset.resultId = result.id;
      row.append(createElement('td', '', String(index + 1)));
      const name = createElement('td', 'benchmark-table-model');
      name.append(createElement('strong', '', result.model), createElement('span', '', state.mode === 'client' ? `${result.vendor} · ${result.deviceSegments.map(segment => segment === 'desktop' ? 'Desktop' : 'Laptop').join(' + ') || 'Form factor unclassified'}` : result.vendor));
      const tableSpecs = resultSpecNode(result, 'span');
      if (tableSpecs) name.append(tableSpecs);
      row.append(name, createElement('td', 'benchmark-table-score', formatScore.format(result.score)),
        createElement('td', '', String(isEnterprise() || isAccelerator() ? group.reports.length : result.samples || '—')),
        createElement('td', '', group.reports.length > 1 ? `${formatScore.format(group.minimum)}–${formatScore.format(group.maximum)}` : '—'));
      const sourceCell = createElement('td', '');
      const link = createElement('a', '', isEnterprise() ? `${result.sponsor} ↗` : isAccelerator() ? `${result.submitter} ↗` : 'Blender results ↗');
      link.href = result.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sourceCell.append(link);
      const action = createElement('td', '');
      const selected = state.selected.includes(result.id);
      const button = createElement('button', 'benchmark-text-button benchmark-table-compare', selected ? 'Selected ✓' : 'Compare +');
      button.type = 'button';
      button.dataset.resultId = result.id;
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${result.model} ${selected ? 'from' : 'to'} comparison`);
      button.disabled = !selected && state.selected.length >= 3;
      button.addEventListener('click', () => toggleSelected(result.id));
      action.append(button);
      row.append(sourceCell, action);
      body.append(row);
    });
    if (!groups.length) {
      const row = createElement('tr', '');
      const cell = createElement('td', '', activeDataset().error ? 'Results unavailable. Retry loading the data below.' : 'No results match these filters.');
      cell.colSpan = 7;
      row.append(cell);
      body.append(row);
    }
    if (focused) [...body.querySelectorAll('button')].find(button => button.dataset.resultId === focused)?.focus({ preventScroll: true });
  }

  /** Persist only validated view state; links reopen the same test and system grouping. */
  function syncViewUrl() {
    if (!viewReady) return;
    const url = new URL(location.href);
    const params = new URLSearchParams();
    params.set('mode', state.mode);
    if (isEnterprise()) {
      params.set('suite', state.suite);
      params.set('metric', state.metric);
      if (state.suite === '2026' && state.specBuild) params.set('build', state.specBuild);
      params.set('cpus', String(state.cpuCount));
    } else if (isAccelerator()) params.set('scenario', state.scenario);
    else {
      if (state.mode === 'client' && state.clientSegment !== 'all') params.set('segment', state.clientSegment);
      if (state.version) params.set('version', state.version);
      if (state.compute) params.set('compute', state.compute);
    }
    if (state.manufacturer) params.set('manufacturer', state.manufacturer);
    const stops = coreStops();
    if (stops.length && (state.coreLo > 0 || state.coreHi < stops.length - 1)) {
      params.set('coresMin', String(stops[state.coreLo]));
      params.set('coresMax', String(stops[state.coreHi]));
    }
    if (state.search) params.set('q', state.search);
    if (state.selected.length) params.set('selected', JSON.stringify(state.selected));
    if (state.baseline) params.set('baseline', state.baseline);
    if (state.focusModelKey && isEnterprise()) params.set('model', state.focusModelKey);
    if (state.focusPeerKey && isEnterprise()) params.set('peer', state.focusPeerKey);
    if (state.section !== 'results') params.set('section', state.section);
    if (state.display !== 'chart') params.set('display', state.display);
    if (state.showAllChartModels) params.set('allModels', '1');
    if (state.catalogType !== 'all') params.set('type', state.catalogType);
    if (state.catalogStatus !== 'all') params.set('status', state.catalogStatus);
    if (state.catalogSearch) params.set('catalogSearch', state.catalogSearch);
    url.search = params.toString();
    history.replaceState(null, '', url);
  }

  function restoreView(params) {
    if (['enterprise', 'accelerator', 'client', 'graphics'].includes(params.get('mode'))) state.mode = params.get('mode');
    state.clientSegment = ['desktop', 'laptop'].includes(params.get('segment')) ? params.get('segment') : 'all';
    if (Object.hasOwn(enterpriseSuites, params.get('suite'))) state.suite = params.get('suite');
    if (Object.hasOwn(enterpriseSuite().metrics, params.get('metric'))) state.metric = params.get('metric');
    if (Object.hasOwn(acceleratorTests, params.get('scenario'))) state.scenario = params.get('scenario');
    state.specBuild = params.get('build') || '';
    syncSpecBuild();
    const counts = [...new Set(enterpriseBuildResults().map(result => result.cpuCount))];
    const cpuCount = Number(params.get('cpus'));
    state.cpuCount = counts.includes(cpuCount) ? cpuCount : counts.includes(1) ? 1 : counts.find(Boolean) || 1;
    const versions = new Set(deviceResults().map(result => result.blenderVersion));
    state.version = versions.has(params.get('version')) ? params.get('version') : mostPopulated(deviceResults(), 'blenderVersion');
    const computes = new Set(versionResults().map(result => result.computeType));
    state.compute = computes.has(params.get('compute')) ? params.get('compute') : mostPopulated(versionResults(), 'computeType');
    syncCohortFilters(true);
    if (unfilteredCohortResults().some(result => result.vendor === params.get('manufacturer'))) state.manufacturer = params.get('manufacturer');
    const stops = coreStops();
    const lo = stops.indexOf(Number(params.get('coresMin')));
    const hi = stops.indexOf(Number(params.get('coresMax')));
    if (lo >= 0 && hi >= lo) { state.coreLo = lo; state.coreHi = hi; }
    state.search = (params.get('q') || '').slice(0, 200).toLowerCase();
    elements.modelSearch.value = state.search;
    let selected = [];
    try { selected = JSON.parse(params.get('selected') || '[]'); } catch { /* Ignore malformed shared selections. */ }
    const valid = new Set(cohortResults().map(result => result.id));
    state.selected = Array.isArray(selected) ? [...new Set(selected)].filter(id => valid.has(id)).slice(0, 3) : [];
    state.baseline = state.selected.includes(params.get('baseline')) ? params.get('baseline') : state.selected[0] || null;
    state.focusModelKey = params.get('model');
    state.focusPeerKey = params.get('peer');
    state.section = ['results', 'coverage', 'sources'].includes(params.get('section')) ? params.get('section') : 'results';
    state.display = params.get('display') === 'table' ? 'table' : 'chart';
    state.showAllChartModels = params.get('allModels') === '1';
    state.catalogType = Object.hasOwn(catalogTypeLabels, params.get('type')) ? params.get('type') : 'all';
    state.catalogStatus = ['matched', 'unscored'].includes(params.get('status')) ? params.get('status') : 'all';
    state.catalogSearch = (params.get('catalogSearch') || '').slice(0, 200).toLowerCase();
    elements.catalogSearch.value = state.catalogSearch;
    elements.catalogStatus.value = state.catalogStatus;
    renderCatalog();
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  async function loadSources() {
    const directory = document.getElementById('sourceDirectory');
    try {
      const registry = await fetchJson('../js/data/benchmark-sources.json');
      if (registry.schemaVersion !== 1 || !Array.isArray(registry.sources)) throw new Error('Invalid source directory');
      directory.replaceChildren();
      registry.sources.forEach(source => {
        if (!source.name || !safeHttpsUrl(source.homepage)) return;
        const article = createElement('article', 'benchmark-source-card');
        article.dataset.sourceId = source.id;
        article.dataset.sourceStatus = source.status;
        const head = createElement('div', 'benchmark-source-heading');
        head.append(createElement('h3', '', source.name), createElement('span', 'benchmark-source-status', source.label));
        article.append(head, createElement('p', '', source.description), createElement('div', 'benchmark-source-workloads', source.workloads.join(' · ')));
        const stats = createElement('div', 'benchmark-source-stats');
        if (source.status === 'available') {
          stats.append(createElement('strong', '', `${formatScore.format(source.recordCount)} results · ${formatScore.format(source.productCount)} models`),
            createElement('span', '', `Snapshot ${displayDate(source.lastRetrievedDate)}`));
        } else stats.append(createElement('span', '', 'Scores from this source are not imported into ChipIndex.'));
        article.append(stats);
        const details = createElement('details', 'benchmark-source-details');
        details.append(createElement('summary', '', 'Access, scope & limitations'), createElement('p', '', source.accessMethod));
        const list = createElement('ul', '');
        source.limitations.forEach(limit => list.append(createElement('li', '', limit)));
        details.append(list);
        (source.datasets || []).forEach(dataset => {
          const item = createElement('div', 'benchmark-source-dataset');
          item.append(createElement('strong', '', dataset.label),
            createElement('span', '', `${formatScore.format(dataset.productCount)} models · ${formatScore.format(dataset.recordCount)} results · captured ${displayDate(dataset.snapshotDate)}`),
            createElement('p', '', dataset.scope));
          details.append(item);
        });
        if (source.rightsNote) details.append(createElement('p', '', source.rightsNote));
        const refs = createElement('div', 'benchmark-source-references');
        source.references.forEach(ref => {
          if (!safeHttpsUrl(ref.url)) return;
          const link = createElement('a', '', `${ref.label} ↗`);
          link.href = ref.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; refs.append(link);
        });
        details.append(refs); article.append(details);
        const actions = createElement('div', 'benchmark-source-actions');
        const modes = source.id === 'spec' ? [['enterprise', 'Explore CPU results']] : source.id === 'mlperf' ? [['accelerator', 'Explore AI results']] : source.id === 'blender' ? [['client', 'CPU rendering'], ['graphics', 'GPU rendering']] : [];
        if (source.status === 'available') modes.forEach(([mode, label]) => {
          const button = createElement('button', 'benchmark-text-button', label);
          button.type = 'button';
          button.addEventListener('click', () => { selectMode(mode); setSection('results', true); });
          actions.append(button);
        });
        const home = createElement('a', 'benchmark-text-button', 'Visit public source ↗');
        home.href = source.homepage; home.target = '_blank'; home.rel = 'noopener noreferrer'; actions.append(home);
        article.append(actions); directory.append(article);
      });
    } catch {
      directory.replaceChildren(createElement('p', 'benchmark-empty', 'The source directory could not be loaded. Your selected benchmark results are available in Explore results.'));
      const retry = createElement('button', 'benchmark-text-button', 'Retry source directory');
      retry.type = 'button'; retry.addEventListener('click', loadSources); directory.append(retry);
    }
  }

  function wireExplorer() {
    document.getElementById('reviewSources').addEventListener('click', () => setSection('sources', true));
    document.getElementById('rankingMore').addEventListener('click', () => { state.rankingLimit += 100; renderRanking(); });
    elements.specBuildSelect.addEventListener('change', event => {
      state.specBuild = event.target.value;
      syncSpecBuild();
      const counts = enterpriseBuildResults().map(result => result.cpuCount);
      if (!counts.includes(state.cpuCount)) state.cpuCount = counts.includes(1) ? 1 : counts[0] || 1;
      state.search = ''; elements.modelSearch.value = '';
      syncCohortFilters(true); resetSelection(); render();
    });
    elements.clientSegmentControls.querySelectorAll('[data-segment]').forEach(button => button.addEventListener('click', () => selectClientSegment(button.dataset.segment)));
    const sections = [...document.querySelectorAll('[data-section]')];
    sections.forEach((button, index) => {
      button.addEventListener('click', () => setSection(button.dataset.section));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % sections.length;
        if (event.key === 'ArrowLeft') next = (index + sections.length - 1) % sections.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = sections.length - 1;
        if (next === undefined) return;
        event.preventDefault(); setSection(sections[next].dataset.section, true);
      });
    });
    document.querySelectorAll('[data-display]').forEach(button => button.addEventListener('click', () => {
      state.display = button.dataset.display; applyDisplay(); syncViewUrl();
    }));
    document.getElementById('viewComparison').addEventListener('click', () => {
      elements.comparisonTitle.tabIndex = -1;
      elements.comparisonTitle.focus({ preventScroll: true });
      elements.comparisonTitle.closest('.benchmark-comparison').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    document.getElementById('resetFilters').addEventListener('click', () => {
      state.search = ''; elements.modelSearch.value = ''; syncCohortFilters(true); resetSelection(); render();
    });
    document.getElementById('shareView').addEventListener('click', async () => {
      syncViewUrl();
      const status = document.getElementById('shareStatus');
      const button = document.getElementById('shareView');
      try {
        await navigator.clipboard.writeText(location.href);
        button.textContent = 'Link copied'; status.textContent = 'Link copied with this test, filters, and comparison.';
        setTimeout(() => { button.textContent = 'Copy view link'; }, 2500);
      } catch {
        status.textContent = 'Copy the current address from your browser to share this view.';
        button.textContent = 'Use browser address to share';
      }
    });
    window.addEventListener('popstate', () => { restoreView(new URLSearchParams(location.search)); render(); setSection(state.section); });
  }

  async function loadData() {
    const restoreParams = viewReady ? new URLSearchParams(location.search) : initialView;
    viewReady = false;
    const entries = await Promise.all(Object.entries(dataUrls).map(async ([key, url]) => {
      try {
        const payload = await fetchJson(url);
        if (!Array.isArray(payload.results)) throw new Error('Invalid result format');
        const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : {};
        const acceleratorConfig = acceleratorConfigByKey[key];
        if (acceleratorConfig && !validAcceleratorCohort(meta, acceleratorConfig)) throw new Error('Invalid accelerator cohort');
        if (enterpriseConfigByKey[key] && meta.metric !== enterpriseConfigByKey[key].name) throw new Error('Invalid SPEC metric');
        const normalized = key === 'blender'
          ? payload.results.map(normalizedBlenderResult)
          : acceleratorConfig
            ? payload.results.map(raw => normalizedAcceleratorResult(raw, meta, acceleratorConfig))
          : payload.results.map(raw => normalizedEnterpriseResult(raw, key));
        if (normalized.some(result => !result)) throw new Error('Invalid result row');
        if (new Set(normalized.map(result => result.id)).size !== normalized.length) throw new Error('Duplicate result ID');
        return [key, { results: normalized, meta, error: false }];
      } catch {
        return [key, { results: [], meta: {}, error: true }];
      }
    }));
    entries.forEach(([key, dataset]) => { state.datasets[key] = dataset; });
    modelEvidenceViewKey = null;
    const suiteIdsNewestFirst = Object.keys(enterpriseSuites).sort((a, b) => Number(b) - Number(a));
    state.suite = suiteIdsNewestFirst.find(suite =>
      Object.values(enterpriseSuites[suite].metrics).some(metric => state.datasets[metric.key].results.length)) || suiteIdsNewestFirst[0];
    state.metric = Object.keys(enterpriseSuite().metrics).find(metric =>
      state.datasets[enterpriseSuite().metrics[metric].key].results.length) || Object.keys(enterpriseSuite().metrics)[0];
    syncSpecBuild();
    state.scenario = Object.keys(acceleratorTests).find(scenario => state.datasets[acceleratorTests[scenario].key].results.length) || Object.keys(acceleratorTests)[0];
    const counts = [...new Set(enterpriseBuildResults().map(result => result.cpuCount))].sort((a, b) => a - b);
    state.cpuCount = counts.includes(1) ? 1 : counts[0] || 1;
    state.version = mostPopulated(deviceResults(), 'blenderVersion');
    state.compute = mostPopulated(versionResults(), 'computeType');
    syncCohortFilters(true);
    resetSelection();
    await loadCatalog();
    restoreView(restoreParams);
    viewReady = true;
    render();
    setSection(state.section);
  }

  elements.modeButtons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
  elements.suiteButtons.forEach(button => button.addEventListener('click', () => selectSuite(button.dataset.suite)));
  elements.acceleratorTestButtons.forEach(button => button.addEventListener('click', () => selectAcceleratorTest(button.dataset.scenario)));
  elements.metricButtons.forEach(button => button.addEventListener('click', () => selectMetric(button.dataset.metric)));
  elements.socketSelect.addEventListener('change', event => selectCpuCount(event.target.value));
  elements.manufacturerSelect.addEventListener('change', event => selectManufacturer(event.target.value));
  elements.coreMin.addEventListener('input', event => selectCoreEnd('min', event.target.value));
  elements.coreMax.addEventListener('input', event => selectCoreEnd('max', event.target.value));
  elements.coreField.querySelector('.benchmark-core-track').addEventListener('click', event => {
    if (event.target === elements.coreMin || event.target === elements.coreMax) return;
    const stops = coreStops();
    if (stops.length < 2) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const index = Math.round(position * (stops.length - 1));
    const end = state.coreLo === state.coreHi
      ? (index < state.coreLo ? 'min' : 'max')
      : Math.abs(index - state.coreLo) <= Math.abs(index - state.coreHi) ? 'min' : 'max';
    selectCoreEnd(end, index);
  });
  elements.versionSelect.addEventListener('change', event => selectVersion(event.target.value));
  elements.computeSelect.addEventListener('change', event => selectCompute(event.target.value));
  elements.modelSearch.addEventListener('input', event => {
    state.search = event.target.value.trim().toLowerCase();
    renderContext();
    renderFocus();
    renderRanking();
    renderModelChart();
    syncViewUrl();
  });
  elements.focusModelQuery.addEventListener('input', event => {
    state.focusQuery = event.target.value.trim().toLowerCase();
    renderFocus();
    highlightFocusedModelChart();
    syncViewUrl();
  });
  elements.focusModelSelect.addEventListener('change', event => {
    state.focusModelKey = event.target.value;
    renderFocus();
    highlightFocusedModelChart();
    syncViewUrl();
  });
  elements.focusPeerSelect.addEventListener('change', event => {
    state.focusPeerKey = event.target.value;
    renderFocus();
    syncViewUrl();
  });
  elements.baselineSelect.addEventListener('change', event => {
    state.baseline = event.target.value;
    renderComparison();
    syncViewUrl();
  });
  elements.clearComparison.addEventListener('click', () => {
    state.selected = [];
    state.baseline = null;
    renderRanking();
    renderComparison();
    renderModelChart();
    syncViewUrl();
  });
  if ('ResizeObserver' in window) new ResizeObserver(updateRankingScroll).observe(elements.rankedResults);
  if ('ResizeObserver' in window) new ResizeObserver(updateModelChartScroll).observe(elements.modelChartViewport);
  window.addEventListener('resize', updateRankingScroll);
  window.addEventListener('resize', updateModelChartScroll);
  elements.modelChartDisclosure.addEventListener('toggle', updateModelChartScroll);
  elements.modelChartRangeButton.addEventListener('click', () => {
    state.showAllChartModels = !state.showAllChartModels;
    elements.modelChartViewport.scrollLeft = 0;
    renderModelChart();
    syncViewUrl();
  });
  elements.catalogAllButton.addEventListener('click', () => {
    state.catalogType = 'all';
    state.catalogShown = 25;
    renderCatalog();
    syncViewUrl();
  });
  elements.catalogTypeButtons.forEach(button => button.addEventListener('click', () => {
    state.catalogType = button.dataset.catalogType;
    state.catalogShown = 25;
    renderCatalog();
    syncViewUrl();
  }));
  elements.catalogSearch.addEventListener('input', event => {
    state.catalogSearch = event.target.value.trim().toLowerCase();
    state.catalogShown = 25;
    renderCatalog();
    syncViewUrl();
  });
  elements.catalogStatus.addEventListener('change', event => {
    state.catalogStatus = event.target.value;
    state.catalogShown = 25;
    renderCatalog();
    syncViewUrl();
  });
  elements.catalogMore.addEventListener('click', () => {
    state.catalogShown += 25;
    renderCatalog();
    syncViewUrl();
  });

  wireExplorer();
  restoreProductsLink();
  loadData().finally(() => {
    mainContent.inert = false;
    mainContent.removeAttribute('aria-busy');
  });
  loadSources();
})();

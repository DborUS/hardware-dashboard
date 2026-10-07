// Product-table benchmark pointers. Every visible score comes from a reviewed
// source result; SPEC scores describe submitted systems, not CPU-only performance.

function benchmarkTableColumns(tab) {
  return ['amd/epyc', 'intel/xeon', 'ampere/processors', 'nvidia/cpu',
    'amd/ryzen', 'intel/client'].includes(tab) ? ['Benchmark'] : [];
}

function benchmarkTableHeaders(tab) {
  if (!benchmarkTableColumns(tab).length) return '';
  const title = ['amd/ryzen', 'intel/client'].includes(tab)
    ? 'Blender Open Data 5.2.0 CPU rendering median; select a score to inspect the model and submissions'
    : 'One published SPEC CPU base-rate system result; select a score to inspect the model and tested configuration';
  return `<th title="${benchmarkTableEscape(title)}">Benchmark</th>`;
}

function benchmarkTableLegend() { return ''; }

function benchmarkTableEscape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function benchmarkTableLookup(vendor, model) {
  const key = JSON.stringify([String(vendor).trim().toLowerCase(), String(model).trim().toLowerCase()]);
  return BENCHMARK_TABLE_INDEX.products[key] || null;
}

function benchmarkTableNumber(score) {
  return Number(score).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function benchmarkTableEmpty() {
  return '<td class="bt-cell"><span class="bt-empty" aria-label="No result in the imported benchmark snapshots">—</span></td>';
}

function benchmarkTableSpecCell(vendor, model, data) {
  const result = data?.featuredSpec;
  if (!result) return benchmarkTableEmpty();
  const params = new URLSearchParams({
    mode: 'enterprise',
    suite: result.suite,
    metric: result.metric,
    build: result.build,
    cpus: String(result.cpus),
    manufacturer: vendor,
    q: model,
    model: JSON.stringify([String(vendor).trim().toLowerCase(), String(model).trim().toLowerCase()])
  });
  const href = `benchmarks/?${params}`;
  const buildTag = result.build.split(' ').at(-1);
  const test = `SPEC${result.metric === 'integer' ? 'int' : 'fp'}${result.suite.slice(-2)} ${buildTag} ${result.cpus}P`;
  const score = benchmarkTableNumber(result.score);
  const detail = `SPEC CPU${result.suite} ${result.metric === 'integer' ? 'Integer' : 'Floating-point'} Rate, ${result.build}, ${result.cpus}-CPU system. ${result.reports > 1 ? `Lower-middle published system report of ${result.reports} imported reports` : 'One published system report'}. Score ${score} base rate. Open ${vendor} ${model} in Benchmarks.`;
  return `<td class="bt-cell"><a href="${benchmarkTableEscape(href)}" title="${benchmarkTableEscape(detail)}" aria-label="${benchmarkTableEscape(detail)}"><span class="bt-test">${benchmarkTableEscape(test)}</span><span class="bt-score">${benchmarkTableEscape(score)}</span></a></td>`;
}

function benchmarkTableRenderCell(vendor, model, data) {
  const result = data?.render;
  if (!result) return benchmarkTableEmpty();
  const [rawScore, samples] = result;
  const params = new URLSearchParams({
    mode: 'client', version: '5.2.0', compute: 'mixed', manufacturer: vendor, q: model
  });
  const href = `benchmarks/?${params}`;
  const score = benchmarkTableNumber(rawScore);
  const detail = `Blender Open Data 5.2.0 mixed-compute CPU rendering median, ${score} samples per minute across ${samples} submitted samples for ${vendor} ${model}. Open this model in Benchmarks.`;
  return `<td class="bt-cell"><a href="${benchmarkTableEscape(href)}" title="${benchmarkTableEscape(detail)}" aria-label="${benchmarkTableEscape(detail)}"><span class="bt-test">Blender5.2</span><span class="bt-score">${benchmarkTableEscape(score)}</span></a></td>`;
}

function benchmarkTableCells(vendor, tab, model) {
  const data = benchmarkTableLookup(vendor, model);
  if (['amd/epyc', 'intel/xeon', 'ampere/processors', 'nvidia/cpu'].includes(tab)) {
    return benchmarkTableSpecCell(vendor, model, data);
  }
  if (['amd/ryzen', 'intel/client'].includes(tab)) return benchmarkTableRenderCell(vendor, model, data);
  return '';
}

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const directory = process.env.STUDIO_STATE_BUILD;
const storePath = path.join(directory, 'selection-store.cjs');
const persistencePath = path.join(directory, 'selection-persistence.cjs');
assert.ok(fs.existsSync(storePath) && fs.existsSync(persistencePath), 'Typed selection store and persistence are not implemented');
const { createSelectionStore } = require(storePath);
const { restoreSelection, serializeSelectionURL, persistSelection } = require(persistencePath);
const core = require('../data/handoff-core.js');
const designs = require('../data/design-catalog.js');
const palettes = require('../data/palettes.json');
const fonts = require('../data/fonts.json');
const icons = fs.readdirSync(path.join(__dirname, '../data/icon-parts')).filter(n => n.endsWith('.js')).flatMap(file => JSON.parse(fs.readFileSync(path.join(__dirname, '../data/icon-parts', file), 'utf8').match(/\.push\((\[[\s\S]*\])\);/)[1]));
const deps = { core, designs, palettes, fonts, icons };
const initial = () => core.normalize({ ...designs.sets[0].config, designSelection: designs.selection('studio') }, palettes, fonts, icons);
const storage = (records = {}) => ({ getItem(key) { return records[key] ?? null; }, setItem(key, value) { records[key] = value; } });
const stored = config => storage({ 'palette-studio-handoff-v1': JSON.stringify(config) });
const fullHash = config => '#selection=' + encodeURIComponent(JSON.stringify(config));

test('deep patches preserve font, design and component siblings and unrelated config', () => {
  const store = createSelectionStore(deps, initial());
  const before = store.getConfig();
  store.update({ fonts: { body: 'inter' }, style: 'outline', designSelection: { concept: 'glass', components: { button: 'outline' } } });
  const want = structuredClone(before);
  want.fonts.body = 'inter'; want.style = 'outline'; want.designSelection.concept = 'glass'; want.designSelection.components.button = 'outline';
  assert.deepEqual(store.getConfig(), want);
});

test('snapshots stay stable until a commit, are deeply immutable, and reads are defensive', () => {
  const input = initial();
  const store = createSelectionStore(deps, input);
  const snapshot = store.getSnapshot();
  assert.equal(store.getSnapshot(), snapshot);
  const copy = store.getConfig(); copy.fonts.body = 'inter'; copy.icons.push('house'); copy.designSelection.components.button = 'outline';
  input.designSelection.components.button = 'soft';
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(snapshot.fonts.body, 'pretendard'); assert.equal(snapshot.designSelection.components.button, 'solid');
  for (const value of [snapshot, snapshot.fonts, snapshot.icons, snapshot.designSelection, snapshot.designSelection.components]) assert.ok(Object.isFrozen(value));
  store.update({ project: 'Changed App' });
  assert.notEqual(store.getSnapshot(), snapshot); assert.equal(snapshot.project, 'My Web App');
});

for (const route of ['initial config', 'nested patch', 'restored JSON']) test(`retained font metadata is recursively owned for ${route}`, () => {
  const metadata = { label: 'original', tags: [{ value: 'retained' }], optional: null };
  const input = initial(); input.fonts.metadata = metadata;
  const restored = route === 'restored JSON' ? restoreSelection(deps, fullHash(input), undefined).config : input;
  const store = createSelectionStore(deps, route === 'nested patch' ? initial() : restored);
  if (route === 'nested patch') store.update({ fonts: { metadata } });
  let calls = 0; store.subscribe(() => { calls++; });
  const snapshot = store.getSnapshot();
  assert.equal(Object.isFrozen(restored.fonts.metadata), false);
  assert.equal(Object.isFrozen(metadata.tags), false);
  const copy = store.getConfig();
  restored.fonts.metadata.label = 'source mutation';
  metadata.tags[0].value = 'input mutation';
  copy.fonts.metadata.label = 'read mutation';
  copy.fonts.metadata.tags[0].value = 'nested read mutation';
  copy.fonts.metadata.tags.push({ value: 'extra' });
  assert.equal(store.getSnapshot(), snapshot);
  assert.equal(calls, 0);
  assert.deepEqual(snapshot.fonts.metadata, { label: 'original', tags: [{ value: 'retained' }], optional: null });
  for (const value of [snapshot.fonts.metadata, snapshot.fonts.metadata.tags, snapshot.fonts.metadata.tags[0]]) assert.ok(Object.isFrozen(value));
  assert.deepEqual(store.getConfig().fonts.metadata, { label: 'original', tags: [{ value: 'retained' }], optional: null });
});

test('invalid patches never commit or notify; successful updates notify once and unsubscribe', () => {
  const store = createSelectionStore(deps, initial());
  let calls = 0; const stop = store.subscribe(() => { calls++; assert.equal(store.getConfig().project, 'Changed App'); });
  const before = store.getSnapshot();
  for (const patch of [{ palette: 'missing' }, { project: '<invalid>' }, { designSelection: { components: { button: 'missing' } } }]) {
    assert.throws(() => store.update(patch)); assert.equal(store.getSnapshot(), before); assert.equal(calls, 0);
  }
  store.update({ project: '  Changed App  ' }); assert.equal(calls, 1);
  stop(); store.update({ project: 'After Stop' }); assert.equal(calls, 1);
});

test('selectSet resets preset fields and preserves chooseSet context including uiLibrary/icons/source', () => {
  const store = createSelectionStore(deps, { ...initial(), project: 'Existing App', target: 'existing-app', scope: 'dark-only', framework: 'astro', layout: 'content', uiLibrary: 'mui', icons: ['house'], fonts: { body: 'inter', code: 'fira-code', source: 'cdn-first' } });
  store.update({ designSelection: { motion: 'none', navigation: 'hybrid', components: { button: 'outline' } } });
  store.selectSet('bloom');
  const config = store.getConfig();
  assert.deepEqual({ ...config, designSelection: undefined }, { project: 'Existing App', palette: 'pearl-lavender', style: 'soft', target: 'existing-app', scope: 'dark-only', framework: 'astro', layout: 'content', uiLibrary: 'mui', icons: ['house'], fonts: { body: 'pretendard', code: 'd2coding', source: 'cdn-first' }, designSelection: undefined });
  assert.deepEqual(config.designSelection, { set: 'bloom', concept: 'soft', motion: 'standard', navigation: 'top', navigationStyle: 'pill', navigationStructure: 'list', dashboardLayout: 'cards', components: { popover: 'soft', button: 'solid', input: 'soft', select: 'soft', switch: 'solid', checkbox: 'soft', toast: 'soft', alert: 'soft', dialog: 'soft', drawer: 'soft', tooltip: 'soft', menu: 'soft', tabs: 'soft', breadcrumb: 'soft', pagination: 'soft', card: 'soft', badge: 'soft', accordion: 'soft', empty: 'soft', 'bar-chart': 'soft', 'stacked-bar': 'soft', 'line-chart': 'soft', 'area-chart': 'soft', 'donut-chart': 'soft', 'pie-chart': 'soft', 'histogram': 'soft', 'scatter-chart': 'soft', 'heatmap': 'soft', 'sparkline': 'soft', 'metric': 'soft', 'progress': 'soft', 'circular-progress': 'soft', 'stepper': 'soft', 'skeleton': 'soft', 'spinner': 'soft', 'error-state': 'soft', 'radio': 'soft', 'textarea': 'soft', 'slider': 'soft', 'date-picker': 'soft', 'file-upload': 'soft', 'combobox': 'soft', 'data-table': 'soft', 'avatar': 'soft', 'timeline': 'soft', 'list': 'soft', 'separator': 'soft' } });
  const snapshot = store.getSnapshot(); assert.throws(() => store.selectSet('missing')); assert.equal(store.getSnapshot(), snapshot);
});

test('system font normalization also applies when switching presets', () => {
  const store = createSelectionStore(deps, initial()); store.update({ fonts: { source: 'system' } }); store.selectSet('console');
  assert.deepEqual(store.getConfig().fonts, { body: 'system', code: 'system', source: 'system' });
});

test('dashboard layout is an independent choice retained across design sets and shared selections', () => {
  const store = createSelectionStore(deps, initial());
  store.update({ designSelection: { dashboardLayout: 'status-distribution' } });
  assert.equal(store.getConfig().designSelection.dashboardLayout, 'status-distribution');
  store.selectSet('console');
  assert.equal(store.getConfig().designSelection.dashboardLayout, 'status-distribution');
  const config = store.getConfig(), restored = restoreSelection(deps, fullHash(config), undefined);
  assert.equal(restored.config.designSelection.dashboardLayout, 'status-distribution');
  const saved = storage();
  assert(persistSelection(saved, config).saved);
  assert.equal(restoreSelection(deps, '', saved).config.designSelection.dashboardLayout, 'status-distribution');
});

for (const key of ['selection', 'catalogConfig']) test(`${key} full URL wins over storage and ignores single-field config overrides`, () => {
  const chosen = { ...initial(), project: 'Linked App', palette: 'warm-sage' };
  const result = restoreSelection(deps, '#' + key + '=' + encodeURIComponent(JSON.stringify(chosen)) + '&palette=slate-blue', stored({ ...initial(), project: 'Stored App' }));
  assert.deepEqual(result.config, chosen); assert.equal(result.recovery, '');
});

test('legacy single-field links override storage, migrate existing-gate, and preserve font siblings', () => {
  const result = restoreSelection(deps, '#palette=warm-sage&target=existing-gate&bodyFont=inter&concept=glass&icons=house,search', stored({ ...initial(), project: 'Stored App' }));
  assert.equal(result.config.project, 'Stored App'); assert.equal(result.config.palette, 'warm-sage'); assert.equal(result.config.target, 'existing-app'); assert.equal(result.config.scope, 'dark-only');
  assert.deepEqual(result.config.fonts, { body: 'inter', code: 'd2coding', source: 'local-only' }); assert.equal(result.config.designSelection.concept, 'glass'); assert.deepEqual(result.config.icons, ['house', 'search']);
});

test('legacy storage restores font aliases and migrates existing-gate', () => {
  const result = restoreSelection(deps, '', storage({ 'palette-studio-v1': JSON.stringify({ palette: 'warm-sage', bodyFont: 'inter', codeFont: 'fira-code', fontSource: 'cdn-first', target: 'existing-gate' }) }));
  assert.equal(result.config.palette, 'warm-sage'); assert.equal(result.config.target, 'existing-app'); assert.equal(result.config.scope, 'dark-only'); assert.deepEqual(result.config.fonts, { body: 'inter', code: 'fira-code', source: 'cdn-first' });
});

test('missing storage uses the default studio selection', () => { assert.deepEqual(restoreSelection(deps, '', undefined).config, initial()); });
for (const value of ['broken', '[]', '42', '"text"', '{"palette":"missing"}']) test(`invalid stored value ${value} recovers before valid link overrides`, () => {
  const result = restoreSelection(deps, '#palette=warm-sage', storage({ 'palette-studio-handoff-v1': value }));
  assert.equal(result.config.palette, 'warm-sage'); assert.equal(result.config.project, 'My Web App'); assert.ok(result.recovery);
});
for (const hash of ['#selection=%7B', '#selection=null', '#selection=[]', '#selection=%25', '#palette=%E0%A4%A', '#designSelection=%7B']) test(`malformed fragment ${hash} returns a usable default selection`, () => {
  const result = restoreSelection(deps, hash, stored(initial())); assert.deepEqual(result.config, initial()); assert.ok(result.recovery);
});
for (const broken of [() => { throw Error('blocked getter'); }, { getItem() { throw Error('blocked read'); }, setItem() { throw Error('blocked write'); } }]) test('storage access failures preserve valid link and return a save failure', () => {
  const result = restoreSelection(deps, '#palette=warm-sage', broken); assert.equal(result.config.palette, 'warm-sage'); assert.ok(result.recovery);
  const saved = persistSelection(broken, initial()); assert.equal(saved.saved, false); assert.ok(saved.message);
});

test('full URL selection can restore when storage getter throws', () => {
  const result = restoreSelection(deps, fullHash(initial()), () => { throw Error('blocked getter'); }); assert.deepEqual(result.config, initial());
});

test('URL roundtrip preserves path/query and view while exports/persistence exclude view and tool theme', () => {
  const config = initial(); const view = { mode: 'compare', compare: 'warm-sage', compareMode: 'dark' };
  const shared = serializeSelectionURL('https://example.test/subpath/index.html?source=test#old', config, view);
  const url = new URL(shared); assert.equal(url.pathname, '/subpath/index.html'); assert.equal(url.search, '?source=test');
  const result = restoreSelection(deps, url.hash, stored({ ...initial(), project: 'Other App' })); assert.deepEqual(result.config, config); assert.deepEqual(result.view, view);
  const records = {}; assert.equal(persistSelection(storage(records), config).saved, true); assert.deepEqual(JSON.parse(records['palette-studio-handoff-v1']), config);
  assert.equal(core.profile(result.config, palettes).mode, undefined); assert.equal(core.profile(result.config, palettes).theme, undefined); assert.ok(!url.hash.includes('theme='));
});

test('view storage is independent; URL fields override it and invalid values recover to view defaults', () => {
  const saved = storage({ 'palette-studio-view-v1': JSON.stringify({ mode: 'dark', compare: 'warm-sage', compareMode: 'dark' }) });
  assert.deepEqual(restoreSelection(deps, '#mode=light', saved).view, { mode: 'light', compare: 'warm-sage', compareMode: 'dark' });
  assert.deepEqual(restoreSelection(deps, '#mode=unknown&compare=missing&compareMode=unknown', saved).view, { mode: 'split', compare: 'slate-indigo', compareMode: 'light' });
});

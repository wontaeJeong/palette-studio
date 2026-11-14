import { normalizeSelection } from './selection-store';
import type { SelectionConfig, SelectionDependencies, SelectionSnapshot, StorageSource, ViewSettings } from './types';

const selectionKey = 'palette-studio-handoff-v1';
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function read(storage: StorageSource, key: string): { value: unknown; failed: boolean } {
  try {
    const source = typeof storage === 'function' ? storage() : storage;
    const raw = source?.getItem(key);
    return { value: raw ? JSON.parse(raw) as unknown : null, failed: false };
  } catch {
    return { value: null, failed: true };
  }
}
function initial(dependencies: SelectionDependencies): SelectionConfig {
  return normalizeSelection(dependencies, { ...dependencies.designs.sets[0].config, designSelection: dependencies.designs.selection('studio') });
}
function migrate(candidate: Record<string, unknown>): Record<string, unknown> {
  return candidate.target === 'existing-gate' ? { ...candidate, target: 'existing-app', scope: 'dark-only' } : candidate;
}
function restoreView(dependencies: SelectionDependencies, params: URLSearchParams, storage: StorageSource): ViewSettings {
  const saved = read(storage, 'palette-studio-view-v1').value;
  const view = object(saved) ? saved : {};
  const mode = params.get('mode') || view.mode || 'split';
  const compare = params.get('compare') || view.compare || 'slate-indigo';
  const compareMode = params.get('compareMode') || view.compareMode || 'light';
  const validPalette = dependencies.palettes.palettes.some(palette => palette.id === compare);
  return {
    mode: mode === 'light' || mode === 'dark' || mode === 'compare' ? mode : 'split',
    compare: validPalette ? compare as ViewSettings['compare'] : 'slate-indigo',
    compareMode: validPalette && compareMode === 'dark' ? 'dark' : 'light',
  };
}

export function restoreSelection(dependencies: SelectionDependencies, hash: string, storage?: StorageSource): { config: SelectionConfig; view: ViewSettings; recovery: string } {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const view = restoreView(dependencies, params, storage);
  let recovery = '';
  try {
    let candidate: Record<string, unknown>;
    if (params.has('selection') || params.has('catalogConfig')) {
      const parsed: unknown = JSON.parse(params.get('selection') || params.get('catalogConfig') || 'null');
      if (!object(parsed)) throw Error('Invalid selection');
      candidate = parsed;
    } else {
      const saved = read(storage, selectionKey);
      if (saved.failed) recovery = '저장된 선택을 읽지 못했습니다. 링크의 선택값을 우선 사용합니다.';
      const old = read(storage, 'palette-studio-v1').value;
      const legacy = object(old) ? old : {};
      const defaults = initial(dependencies);
      const stored = saved.value || {
        ...defaults,
        ...legacy,
        fonts: { body: legacy.bodyFont || defaults.fonts.body, code: legacy.codeFont || defaults.fonts.code, source: legacy.fontSource || defaults.fonts.source },
      };
      if (!object(stored)) {
        candidate = { ...defaults };
        recovery = '저장된 설정을 복원할 수 없어 기본값에서 시작합니다. 링크의 선택값을 우선 사용합니다.';
      } else {
        try { candidate = { ...normalizeSelection(dependencies, migrate(stored)) }; }
        catch {
          candidate = { ...defaults };
          recovery = '저장된 설정이 오래되어 기본값을 복원했습니다. 링크의 선택값을 우선 사용합니다.';
        }
      }
      for (const key of ['palette', 'style', 'target', 'scope', 'layout', 'framework', 'uiLibrary', 'project']) {
        if (params.has(key)) candidate[key] = params.get(key);
      }
      candidate = migrate(candidate);
      const selectedFonts = object(candidate.fonts) ? { ...candidate.fonts } : {};
      for (const [key, name] of [['bodyFont', 'body'], ['codeFont', 'code'], ['fontSource', 'source']]) {
        if (params.has(key)) selectedFonts[name] = params.get(key);
      }
      candidate.fonts = selectedFonts;
      if (params.has('icons')) candidate.icons = (params.get('icons') || '').split(',').filter(Boolean);
      if (params.has('concept')) candidate.designSelection = { ...(object(candidate.designSelection) ? candidate.designSelection : dependencies.designs.selection('studio')), concept: params.get('concept') };
      if (params.has('designSelection')) candidate.designSelection = JSON.parse(params.get('designSelection') || 'null') as unknown;
    }
    return { config: normalizeSelection(dependencies, candidate), view, recovery };
  } catch {
    return { config: initial(dependencies), view, recovery: '저장된 선택을 읽지 못해 기본 세트를 표시합니다.' };
  }
}

export function serializeSelectionURL(url: string | URL, config: SelectionSnapshot, view: ViewSettings): string {
  const result = new URL(url);
  result.hash = new URLSearchParams({ selection: JSON.stringify(config), mode: view.mode, compare: view.compare, compareMode: view.compareMode }).toString();
  return result.href;
}

export function persistSelection(storage: StorageSource, config: SelectionSnapshot): { saved: boolean; message: string } {
  try {
    const source = typeof storage === 'function' ? storage() : storage;
    if (!source) throw Error('Storage unavailable');
    source.setItem(selectionKey, JSON.stringify(config));
    return { saved: true, message: '자동 저장됨' };
  } catch {
    return { saved: false, message: '브라우저 저장을 사용할 수 없습니다. 링크나 설정 JSON으로 보관하세요.' };
  }
}

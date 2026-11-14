import type { SelectionConfig, SelectionDependencies, SelectionPatch, SelectionSnapshot, SetId } from './types';

export function normalizeSelection(dependencies: SelectionDependencies, input: unknown): SelectionConfig {
  const { core, designs, palettes, fonts, icons } = dependencies;
  const normalized = core.normalize(input, palettes, fonts, icons);
  return { ...normalized, designSelection: designs.normalize(normalized.designSelection ?? designs.selection('studio')) };
}

// Canonical normalization retains extra JSON font properties. Own the entire
// retained value, including fields outside the finite editor contract.
function copyValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(copyValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyValue(item)]));
  }
  return value;
}
function freezeValue(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) freezeValue(item);
    Object.freeze(value);
  }
}
function copy(config: SelectionSnapshot): SelectionConfig {
  return copyValue(config) as SelectionConfig;
}
function immutable(config: SelectionConfig): SelectionSnapshot {
  const owned = copy(config);
  freezeValue(owned);
  return owned;
}

export function createSelectionStore(dependencies: SelectionDependencies, initialConfig: unknown) {
  let snapshot = immutable(normalizeSelection(dependencies, initialConfig));
  const listeners = new Set<() => void>();
  function commit(input: unknown): void {
    const next = immutable(normalizeSelection(dependencies, input));
    snapshot = next;
    for (const listener of [...listeners]) listener();
  }
  return {
    getSnapshot: (): SelectionSnapshot => snapshot,
    getConfig: (): SelectionConfig => copy(snapshot),
    update(patch: SelectionPatch): void {
      commit({
        ...snapshot,
        ...patch,
        fonts: { ...snapshot.fonts, ...patch.fonts },
        designSelection: {
          ...snapshot.designSelection,
          ...patch.designSelection,
          components: { ...snapshot.designSelection.components, ...patch.designSelection?.components },
        },
      });
    },
    selectSet(id: SetId): void {
      const preset = dependencies.designs.sets.find(set => set.id === id);
      if (!preset) throw Error('Invalid design selection set: ' + id);
      commit({
        ...snapshot,
        ...preset.config,
        project: snapshot.project,
        target: snapshot.target,
        scope: snapshot.scope,
        framework: snapshot.framework,
        layout: snapshot.layout,
        fonts: { ...preset.config.fonts, source: snapshot.fonts.source },
        designSelection: dependencies.designs.selection(id),
      });
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

import type { ComponentType } from "react";
import type { UILibraryId } from "../core/types";
const ids = new Set<UILibraryId>(["base-ui", "radix", "react-aria", "mui", "mantine"]);
const pending = new Map<UILibraryId, Promise<ComponentType>>();
const attempts = new Map<UILibraryId, number>();
/** Each adapter is self-contained except for the shell's already-loaded runtime.
 * A fresh URL retries browser module-map failures without duplicating React. */
export function loadLibrary(id: UILibraryId): Promise<ComponentType> {
  if (!ids.has(id)) return Promise.reject(new Error("Unknown preview library " + id));
  const cached = pending.get(id);
  if (cached) return cached;
  const attempt = attempts.get(id) || 0;
  attempts.set(id, attempt + 1);
  const url = new URL("./library-" + id + ".js", import.meta.url);
  if (attempt) url.searchParams.set("retry", String(attempt));
  const promise = import(url.href).then(module => module.Adapter as ComponentType).catch((error: unknown) => {
    pending.delete(id);
    throw error;
  });
  pending.set(id, promise);
  return promise;
}

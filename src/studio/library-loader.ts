import type { ComponentType } from "react";
import { Adapter as Base } from "../../examples/library-preview/src/base-ui";
import { Adapter as Radix } from "../../examples/library-preview/src/radix";
import { Adapter as Aria } from "../../examples/library-preview/src/react-aria";
import { Adapter as Mui } from "../../examples/library-preview/src/mui";
import { Adapter as Mantine } from "../../examples/library-preview/src/mantine";
import type { UILibraryId } from "../core/types";
const adapters: Partial<Record<UILibraryId, ComponentType>> = {
  "base-ui": Base,
  radix: Radix,
  "react-aria": Aria,
  mui: Mui,
  mantine: Mantine,
};
/** Stable async boundary shared by classic/offline and the upcoming split web build. */
export function loadLibrary(id: UILibraryId): Promise<ComponentType> {
  const adapter = adapters[id];
  return adapter
    ? Promise.resolve(adapter)
    : Promise.reject(new Error("Unknown preview library " + id));
}

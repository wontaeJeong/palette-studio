import { createElement, forwardRef } from "react";
import type { CSSProperties } from "react";
import type { IconComponent, IconProps } from "./createIcon.js";

/** Pass a statically imported icon to retain bundler tree-shaking. */
export type IconSlotProps = IconProps & { icon: IconComponent };
export const Icon = forwardRef<SVGSVGElement, IconSlotProps>(function Icon(
  { icon: Glyph, ...props }, ref
) {
  return createElement(Glyph, { ...props, ref });
});
Icon.displayName = "Icon";

/** Filled tile behind the original outline icon, not a solid glyph variant. */
export type IconTileProps = IconSlotProps & {
  padding?: number;
  tileStyle?: CSSProperties;
  tileClassName?: string;
};
export const IconTile = forwardRef<SVGSVGElement, IconTileProps>(function IconTile(
  { icon: Glyph, padding = 8, tileStyle, tileClassName, ...props }, ref
) {
  return createElement("span", {
    className: tileClassName,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding,
      borderRadius: 8,
      background: "var(--color-accent, currentColor)",
      color: "var(--color-on-accent, #fff)",
      ...tileStyle,
    },
  }, createElement(Glyph, {
    ...props,
    ref,
    color: "var(--color-on-accent, #fff)",
  }));
});
IconTile.displayName = "IconTile";

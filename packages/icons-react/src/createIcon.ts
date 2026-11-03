import { createElement, forwardRef } from "react";
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

export type IconVariant = "default" | "muted" | "accent" | "success" | "warning" | "danger" | "info";
export type IconTone = "single" | "duotone";
export type IconNode = readonly [tag: string, props: Readonly<Record<string, string>>];
export type IconProps = Omit<SVGProps<SVGSVGElement>, "color" | "size" | "strokeWidth"> & {
  size?: number | string;
  strokeWidth?: number;
  variant?: IconVariant;
  tone?: IconTone;
  color?: string;
  title?: string;
};
export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
const colorTokens: Record<IconVariant, string> = {
  default: "--color-ink",
  muted: "--color-ink-muted",
  accent: "--color-accent",
  success: "--color-success",
  warning: "--color-warning",
  danger: "--color-danger",
  info: "--color-info",
};

export function createIcon(displayName: string, nodes: readonly IconNode[]): IconComponent {
  const Component = forwardRef<SVGSVGElement, IconProps>(function PaletteIcon(
    { size = 24, strokeWidth = 2, variant = "default", tone = "single", color, title, style, children, ...rest },
    ref
  ) {
    const accessibleName = Boolean(title || rest["aria-label"] || rest["aria-labelledby"]);
    const shapes = nodes.map(([element, props], index) =>
      createElement(element, {
        ...props,
        key: index,
        ...(tone === "duotone" && index % 2 === 1
          ? { stroke: "var(--color-accent, currentColor)" }
          : {}),
      })
    );
    return createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...rest,
      ref,
      role: rest.role ?? (accessibleName ? "img" : undefined),
      "aria-hidden": rest["aria-hidden"] ?? (accessibleName ? undefined : true),
      focusable: rest.focusable ?? false,
      style: {
        color: color ?? "var(" + colorTokens[variant] + ", currentColor)",
        ...style,
      },
    },
      ...(title ? [createElement("title", { key: "title" }, title)] : []),
      ...shapes,
      children
    );
  });
  Component.displayName = displayName;
  return Component;
}

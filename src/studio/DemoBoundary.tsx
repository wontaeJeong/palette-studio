import React, { useLayoutEffect, useRef } from "react";
/** Only framework-neutral sample bodies own imperative DOM; editor nodes are JSX. */
export function DemoBoundary({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    el.innerHTML = html;
    return () => {
      window.PaletteComponentDemos.cleanup();
      el.replaceChildren();
    };
  }, [html]);
  return <div className={className} ref={ref} data-demo-boundary />;
}
export function Svg({ name, size = 20 }: { name: string; size?: number }) {
  const body =
    window.PALETTE_ICON_PARTS.flat().find((i) => i.name === name)?.body || "";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

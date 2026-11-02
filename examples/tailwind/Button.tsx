export function Button() {
  return (
    <button className="rounded-lg border px-4 py-2 font-semibold cp-bg-accent cp-text-on-accent cp-border-accent hover:cp-bg-accent-hover hover:cp-border-accent-hover active:cp-bg-accent-active active:cp-border-accent-active focus-visible:outline-3 focus-visible:outline-offset-3 [outline-color:var(--color-focus)] disabled:cp-bg-disabled-bg disabled:cp-text-disabled-fg disabled:cp-border-disabled-border">
      검사 실행
    </button>
  );
}

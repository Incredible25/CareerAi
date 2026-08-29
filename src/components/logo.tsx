import Link from "next/link";

/**
 * The "three doors" mark: three bars in the brand triad (green / navy /
 * orange), each standing for Access, Excellence, Opportunity
 * (docs/PRODUCT_STRATEGY.md §1). Kept as plain CSS, not an icon font or
 * imported SVG library, so it never depends on an external asset load.
 */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        <span className="h-4 w-[7px] rounded-t-[3px] rounded-b-[1px] bg-green-500" />
        <span className="h-4 w-[7px] rounded-t-[3px] rounded-b-[1px] bg-navy-500" />
        <span className="h-4 w-[7px] rounded-t-[3px] rounded-b-[1px] bg-orange-500" />
      </span>
      {withWordmark && (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">
          3Doors
        </span>
      )}
    </Link>
  );
}

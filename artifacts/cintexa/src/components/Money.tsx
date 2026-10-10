import { useMoney } from "@/lib/currency/useMoney";

/**
 * An amount shown in the visitor's own currency (see lib/currency). Hover/long-press reveals the
 * original recorded amount whenever it was converted.
 */
export function Money({
  amount,
  currency = "GHS",
  approx = true,
  className,
}: {
  amount: number | string | null | undefined;
  currency?: string;
  approx?: boolean;
  className?: string;
}) {
  const { format } = useMoney([currency]);
  const m = format(amount, currency, { approx });
  return (
    <span className={className} title={m.converted ? `Recorded as ${m.original}` : undefined}>
      {m.text}
    </span>
  );
}

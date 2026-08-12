import { fmtAmt, fmtUSD, type Asset } from "@/lib/nova"

export function AssetsTab({ assets }: { assets: Asset[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {assets.map((a) => {
        const value = a.balance * a.price
        const up = a.change >= 0
        return (
          <li key={a.symbol} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                a.native ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {a.symbol.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                {a.name}
                {a.live && (
                  <span className="rounded bg-positive/15 px-1.5 py-0.5 text-[9px] font-semibold text-positive">
                    LIVE
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {fmtAmt(a.balance)} {a.symbol} · {fmtUSD(a.price)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-medium tabular-nums">{fmtUSD(value)}</p>
              <p className={`text-xs tabular-nums ${up ? "text-positive" : "text-negative"}`}>
                {up ? "+" : ""}
                {a.change.toFixed(1)}%
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

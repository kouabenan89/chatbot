import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react"
import { fmtAmt } from "@/lib/nova"

export function ActivityTab({ tx }: { tx: any[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {tx.map((t) => {
        const isSwap = t.dir === "swap"
        const isIn = t.dir === "in"
        const Icon = isSwap ? RefreshCw : isIn ? ArrowDownLeft : ArrowUpRight
        const tone = isSwap
          ? "text-primary bg-primary/15"
          : isIn
            ? "text-positive bg-positive/15"
            : "text-foreground bg-secondary"
        return (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{isSwap ? "Échange" : isIn ? "Reçu" : "Envoyé"}</p>
              <p className="truncate text-xs text-muted-foreground">{t.party}</p>
            </div>
            <div className="text-right">
              <p className={`font-mono text-sm tabular-nums ${isIn ? "text-positive" : ""}`}>
                {isSwap ? "" : isIn ? "+" : "−"}
                {fmtAmt(t.amount)} {t.asset}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.date}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

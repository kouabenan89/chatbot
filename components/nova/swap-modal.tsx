"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { fmtAmt, type Asset } from "@/lib/nova"
import { ModalShell } from "./modal-shell"

export function SwapModal({
  assets,
  onClose,
  onSwap,
}: {
  assets: Asset[]
  onClose: () => void
  onSwap: (f: string, t: string, a: number) => void
}) {
  const [fromSym, setFromSym] = useState(assets[0].symbol)
  const [toSym, setToSym] = useState(assets[1]?.symbol ?? assets[0].symbol)
  const [amount, setAmount] = useState("")
  const from = assets.find((a) => a.symbol === fromSym)!
  const to = assets.find((a) => a.symbol === toSym)!
  const num = Number.parseFloat(amount)
  const out = num > 0 ? (num * from.price) / to.price : 0
  const invalid = !(num > 0) || num > from.balance || fromSym === toSym

  const flip = () => {
    setFromSym(toSym)
    setToSym(fromSym)
    setAmount("")
  }

  return (
    <ModalShell title="Échanger" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {/* From */}
        <div className="rounded-2xl bg-secondary p-3">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>De</span>
            <button onClick={() => setAmount(String(from.balance))} className="text-primary">
              Solde: {fmtAmt(from.balance)}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="w-full bg-transparent font-mono text-2xl outline-none"
            />
            <select
              value={fromSym}
              onChange={(e) => setFromSym(e.target.value)}
              className="rounded-full bg-card px-3 py-1.5 text-sm font-medium outline-none"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center">
          <button
            onClick={flip}
            className="-my-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-card bg-secondary text-primary transition-colors hover:bg-accent"
            aria-label="Inverser"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* To */}
        <div className="rounded-2xl bg-secondary p-3">
          <span className="mb-2 block text-xs text-muted-foreground">Vers (estimé)</span>
          <div className="flex items-center gap-2">
            <span className="w-full font-mono text-2xl tabular-nums text-muted-foreground">{fmtAmt(out)}</span>
            <select
              value={toSym}
              onChange={(e) => setToSym(e.target.value)}
              className="rounded-full bg-card px-3 py-1.5 text-sm font-medium outline-none"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground">
          <span>Taux</span>
          <span className="font-mono">
            1 {fromSym} ≈ {fmtAmt(from.price / to.price)} {toSym}
          </span>
        </div>

        <button
          onClick={() => onSwap(fromSym, toSym, num)}
          disabled={invalid}
          className="rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {fromSym === toSym ? "Choisissez deux actifs" : "Échanger"}
        </button>
      </div>
    </ModalShell>
  )
}

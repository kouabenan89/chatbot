"use client"

import { useState } from "react"
import { Send as SendIcon } from "lucide-react"
import { fmtAmt, fmtUSD, type Asset } from "@/lib/nova"
import { ModalShell } from "./modal-shell"

export function SendModal({
  assets,
  onClose,
  onSend,
}: {
  assets: Asset[]
  onClose: () => void
  onSend: (s: string, a: number, to: string) => void
}) {
  const [symbol, setSymbol] = useState(assets[0].symbol)
  const [amount, setAmount] = useState("")
  const [to, setTo] = useState("")
  const asset = assets.find((a) => a.symbol === symbol)!
  const num = Number.parseFloat(amount)
  const invalid = !(num > 0) || num > asset.balance || !to.trim()

  return (
    <ModalShell title="Envoyer" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Actif</label>
          <div className="flex flex-wrap gap-1.5">
            {assets.map((a) => (
              <button
                key={a.symbol}
                onClick={() => setSymbol(a.symbol)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  symbol === a.symbol
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <label>Montant</label>
            <button onClick={() => setAmount(String(asset.balance))} className="text-primary">
              Max: {fmtAmt(asset.balance)}
            </button>
          </div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-full rounded-xl border border-input bg-background px-3 py-3 font-mono text-lg outline-none focus:border-primary"
          />
          {num > 0 && <p className="mt-1 text-xs text-muted-foreground">≈ {fmtUSD(num * asset.price)}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Destinataire</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x… ou nom.eth"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={() => onSend(symbol, num, to)}
          disabled={invalid}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <SendIcon className="h-4 w-4" />
          Envoyer {symbol}
        </button>
      </div>
    </ModalShell>
  )
}

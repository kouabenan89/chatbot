"use client"

import { useState } from "react"
import { Check, Copy, QrCode } from "lucide-react"
import { seal } from "@/lib/nova"
import { ModalShell } from "./modal-shell"

export function ReceiveModal({
  account,
  network,
  onClose,
}: {
  account: any
  network: any
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const cells = seal(account.address, 11)
  const copy = () => {
    navigator.clipboard?.writeText(account.address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <ModalShell title="Recevoir" onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-xs text-muted-foreground">
          Recevez des actifs sur <span className="font-medium text-foreground">{network.name}</span>
        </p>
        <div className="rounded-2xl bg-white p-4">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(11, minmax(0, 1fr))` }} aria-hidden>
            {cells.map((on, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-[2px] ${on ? "bg-black" : "bg-transparent"}`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" />
          Code visuel — non scannable en démo
        </div>
        <button
          onClick={copy}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-3"
        >
          <span className="truncate font-mono text-xs">{account.address}</span>
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-positive" />
          ) : (
            <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </div>
    </ModalShell>
  )
}

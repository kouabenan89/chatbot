"use client"

import { useState } from "react"
import { Plus, Search, ShieldCheck } from "lucide-react"
import { fmtAmt, shorten } from "@/lib/nova"

export function LaunchTab({
  launches,
  buyLaunch,
  createLaunch,
  novaBalance,
  buyCost,
  discoverQuery,
  setDiscoverQuery,
  discoverEns,
}: any) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", symbol: "", emoji: "" })

  const filtered = launches.filter((l: any) => {
    const q = discoverQuery.trim().toLowerCase()
    if (!q || /^[a-z0-9-]+\.eth$/i.test(q)) return true
    return l.name.toLowerCase().includes(q) || l.symbol.toLowerCase().includes(q)
  })

  const submit = () => {
    if (!form.name.trim() || !form.symbol.trim()) return
    createLaunch(form)
    setForm({ name: "", symbol: "", emoji: "" })
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + create */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={discoverQuery}
            onChange={(e) => setDiscoverQuery(e.target.value)}
            placeholder="Rechercher un token ou un nom .eth"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setCreating((c) => !c)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="Créer un token"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* ENS resolution result */}
      {discoverEns.status !== "idle" && (
        <div className="rounded-2xl border border-border bg-card p-3 text-xs">
          {discoverEns.status === "loading" && <span className="text-muted-foreground">Résolution ENS…</span>}
          {discoverEns.status === "resolved" && (
            <div className="flex items-center gap-2">
              {discoverEns.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={discoverEns.avatar || "/placeholder.svg"} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <span className="font-medium">{discoverQuery}</span>
              <span className="font-mono text-muted-foreground">{shorten(discoverEns.address)}</span>
              <ShieldCheck className="ml-auto h-4 w-4 text-positive" />
            </div>
          )}
          {discoverEns.status === "error" && <span className="text-negative">Nom ENS introuvable.</span>}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="rounded-3xl border border-primary/30 bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Lancer un nouveau token</p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value.slice(0, 2) }))}
                placeholder="🚀"
                className="w-14 rounded-xl border border-input bg-background px-3 py-2 text-center text-lg outline-none focus:border-primary"
              />
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du token"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase().slice(0, 6) }))}
              placeholder="TICKER"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary"
            />
            <button
              onClick={submit}
              className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Déployer sur NovaPump
            </button>
          </div>
        </div>
      )}

      {/* Launches list */}
      <ul className="flex flex-col gap-2">
        {filtered.map((l: any) => {
          const done = l.progress >= 100
          const affordable = novaBalance >= buyCost
          return (
            <li key={l.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-xl">
                  {l.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {l.name}
                    <span className="font-mono text-[11px] text-muted-foreground">${l.symbol}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtAmt(l.priceNova)} NOVA · MC {fmtAmt(l.marketCapNova)} · {l.holders} holders
                  </p>
                </div>
                <button
                  onClick={() => buyLaunch(l.id)}
                  disabled={done || !affordable}
                  className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {done ? "Listé" : `Acheter ${buyCost}`}
                </button>
              </div>

              {/* Bonding curve progress */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Bonding curve</span>
                  <span className="tabular-nums">{l.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${l.progress}%` }} />
                </div>
              </div>

              {l.yourHoldings > 0 && (
                <p className="mt-2 text-[11px] text-primary">
                  Vous détenez {fmtAmt(l.yourHoldings)} ${l.symbol}
                </p>
              )}
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Aucun token ne correspond.
          </li>
        )}
      </ul>
    </div>
  )
}

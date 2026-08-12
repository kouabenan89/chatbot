import { Cpu, Flame, ShieldCheck } from "lucide-react"
import { fmtAmt, fmtUSD, MINER_TIERS } from "@/lib/nova"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2.5">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="truncate font-mono text-sm font-medium">{value}</dd>
    </div>
  )
}

export function MiningTab({
  mining,
  setMining,
  hashrate,
  minedPending,
  claimMined,
  buyMiner,
  novaContract,
  setNovaContract,
  verifyNovaContract,
}: any) {
  return (
    <div className="flex flex-col gap-3">
      {/* Rig */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className={`h-5 w-5 ${mining ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-semibold">Rig de minage NOVA</span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              mining ? "bg-positive/15 text-positive" : "bg-secondary text-muted-foreground"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${mining ? "animate-pulse bg-positive" : "bg-muted-foreground"}`} />
            {mining ? "Actif" : "En pause"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary p-3">
            <p className="text-[11px] text-muted-foreground">Hashrate</p>
            <p className="font-mono text-lg font-semibold tabular-nums">{hashrate.toFixed(1)} MH/s</p>
          </div>
          <div className="rounded-2xl bg-secondary p-3">
            <p className="text-[11px] text-muted-foreground">Non réclamé</p>
            <p className="font-mono text-lg font-semibold tabular-nums text-primary">{minedPending.toFixed(5)} NOVA</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setMining((m: boolean) => !m)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mining
                ? "bg-secondary text-foreground hover:bg-accent"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {mining ? "Arrêter" : "Démarrer le minage"}
          </button>
          <button
            onClick={claimMined}
            disabled={minedPending <= 0}
            className="flex-1 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
          >
            Réclamer
          </button>
        </div>
      </div>

      {/* Miner tiers */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-sm font-semibold">Améliorer le hashrate</p>
        <p className="text-[11px] text-muted-foreground">Achetez un mineur pour booster votre rendement.</p>
        <div className="mt-3 flex flex-col gap-2">
          {MINER_TIERS.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Flame className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">+{t.hashBoost} MH/s</p>
              </div>
              <button
                onClick={() => buyMiner(t.id)}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {fmtUSD(t.usd)}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contract verification */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Contrat NOVA</p>
          {novaContract.status === "verified" && (
            <span className="ml-auto rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-medium text-positive">
              Vérifié
            </span>
          )}
        </div>
        <input
          value={novaContract.address}
          onChange={(e) => setNovaContract((p: any) => ({ ...p, address: e.target.value }))}
          className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          placeholder="0x…"
        />
        <button
          onClick={verifyNovaContract}
          disabled={novaContract.status === "loading"}
          className="mt-2 w-full rounded-xl bg-secondary py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {novaContract.status === "loading" ? "Lecture on-chain…" : "Vérifier le contrat"}
        </button>
        {novaContract.status === "verified" && (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Nom" value={novaContract.name} />
            <Stat label="Symbole" value={novaContract.symbol} />
            <Stat label="Décimales" value={String(novaContract.decimals)} />
            <Stat label="Supply" value={fmtAmt(novaContract.totalSupply)} />
          </dl>
        )}
        {novaContract.status === "error" && <p className="mt-2 text-[11px] text-negative">{novaContract.error}</p>}
      </div>
    </div>
  )
}

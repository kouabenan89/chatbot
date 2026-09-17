"use client"

import { useState, useEffect } from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Cpu,
  Smartphone,
  Rocket,
  Wallet as WalletIcon,
  Activity as ActivityIcon,
  Gift,
} from "lucide-react"
import {
  ACCOUNTS,
  CHAIN_NAMES,
  COINGECKO_IDS,
  INITIAL_ASSETS,
  INITIAL_LAUNCHES,
  MINER_TIERS,
  NETWORKS,
  NOVA_CONTRACT_ADDRESS,
  SELECTORS,
  TX,
  WALLETCONNECT_PROJECT_ID,
  type Asset,
  fmtAmt,
  fmtUSD,
  shorten,
} from "@/lib/nova"
import { AssetsTab } from "@/components/nova/assets-tab"
import { ActivityTab } from "@/components/nova/activity-tab"
import { MiningTab } from "@/components/nova/mining-tab"
import { LaunchTab } from "@/components/nova/launch-tab"
import { SendModal } from "@/components/nova/send-modal"
import { ReceiveModal } from "@/components/nova/receive-modal"
import { SwapModal } from "@/components/nova/swap-modal"

export default function NovaWallet() {
  const [accountId, setAccountId] = useState(ACCOUNTS[0].id)
  const [networkId, setNetworkId] = useState(NETWORKS[0].id)
  const [live, setLive] = useState<any>(null) // { address, balanceEth, chainName, ethPrice } | null
  const [connecting, setConnecting] = useState(false)
  const [wcConnecting, setWcConnecting] = useState(false)
  const [connectMenuOpen, setConnectMenuOpen] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [ens, setEns] = useState<any>({ name: "Kouabenan.eth", address: null, avatar: null, status: "idle" }) // idle | loading | synced | error
  const [accountOpen, setAccountOpen] = useState(false)
  const [networkOpen, setNetworkOpen] = useState(false)
  const [tab, setTab] = useState("assets")
  const [modal, setModal] = useState<string | null>(null) // 'send' | 'receive' | 'swap' | null
  const [copied, setCopied] = useState(false)
  const [displayTotal, setDisplayTotal] = useState(0)
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS)
  const [tx, setTx] = useState<any[]>(TX)
  const [mining, setMining] = useState(false)
  const [hashrate, setHashrate] = useState(142.6)
  const [minedPending, setMinedPending] = useState(0)
  const [airdropClaimed, setAirdropClaimed] = useState(false)
  const [novaContract, setNovaContract] = useState<any>({
    address: NOVA_CONTRACT_ADDRESS,
    status: "idle", // idle | loading | verified | error
    name: null,
    symbol: null,
    decimals: null,
    totalSupply: null,
    error: null,
  })
  const [launches, setLaunches] = useState(INITIAL_LAUNCHES)
  const [discoverQuery, setDiscoverQuery] = useState("")
  const [discoverEns, setDiscoverEns] = useState<any>({ status: "idle", address: null, avatar: null })
  const [marketStatus, setMarketStatus] = useState<"idle" | "loading" | "live" | "error">("idle")
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<Date | null>(null)

  // Simulated proof-of-work accrual — runs in the background even if the
  // mining panel is closed, like a real miner would keep running.
  useEffect(() => {
    if (!mining) return
    const tick = setInterval(() => {
      setHashrate((h) => +(h + (Math.random() - 0.5) * 6).toFixed(1))
      setMinedPending((m) => +(m + (hashrate / 1000) * (0.8 + Math.random() * 0.4)).toFixed(5))
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mining])

  const account = ACCOUNTS.find((a) => a.id === accountId)!
  const network = NETWORKS.find((n) => n.id === networkId)!

  useEffect(() => {
    let cancelled = false
    const refreshMarket = async () => {
      setMarketStatus("loading")
      try {
        const ids = Object.values(COINGECKO_IDS).join(",")
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { cache: "no-store" },
        )
        if (!response.ok) throw new Error("market request failed")
        const quotes = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>
        if (cancelled) return
        setAssets((previous) =>
          previous.map((asset) => {
            const quote = quotes[COINGECKO_IDS[asset.symbol]]
            if (!quote?.usd) return asset
            return {
              ...asset,
              price: quote.usd,
              change: quote.usd_24h_change ?? asset.change,
              live: true,
            }
          }),
        )
        setMarketUpdatedAt(new Date())
        setMarketStatus("live")
      } catch {
        if (!cancelled) setMarketStatus("error")
      }
    }
    refreshMarket()
    const interval = window.setInterval(refreshMarket, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  const fetchEthPriceUsd = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
      const data = await res.json()
      return data?.ethereum?.usd ?? null
    } catch (_) {
      return null
    }
  }

  const getMetaMaskProvider = () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return null
    const eth = (window as any).ethereum
    if (eth.providers?.length) {
      return eth.providers.find((p: any) => p.isMetaMask) || null
    }
    return eth.isMetaMask ? eth : null
  }

  const connectWallet = async () => {
    setConnectError(null)
    const provider = getMetaMaskProvider() || (typeof window !== "undefined" ? (window as any).ethereum : null)
    if (!provider) {
      setConnectError("MetaMask non détecté. Installez l'extension sur metamask.io, ou ouvrez cette page dans un navigateur où elle est active.")
      return
    }
    setConnecting(true)
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" })
      const address = accounts[0]
      const balHex = await provider.request({ method: "eth_getBalance", params: [address, "latest"] })
      const balanceEth = Number.parseInt(balHex, 16) / 1e18
      const chainIdHex = await provider.request({ method: "eth_chainId" })
      const chainName = CHAIN_NAMES[chainIdHex] || `Chaîne ${chainIdHex}`
      const ethPrice = await fetchEthPriceUsd()
      const via = provider.isMetaMask ? "MetaMask" : "Extension navigateur"
      setLive({ address, balanceEth, chainName, ethPrice, via })
      setConnectMenuOpen(false)
    } catch (err: any) {
      setConnectError(err?.code === 4001 ? "Connexion refusée." : "Échec de la connexion au portefeuille.")
    } finally {
      setConnecting(false)
    }
  }

  // WalletConnect — loads the official EthereumProvider at runtime (not bundled
  // by default here) and opens its QR modal, using the Nova Wallet project ID.
  const connectWalletConnect = async () => {
    setConnectError(null)
    setWcConnecting(true)
    try {
      const mod: any = await import(/* webpackIgnore: true */ "https://esm.sh/@walletconnect/ethereum-provider@2?bundle")
      const EthereumProvider = mod.EthereumProvider || mod.default
      const provider = await EthereumProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        chains: [1],
        showQrModal: true,
        metadata: {
          name: "Nova Wallet",
          description: "Nova Wallet — portefeuille web3",
          url: typeof window !== "undefined" ? window.location.origin : "https://nova.wallet",
          icons: [],
        },
      })
      await provider.connect()
      const address = provider.accounts?.[0]
      if (!address) throw new Error("no account")
      const balHex = await provider.request({ method: "eth_getBalance", params: [address, "latest"] })
      const balanceEth = Number.parseInt(balHex, 16) / 1e18
      const ethPrice = await fetchEthPriceUsd()
      setLive({ address, balanceEth, chainName: "Ethereum (WalletConnect)", ethPrice, via: "WalletConnect" })
      setConnectMenuOpen(false)
    } catch (err) {
      setConnectError("WalletConnect n'a pas pu s'initialiser dans cet aperçu (le SDK n'est pas chargé). L'ID de projet est configuré et prêt pour un vrai build.")
    } finally {
      setWcConnecting(false)
    }
  }

  const disconnectWallet = () => setLive(null)

  // Minimal ABI decoding for a dynamic `string` return value — no ethers/viem
  // needed, just the raw eth_call response.
  const decodeAbiString = (hex: string) => {
    const clean = hex.replace(/^0x/, "")
    const len = Number.parseInt(clean.slice(64, 128), 16)
    const strHex = clean.slice(128, 128 + len * 2)
    let out = ""
    for (let i = 0; i < strHex.length; i += 2) out += String.fromCharCode(Number.parseInt(strHex.substr(i, 2), 16))
    return out
  }

  const verifyNovaContract = async () => {
    const addr = novaContract.address.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setNovaContract((p: any) => ({ ...p, status: "error", error: "Adresse de contrat invalide." }))
      return
    }
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setNovaContract((p: any) => ({ ...p, status: "error", error: "Connectez d'abord un portefeuille pour disposer d'un accès RPC." }))
      return
    }
    setNovaContract((p: any) => ({ ...p, status: "loading", error: null }))
    try {
      const call = (data: string) => (window as any).ethereum.request({ method: "eth_call", params: [{ to: addr, data }, "latest"] })
      const [nameHex, symHex, decHex, supplyHex] = await Promise.all([
        call(SELECTORS.name),
        call(SELECTORS.symbol),
        call(SELECTORS.decimals),
        call(SELECTORS.totalSupply),
      ])
      const decimals = Number.parseInt(decHex, 16)
      const name = decodeAbiString(nameHex)
      const symbol = decodeAbiString(symHex)
      const totalSupply = Number(BigInt(supplyHex)) / 10 ** decimals
      setNovaContract({ address: addr, status: "verified", name, symbol, decimals, totalSupply, error: null })
    } catch (_) {
      setNovaContract((p: any) => ({ ...p, status: "error", error: "Lecture impossible — adresse incorrecte ou mauvais réseau." }))
    }
  }

  // Branche NOVA sur le contrat déployé dès qu'une adresse réelle est connue —
  // lit le vrai solde (balanceOf) plus name/symbol/decimals/totalSupply.
  useEffect(() => {
    const addr = live?.address
    if (!addr || typeof window === "undefined" || !(window as any).ethereum) return
    let cancelled = false
    ;(async () => {
      try {
        const call = (data: string) => (window as any).ethereum.request({ method: "eth_call", params: [{ to: NOVA_CONTRACT_ADDRESS, data }, "latest"] })
        const balData = SELECTORS.balanceOf + addr.replace(/^0x/, "").toLowerCase().padStart(64, "0")
        const [balHex, decHex, nameHex, symHex, supplyHex] = await Promise.all([
          call(balData),
          call(SELECTORS.decimals),
          call(SELECTORS.name),
          call(SELECTORS.symbol),
          call(SELECTORS.totalSupply),
        ])
        if (cancelled) return
        const decimals = Number.parseInt(decHex, 16)
        const balance = Number(BigInt(balHex)) / 10 ** decimals
        const name = decodeAbiString(nameHex)
        const symbol = decodeAbiString(symHex)
        const totalSupply = Number(BigInt(supplyHex)) / 10 ** decimals
        setAssets((prev) => prev.map((a) => (a.symbol === "NOVA" ? { ...a, balance, live: true } : a)))
        setNovaContract({ address: NOVA_CONTRACT_ADDRESS, status: "verified", name, symbol, decimals, totalSupply, error: null })
      } catch (_) {
        // Contrat absent sur ce réseau, ou RPC indisponible — NOVA reste en mode démo.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [live?.address])

  useEffect(() => {
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null
    if (!eth?.on) return
    const onAccountsChanged = (accs: string[]) => {
      if (!accs.length) setLive(null)
      else setLive((prev: any) => (prev ? { ...prev, address: accs[0] } : prev))
    }
    eth.on("accountsChanged", onAccountsChanged)
    return () => eth.removeListener?.("accountsChanged", onAccountsChanged)
  }, [])

  const displayAssets: Asset[] = live
    ? assets.map((a) =>
        a.symbol === "ETH"
          ? { ...a, balance: live.balanceEth, price: live.ethPrice ?? a.price, live: true }
          : a,
      )
    : assets
  const total = displayAssets.reduce((sum, a) => sum + a.balance * a.price, 0)

  useEffect(() => {
    let raf: number
    const start = performance.now()
    const from = displayTotal
    const dur = 900
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayTotal(from + (total - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, total])

  const syncEns = async (name: string) => {
    setEns((prev: any) => ({ ...prev, name, status: "loading" }))
    try {
      const res = await fetch(`https://api.ensideas.com/ens/resolve/${name.toLowerCase()}`)
      if (!res.ok) throw new Error("lookup failed")
      const data = await res.json()
      if (!data.address) throw new Error("no address")
      setEns({ name, address: data.address, avatar: data.avatar || null, status: "synced" })
    } catch (_) {
      setEns({ name, address: null, avatar: null, status: "error" })
    }
  }

  const looksLikeEnsQuery = /^[a-z0-9-]+\.eth$/i.test(discoverQuery.trim())

  useEffect(() => {
    if (!looksLikeEnsQuery) {
      setDiscoverEns({ status: "idle", address: null, avatar: null })
      return
    }
    setDiscoverEns({ status: "loading", address: null, avatar: null })
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.ensideas.com/ens/resolve/${discoverQuery.trim().toLowerCase()}`)
        const data = await res.json()
        if (data?.address) setDiscoverEns({ status: "resolved", address: data.address, avatar: data.avatar || null })
        else setDiscoverEns({ status: "error", address: null, avatar: null })
      } catch (_) {
        setDiscoverEns({ status: "error", address: null, avatar: null })
      }
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverQuery])

  useEffect(() => {
    syncEns("Kouabenan.eth")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayAccount = live
    ? { name: "Portefeuille connecté", address: live.address, avatar: null }
    : ens.status === "synced"
      ? { name: ens.name, address: ens.address, avatar: ens.avatar }
      : { ...account, avatar: null }

  const copyAddress = () => {
    navigator.clipboard?.writeText(displayAccount.address).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const recordSwap = (fromSym: string, toSym: string, fromAmt: number, toAmt: number) => {
    setTx((prev) => [
      {
        id: "s" + Date.now(),
        dir: "swap",
        asset: toSym,
        assetOut: fromSym,
        amount: toAmt,
        amountOut: fromAmt,
        party: "Nova Exchange",
        date: "09 août",
        status: "confirmé",
        hash: "0x" + Math.random().toString(16).slice(2, 10) + "...swap",
      },
      ...prev,
    ])
  }

  const claimMined = () => {
    if (minedPending <= 0) return
    const claimed = minedPending
    setAssets((prev) =>
      prev.map((a) => (a.symbol === "NOVA" ? { ...a, balance: +(a.balance + claimed).toFixed(6) } : a)),
    )
    setTx((prev) => [
      {
        id: "m" + Date.now(),
        dir: "in",
        asset: "NOVA",
        party: "Récompense de minage",
        amount: claimed,
        date: "09 août",
        status: "confirmé",
        hash: "0x" + Math.random().toString(16).slice(2, 10) + "...mine",
      },
      ...prev,
    ])
    setMinedPending(0)
  }

  const AIRDROP_AMOUNT = 3000
  const claimAirdrop = () => {
    if (airdropClaimed) return
    setAssets((prev) =>
      prev.map((a) => (a.symbol === "NOVA" ? { ...a, balance: +(a.balance + AIRDROP_AMOUNT).toFixed(6) } : a)),
    )
    setTx((prev) => [
      {
        id: "airdrop" + Date.now(),
        dir: "in",
        asset: "NOVA",
        party: "Airdrop abonné · réserve staking",
        amount: AIRDROP_AMOUNT,
        date: "09 août",
        status: "confirmé",
        hash: "0x" + Math.random().toString(16).slice(2, 10) + "...drop",
      },
      ...prev,
    ])
    setAirdropClaimed(true)
  }

  const LAUNCH_BUY_COST = 25 // NOVA per quick-buy
  const buyLaunch = (id: string) => {
    const novaAsset = assets.find((a) => a.symbol === "NOVA")
    if (!novaAsset || novaAsset.balance < LAUNCH_BUY_COST) return
    const target = launches.find((l) => l.id === id)
    if (!target || target.progress >= 100) return

    setAssets((prev) =>
      prev.map((a) => (a.symbol === "NOVA" ? { ...a, balance: +(a.balance - LAUNCH_BUY_COST).toFixed(4) } : a)),
    )
    setLaunches((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const tokensBought = LAUNCH_BUY_COST / l.priceNova
        const isFirstBuy = l.yourHoldings === 0
        return {
          ...l,
          progress: Math.min(100, +(l.progress + LAUNCH_BUY_COST / 40).toFixed(1)),
          priceNova: +(l.priceNova * 1.06).toFixed(6),
          marketCapNova: Math.round(l.marketCapNova + LAUNCH_BUY_COST * 3),
          holders: l.holders + (isFirstBuy ? 1 : 0),
          yourHoldings: +(l.yourHoldings + tokensBought).toFixed(2),
        }
      }),
    )
    setTx((prev) => [
      {
        id: "pump" + Date.now(),
        dir: "out",
        asset: "NOVA",
        party: `NovaPump · achat ${target.symbol}`,
        amount: LAUNCH_BUY_COST,
        date: "09 août",
        status: "confirmé",
        hash: "0x" + Math.random().toString(16).slice(2, 10) + "...pump",
      },
      ...prev,
    ])
  }

  const createLaunch = ({ name, symbol, emoji }: { name: string; symbol: string; emoji: string }) => {
    setLaunches((prev) => [
      {
        id: "l" + Date.now(),
        name,
        symbol: symbol.toUpperCase(),
        emoji: emoji || "🚀",
        creator: shorten(displayAccount.address),
        progress: 0,
        priceNova: 0.001,
        marketCapNova: 1000,
        holders: 1,
        yourHoldings: 0,
      },
      ...prev,
    ])
  }

  // Sending — deducts the asset balance and records an outgoing tx.
  const sendAsset = (symbol: string, amount: number, to: string) => {
    if (!(amount > 0) || !symbol) return
    const asset = displayAssets.find((a) => a.symbol === symbol)
    if (!asset || amount > asset.balance) return
    setAssets((prev) =>
      prev.map((a) => (a.symbol === symbol ? { ...a, balance: +(a.balance - amount).toFixed(6) } : a)),
    )
    setTx((prev) => [
      {
        id: "send" + Date.now(),
        dir: "out",
        asset: symbol,
        amount,
        party: /^0x[a-fA-F0-9]{40}$/.test(to) ? shorten(to) : to || "Destinataire",
        date: "09 août",
        status: "confirmé",
        hash: "0x" + Math.random().toString(16).slice(2, 10) + "...send",
      },
      ...prev,
    ])
    setModal(null)
  }

  // Swapping — recompute both balances and log a swap tx.
  const doSwap = (fromSym: string, toSym: string, fromAmt: number) => {
    if (!(fromAmt > 0) || fromSym === toSym) return
    const from = displayAssets.find((a) => a.symbol === fromSym)
    const to = displayAssets.find((a) => a.symbol === toSym)
    if (!from || !to || fromAmt > from.balance) return
    const toAmt = +((fromAmt * from.price) / to.price).toFixed(6)
    setAssets((prev) =>
      prev.map((a) => {
        if (a.symbol === fromSym) return { ...a, balance: +(a.balance - fromAmt).toFixed(6) }
        if (a.symbol === toSym) return { ...a, balance: +(a.balance + toAmt).toFixed(6) }
        return a
      }),
    )
    recordSwap(fromSym, toSym, fromAmt, toAmt)
    setModal(null)
  }

  // Buying a miner tier boosts hashrate and starts mining.
  const buyMiner = (tierId: string) => {
    const tier = MINER_TIERS.find((t) => t.id === tierId)
    if (!tier) return
    setHashrate((h) => +(h + tier.hashBoost).toFixed(1))
    setMining(true)
  }

  const nova = displayAssets.find((a) => a.symbol === "NOVA")!

  const TABS = [
    { id: "assets", label: "Actifs", icon: WalletIcon },
    { id: "activity", label: "Activité", icon: ActivityIcon },
    { id: "mining", label: "Minage", icon: Cpu },
    { id: "launch", label: "NovaPump", icon: Rocket },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(201,164,92,0.18), transparent)" }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5 sm:max-w-lg">
        {/* Header */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Nova Wallet</p>
              <p className="text-[11px] text-muted-foreground">web3 · non-custodial</p>
            </div>
          </div>

          {/* Network selector */}
          <div className="relative">
            <button
              onClick={() => {
                setNetworkOpen((o) => !o)
                setAccountOpen(false)
                setConnectMenuOpen(false)
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: network.color }} />
              {network.name}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {networkOpen && (
              <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setNetworkId(n.id)
                      setNetworkOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-accent"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: n.color }} />
                    {n.name}
                    {n.id === networkId && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Account + connect row */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setAccountOpen((o) => !o)
                setNetworkOpen(false)
                setConnectMenuOpen(false)
              }}
              className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1.5 pr-3 text-xs transition-colors hover:bg-accent"
            >
              {displayAccount.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAccount.avatar || "/placeholder.svg"} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {displayAccount.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="max-w-[120px] truncate font-medium">{displayAccount.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {accountOpen && (
              <div className="absolute left-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                {ACCOUNTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAccountId(a.id)
                      setAccountOpen(false)
                    }}
                    className="flex w-full flex-col px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center text-xs font-medium">
                      {a.name}
                      {a.id === accountId && !live && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{shorten(a.address)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connect / connected */}
          {live ? (
            <button
              onClick={disconnectWallet}
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <span className="h-2 w-2 rounded-full bg-positive" />
              {live.via} · {shorten(live.address)}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  setConnectMenuOpen((o) => !o)
                  setAccountOpen(false)
                  setNetworkOpen(false)
                }}
                className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <WalletIcon className="h-4 w-4" />
                Connecter
              </button>
              {connectMenuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                  <button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f6851b]/20 text-[#f6851b]">
                      <WalletIcon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">MetaMask</span>
                      <span className="text-[11px] text-muted-foreground">{connecting ? "Connexion…" : "Extension navigateur"}</span>
                    </span>
                  </button>
                  <button
                    onClick={connectWalletConnect}
                    disabled={wcConnecting}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3b99fc]/20 text-[#3b99fc]">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">WalletConnect</span>
                      <span className="text-[11px] text-muted-foreground">{wcConnecting ? "Initialisation…" : "Scanner avec mobile"}</span>
                    </span>
                  </button>
                  {connectError && <p className="px-3 py-2 text-[11px] leading-snug text-negative">{connectError}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Balance card */}
        <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Solde total</span>
            <EnsBadge ens={ens} />
          </div>
          <p className="mt-1.5 font-mono text-4xl font-semibold tracking-tight tabular-nums">
            {fmtUSD(displayTotal)}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                marketStatus === "live" ? "bg-positive" : marketStatus === "error" ? "bg-negative" : "animate-pulse bg-primary"
              }`}
            />
            <span>
              {marketStatus === "live"
                ? `Marché mondial en direct${marketUpdatedAt ? ` · ${marketUpdatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
                : marketStatus === "error"
                  ? "Marché indisponible · derniers cours conservés"
                  : "Synchronisation des cours mondiaux…"}
            </span>
          </div>

          <button
            onClick={copyAddress}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {shorten(displayAccount.address)}
            {copied ? <Check className="h-3 w-3 text-positive" /> : <Copy className="h-3 w-3" />}
          </button>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <ActionButton icon={ArrowUpRight} label="Envoyer" onClick={() => setModal("send")} />
            <ActionButton icon={ArrowDownLeft} label="Recevoir" onClick={() => setModal("receive")} />
            <ActionButton icon={RefreshCw} label="Échanger" onClick={() => setModal("swap")} />
          </div>
        </section>

        {/* Airdrop banner */}
        {!airdropClaimed && (
          <button
            onClick={claimAirdrop}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-left transition-colors hover:bg-primary/15"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Gift className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Airdrop disponible</span>
              <span className="block text-[11px] text-muted-foreground">
                Réclamez {fmtAmt(AIRDROP_AMOUNT)} NOVA de la réserve staking
              </span>
            </span>
            <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Réclamer
            </span>
          </button>
        )}

        {/* Tabs */}
        <nav className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                {t.label}
              </button>
            )
          })}
        </nav>

        {/* Tab content */}
        <div className="mt-4 flex-1">
          {tab === "assets" && <AssetsTab assets={displayAssets} />}
          {tab === "activity" && <ActivityTab tx={tx} />}
          {tab === "mining" && (
            <MiningTab
              mining={mining}
              setMining={setMining}
              hashrate={hashrate}
              minedPending={minedPending}
              claimMined={claimMined}
              buyMiner={buyMiner}
              novaContract={novaContract}
              setNovaContract={setNovaContract}
              verifyNovaContract={verifyNovaContract}
            />
          )}
          {tab === "launch" && (
            <LaunchTab
              launches={launches}
              buyLaunch={buyLaunch}
              createLaunch={createLaunch}
              novaBalance={nova.balance}
              buyCost={LAUNCH_BUY_COST}
              discoverQuery={discoverQuery}
              setDiscoverQuery={setDiscoverQuery}
              discoverEns={discoverEns}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "send" && <SendModal assets={displayAssets} onClose={() => setModal(null)} onSend={sendAsset} />}
      {modal === "receive" && (
        <ReceiveModal account={displayAccount} network={network} onClose={() => setModal(null)} />
      )}
      {modal === "swap" && <SwapModal assets={displayAssets} onClose={() => setModal(null)} onSwap={doSwap} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small header-only presentational bits                               */
/* ------------------------------------------------------------------ */

function EnsBadge({ ens }: { ens: any }) {
  if (ens.status === "synced") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-medium text-positive">
        <ShieldCheck className="h-3 w-3" />
        {ens.name}
      </span>
    )
  }
  if (ens.status === "loading") {
    return <span className="text-[10px] text-muted-foreground">Résolution ENS…</span>
  }
  return null
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary py-3 text-xs font-medium transition-colors hover:bg-accent"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  )
}

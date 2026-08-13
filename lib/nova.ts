// ---------------------------------------------------------------------------
// Nova Wallet — shared data, types and helpers.
// Mock data stands in for chain state. Nothing here touches a real network.
// ---------------------------------------------------------------------------

// WalletConnect Cloud project — used to initialize the WalletConnect session.
export const WALLETCONNECT_PROJECT_ID = "9170b0dad70e3d3649ada3f26684d43e"

// Deployed Novacoin (Nova) ERC-20 contract.
export const NOVA_CONTRACT_ADDRESS = "0x4A0828b300c3a0c3bB209372fF6A24b539b7f369"

export const ACCOUNTS = [
  { id: "a1", name: "Coffre principal", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976" },
  { id: "a2", name: "Trading", address: "0x4B2A9e1c6F3d8a0B742C1e59D0F8a3C4e1B2D8c1" },
  { id: "a3", name: "Épargne", address: "0x9F1e4a7B3C2d5E8f0A6b1C4d7E9f2A5b8C1d4E7f" },
]

export const NETWORKS = [
  { id: "nova", name: "Nova Chain", color: "#C9A45C" },
  { id: "eth", name: "Ethereum", color: "#8FA6FF" },
  { id: "arb", name: "Arbitrum", color: "#5FBFD9" },
  { id: "pol", name: "Polygon", color: "#B79CFF" },
]

export const INITIAL_ASSETS = [
  { symbol: "NOVA", name: "Nova", balance: 5000, price: 1.85, change: 6.2, native: true },
  { symbol: "ETH", name: "Ethereum", balance: 2.145, price: 3180.12, change: 2.4 },
  { symbol: "USDC", name: "USD Coin", balance: 1200, price: 1.0, change: 0.0 },
  { symbol: "ARB", name: "Arbitrum", balance: 890, price: 0.74, change: -3.1 },
  { symbol: "wBTC", name: "Wrapped Bitcoin", balance: 0.042, price: 58230.5, change: 1.1 },
]

export const TX = [
  { id: "t00", dir: "in", asset: "NOVA", amount: 250, party: "0x5eA1...73Bc", date: "09 août", status: "confirmé", hash: "sha256:1fc85e650cc606861ab8a9a279a2543cbbbb9c78c390cd47ee6a06b334dac533" },
  { id: "t0", dir: "in", asset: "NOVA", amount: 500, party: "Récompense de bienvenue", date: "09 août", status: "confirmé", hash: "0x0a1b...f00d" },
  { id: "t1", dir: "in", asset: "ETH", amount: 0.5, party: "0x2Ad...9E1f", date: "08 août", status: "confirmé", hash: "0x8f3a...c21d" },
  { id: "t2", dir: "out", asset: "USDC", amount: 120, party: "0x71a...4b02", date: "06 août", status: "confirmé", hash: "0x1b9e...77aa" },
  { id: "t3", dir: "out", asset: "ARB", amount: 45, party: "0x9cd...11f3", date: "04 août", status: "confirmé", hash: "0xd42c...09e1" },
  { id: "t4", dir: "in", asset: "wBTC", amount: 0.01, party: "0x3fe...aa07", date: "01 août", status: "confirmé", hash: "0x66aa...b3c9" },
]

export const INITIAL_LAUNCHES = [
  { id: "l1", name: "MoonDoge", symbol: "MDOGE", emoji: "🐕", creator: "0x71a...4b02", progress: 62, priceNova: 0.0042, marketCapNova: 12400, holders: 184, yourHoldings: 0 },
  { id: "l2", name: "PixelCat", symbol: "PXCAT", emoji: "🐱", creator: "0x9cd...11f3", progress: 23, priceNova: 0.0011, marketCapNova: 3100, holders: 56, yourHoldings: 0 },
  { id: "l3", name: "SolarFrog", symbol: "SFROG", emoji: "🐸", creator: "0x2Ad...9E1f", progress: 91, priceNova: 0.0087, marketCapNova: 26800, holders: 412, yourHoldings: 0 },
]

export const MINER_TIERS = [
  { id: "bronze", name: "Mineur Bronze", hashBoost: 25, usd: 29 },
  { id: "argent", name: "Mineur Argent", hashBoost: 80, usd: 79 },
  { id: "or", name: "Mineur Or", hashBoost: 220, usd: 199 },
]

export const CHAIN_NAMES: Record<string, string> = {
  "0x1": "Ethereum Mainnet",
  "0x89": "Polygon",
  "0xa4b1": "Arbitrum One",
  "0x38": "BNB Chain",
  "0xaa36a7": "Sepolia (testnet)",
}

// ERC-20 function selectors used for raw eth_call reads.
export const SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231",
}

export type Asset = (typeof INITIAL_ASSETS)[number] & { live?: boolean }

export const fmtUSD = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 })

export const fmtAmt = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: n < 1 ? 4 : 2 })

export const shorten = (addr: string) => addr.slice(0, 6) + "…" + addr.slice(-4)

// Deterministic pseudo-QR pattern — visual only, not a real scannable code.
export function seal(seed: string, size = 9) {
  let s = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: size * size }, () => rand() > 0.56)
}

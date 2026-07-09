import { base, mainnet, optimism } from 'viem/chains'

// Full RPC URLs per chain, injected per deployment (e.g. the hotbox archive
// node's tokened endpoint for mainnet: https://<rpc-host>/hbx_rpc_...). Free
// public endpoints serve when a URL isn't set. Provider-specific ID plumbing
// (Alchemy/QuickNode) is gone on purpose.
export const rpcProviders: Record<number, string> = {
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com',
  [optimism.id]: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  [base.id]: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
}

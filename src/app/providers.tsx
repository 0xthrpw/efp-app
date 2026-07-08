'use client'

import posthog from 'posthog-js'
import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { PostHogProvider } from 'posthog-js/react'
import { ThirdwebProvider } from 'thirdweb/react'
import { WagmiProvider, type State } from 'wagmi'
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setIdentityKitApiUrls, TransactionProvider, TranslationProvider } from 'ethereum-identity-kit'
import { setIdentityKitApiUrls as setIdentityKitUtilsApiUrls } from 'ethereum-identity-kit/utils'

import wagmiConfig from '#/lib/wagmi'
import { DAY, MINUTE } from '#/lib/constants'
import Navigation from '#/components/navigation'
import { SoundsProvider } from '#/contexts/sounds-context'
import { translations } from '#/lib/constants/translations'
import TransactionModal from '#/components/transaction-modal'
import { EFPProfileProvider } from '#/contexts/efp-profile-context'
import PostHogIdentify from '#/components/posthog/posthog-identify'
import PostHogCartTracker from '#/components/posthog/posthog-cart-tracker'
import PostHogProfileProperties from '#/components/posthog/posthog-profile-properties'
import { RecommendedProfilesProvider } from '#/contexts/recommended-profiles-context'

// Point the kit at our self-hosted EFP API. The env read must live here in app
// source — Next only inlines NEXT_PUBLIC_* in application code, so the kit
// can't see it from inside node_modules on the client. Module scope so it runs
// before any kit fetch; the package's `.` and `./utils` entries each carry
// their own copy of the config, so configure both.
setIdentityKitApiUrls({ efpApiUrl: process.env.NEXT_PUBLIC_EFP_API_URL })
setIdentityKitUtilsApiUrls({ efpApiUrl: process.env.NEXT_PUBLIC_EFP_API_URL })

type ProviderProps = {
  children: React.ReactNode
  initialState?: State
}

const darkThemes = ['dark', 'halloween']

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 1 * DAY, staleTime: 5 * MINUTE },
  },
})

const Providers: React.FC<ProviderProps> = ({ children, initialState }) => {
  const { resolvedTheme } = useTheme()

  const rainbowKitTheme = useMemo(() => {
    return darkThemes.includes(resolvedTheme || 'dark') ? darkTheme() : undefined
  }, [resolvedTheme])

  const providers = useMemo(
    () => (
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <RainbowKitProvider coolMode={false} theme={rainbowKitTheme}>
              <ThirdwebProvider>
                <TranslationProvider translations={translations}>
                  <TransactionProvider batchTransactions={true} disableAutoListSelection={true}>
                    <EFPProfileProvider>
                      <PostHogProfileProperties />
                      <PostHogCartTracker />
                      <SoundsProvider>
                        <RecommendedProfilesProvider>
                          <Navigation />
                          {children}
                          <TransactionModal />
                          <div id='modal-root' />
                        </RecommendedProfilesProvider>
                      </SoundsProvider>
                    </EFPProfileProvider>
                  </TransactionProvider>
                </TranslationProvider>
              </ThirdwebProvider>
            </RainbowKitProvider>
            <PostHogIdentify />
          </WagmiProvider>
        </QueryClientProvider>
      </PostHogProvider>
    ),
    [rainbowKitTheme, initialState, children]
  )

  return providers
}

export default Providers

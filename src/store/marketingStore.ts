import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/id'
import { buildDemoWorkspace } from '@/lib/marketing/demoData'
import type { CsvCampaignRow } from '@/lib/marketing/csvCampaignImport'
import type { Campaign, Channel, ContentPlanItem, MarketingProfile } from '@/types/marketing'

interface MarketingStoreState {
  hasHydrated: boolean
  onboardingComplete: boolean
  profile: MarketingProfile | null
  channels: Channel[]
  campaigns: Campaign[]
  contentPlan: ContentPlanItem[]
  /** Дата (YYYY-MM-DD) последнего показа «Утреннего брифинга» — не чаще раза в день. */
  digestLastSeen: string | null

  completeOnboarding: (profile: Omit<MarketingProfile, 'id' | 'createdAt'>, channels: Omit<Channel, 'id'>[]) => void
  loadDemo: () => void
  reset: () => void

  addCampaign: (campaign: Omit<Campaign, 'id'>) => void
  updateCampaign: (id: string, patch: Partial<Omit<Campaign, 'id'>>) => void
  deleteCampaign: (id: string) => void

  addContentItem: (item: Omit<ContentPlanItem, 'id'>) => void
  updateContentItem: (id: string, patch: Partial<Omit<ContentPlanItem, 'id'>>) => void
  deleteContentItem: (id: string) => void

  importCampaignsFromCsv: (rows: CsvCampaignRow[]) => { importedCount: number; createdChannels: string[] }

  markDigestSeen: (date: string) => void
}

const EMPTY_PERIOD = { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, spend: 0 }

export const useMarketingStore = create<MarketingStoreState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      onboardingComplete: false,
      profile: null,
      channels: [],
      campaigns: [],
      contentPlan: [],
      digestLastSeen: null,

      completeOnboarding: (profileInput, channelsInput) => {
        const profile: MarketingProfile = {
          ...profileInput,
          id: generateId('workspace'),
          createdAt: new Date().toISOString(),
        }
        const channels: Channel[] = channelsInput.map((c) => ({ ...c, id: generateId('channel') }))
        set({ profile, channels, campaigns: [], contentPlan: [], onboardingComplete: true })
      },

      loadDemo: () => {
        const demo = buildDemoWorkspace()
        set({
          profile: demo.profile,
          channels: demo.channels,
          campaigns: demo.campaigns,
          contentPlan: demo.contentPlan,
          onboardingComplete: true,
        })
      },

      reset: () => {
        set({ profile: null, channels: [], campaigns: [], contentPlan: [], onboardingComplete: false, digestLastSeen: null })
      },

      addCampaign: (campaign) => {
        set((s) => ({ campaigns: [...s.campaigns, { ...campaign, id: generateId('camp') }] }))
      },
      updateCampaign: (id, patch) => {
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
      },
      deleteCampaign: (id) => {
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }))
      },

      addContentItem: (item) => {
        set((s) => ({ contentPlan: [...s.contentPlan, { ...item, id: generateId('content') }] }))
      },
      updateContentItem: (id, patch) => {
        set((s) => ({ contentPlan: s.contentPlan.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
      },
      deleteContentItem: (id) => {
        set((s) => ({ contentPlan: s.contentPlan.filter((c) => c.id !== id) }))
      },

      importCampaignsFromCsv: (rows) => {
        const state = get()
        const channels = [...state.channels]
        const createdChannels: string[] = []

        function resolveChannelId(name: string): string {
          const existing = channels.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())
          if (existing) return existing.id
          const created: Channel = { id: generateId('channel'), name, type: 'context', isActive: true }
          channels.push(created)
          createdChannels.push(name)
          return created.id
        }

        const newCampaigns: Campaign[] = rows.map((row) => ({
          id: generateId('camp'),
          name: row.campaignName,
          channelId: resolveChannelId(row.channelName),
          source: 'manual',
          budgetPlanned: row.budgetPlanned,
          budgetSpent: row.budgetSpent,
          startDate: row.startDate,
          endDate: row.endDate,
          status: row.status,
          impressions: row.impressions,
          clicks: row.clicks,
          leads: row.leads,
          conversions: row.conversions,
          revenue: row.revenue,
          previousPeriod: { ...EMPTY_PERIOD },
        }))

        set((s) => ({ channels, campaigns: [...s.campaigns, ...newCampaigns] }))
        return { importedCount: newCampaigns.length, createdChannels }
      },

      markDigestSeen: (date) => set({ digestLastSeen: date }),
    }),
    {
      name: 'ai-cmo:state:v1',
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        profile: s.profile,
        channels: s.channels,
        campaigns: s.campaigns,
        contentPlan: s.contentPlan,
        digestLastSeen: s.digestLastSeen,
      }),
    },
  ),
)

// hasHydrated нужно выставлять из onRehydrateStorage, но там нет доступа к set() напрямую —
// подписываемся на завершение гидратации через persist API вместо метода в самом стейте.
useMarketingStore.persist.onFinishHydration(() => {
  useMarketingStore.setState({ hasHydrated: true })
})
if (useMarketingStore.persist.hasHydrated()) {
  useMarketingStore.setState({ hasHydrated: true })
}

import { useMemo } from 'react'
import { buildRecommendations } from '@/lib/marketing/recommendations'
import { useMarketingStore } from '@/store/marketingStore'

export function useRecommendations() {
  const campaigns = useMarketingStore((s) => s.campaigns)
  const channels = useMarketingStore((s) => s.channels)
  return useMemo(() => buildRecommendations(campaigns, channels), [campaigns, channels])
}

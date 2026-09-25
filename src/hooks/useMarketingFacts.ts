import { useMemo } from 'react'
import { buildChannelFacts } from '@/lib/marketing/recommendations'
import { aggregateCampaignMetrics, calculateBudgetUtilizationPct, calculateCAC, calculateROAS, calculateROMI } from '@/lib/marketing/formulas'
import { useMarketingStore } from '@/store/marketingStore'

export function useMarketingFacts() {
  const campaigns = useMarketingStore((s) => s.campaigns)
  const channels = useMarketingStore((s) => s.channels)

  return useMemo(() => {
    const channelFacts = buildChannelFacts(campaigns, channels)
    const totals = aggregateCampaignMetrics(campaigns)
    const budgetPlannedTotal = campaigns.reduce((sum, c) => sum + c.budgetPlanned, 0)
    const newCustomers = totals.conversions

    return {
      channelFacts,
      totals,
      blendedRoas: calculateROAS(totals.revenue, totals.spend),
      blendedRomiPct: calculateROMI(totals.revenue, totals.spend),
      blendedCac: calculateCAC(totals.spend, newCustomers),
      budgetUtilizationPct: calculateBudgetUtilizationPct(totals.spend, budgetPlannedTotal),
      budgetPlannedTotal,
    }
  }, [campaigns, channels])
}

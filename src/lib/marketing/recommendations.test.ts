import { describe, expect, it } from 'vitest'
import type { Campaign, Channel } from '@/types/marketing'
import {
  buildCampaignFacts,
  buildChannelFacts,
  buildOpportunitySentence,
  buildReallocationSentence,
  buildRecommendations,
  buildWatchSentence,
} from './recommendations'

const CHANNELS: Channel[] = [
  { id: 'ch_yandex', name: 'Яндекс.Директ', type: 'context', isActive: true },
  { id: 'ch_vk', name: 'VK Реклама', type: 'target', isActive: true },
]

function makeCampaign(overrides: Partial<Campaign>): Campaign {
  return {
    id: 'c1',
    name: 'Test Campaign',
    channelId: 'ch_yandex',
    source: 'manual',
    budgetPlanned: 100000,
    budgetSpent: 50000,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'active',
    impressions: 100000,
    clicks: 3000,
    leads: 200,
    conversions: 20,
    revenue: 80000,
    previousPeriod: {
      impressions: 90000,
      clicks: 2900,
      leads: 190,
      conversions: 19,
      revenue: 76000,
      spend: 45000,
    },
    ...overrides,
  }
}

describe('buildCampaignFacts', () => {
  it('computes CPL now/prev and growth', () => {
    const [fact] = buildCampaignFacts([makeCampaign({})], CHANNELS)
    expect(fact.cplNow).toBe(250) // 50000/200
    expect(fact.cplPrev).toBeCloseTo(236.84, 1) // 45000/190
    expect(fact.cplGrowthPct).toBeGreaterThan(0)
  })

  it('resolves the channel name and budget remaining', () => {
    const [fact] = buildCampaignFacts([makeCampaign({})], CHANNELS)
    expect(fact.channelName).toBe('Яндекс.Директ')
    expect(fact.budgetRemaining).toBe(50000)
  })
})

describe('buildChannelFacts', () => {
  it('aggregates campaigns by channel and computes ROMI/ROAS on the totals', () => {
    const campaigns = [
      makeCampaign({ id: 'c1', channelId: 'ch_yandex', budgetSpent: 50000, revenue: 80000 }),
      makeCampaign({ id: 'c2', channelId: 'ch_vk', budgetSpent: 40000, revenue: 168000 }),
    ]
    const facts = buildChannelFacts(campaigns, CHANNELS)
    const vk = facts.find((f) => f.channelId === 'ch_vk')!
    expect(vk.spend).toBe(40000)
    expect(vk.revenue).toBe(168000)
    expect(vk.romiPct).toBe(320)
  })

  it('returns null ROMI for a channel with no spend', () => {
    const facts = buildChannelFacts([], CHANNELS)
    expect(facts.every((f) => f.romiPct === null)).toBe(true)
  })
})

describe('buildReallocationSentence', () => {
  it('matches the founder-specified natural language style', () => {
    const sentence = buildReallocationSentence({
      campaignName: 'Осенняя распродажа',
      metricChangePct: 40,
      targetChannelName: 'VK Реклама',
      targetChannelRomiPct: 320,
      suggestedAmount: 50000,
    })
    expect(sentence).toContain('Осенняя распродажа')
    expect(sentence).toContain('сжигает бюджет')
    expect(sentence).toContain('выросла на 40%')
    expect(sentence).toContain('VK Реклама')
    expect(sentence).toContain('ROMI составляет 320%')
    expect(sentence).toMatch(/50\s?000/)
  })

  it('handles a declining metric with a different verb', () => {
    const sentence = buildReallocationSentence({
      campaignName: 'X',
      metricChangePct: -10,
      targetChannelName: 'Y',
      targetChannelRomiPct: 100,
      suggestedAmount: 1000,
    })
    expect(sentence).toContain('снизилась на 10%')
  })
})

describe('buildWatchSentence / buildOpportunitySentence', () => {
  it('watch sentence names the campaign and its ROMI', () => {
    const sentence = buildWatchSentence({ campaignName: 'Тизерная сеть', romiPct: -73 })
    expect(sentence).toContain('Тизерная сеть')
    expect(sentence).toContain('-73%')
  })

  it('opportunity sentence names the channel and its ROMI edge over portfolio average', () => {
    const sentence = buildOpportunitySentence({ channelName: 'SEO', romiPct: 220, portfolioAvgRomiPct: 93 })
    expect(sentence).toContain('SEO')
    expect(sentence).toContain('220%')
  })
})

describe('buildRecommendations', () => {
  it('flags a campaign whose CPL grew past the threshold and reallocates toward the best-ROMI channel', () => {
    const burning = makeCampaign({
      id: 'burning',
      name: 'Осенняя распродажа',
      channelId: 'ch_yandex',
      budgetPlanned: 240000,
      budgetSpent: 140000,
      leads: 500,
      revenue: 200000,
      previousPeriod: { impressions: 150000, clicks: 4600, leads: 500, conversions: 45, revenue: 190000, spend: 100000 },
    })
    const strong = makeCampaign({
      id: 'strong',
      name: 'VK — ретаргетинг',
      channelId: 'ch_vk',
      budgetPlanned: 60000,
      budgetSpent: 40000,
      revenue: 168000,
      previousPeriod: { impressions: 80000, clicks: 3600, leads: 190, conversions: 42, revenue: 126000, spend: 35000 },
    })

    const recs = buildRecommendations([burning, strong], CHANNELS)
    const reallocation = recs.find((r) => r.type === 'reallocate' && r.campaignId === 'burning')
    expect(reallocation).toBeDefined()
    expect(reallocation!.targetChannelName).toBe('VK Реклама')
    expect(reallocation!.targetChannelRomiPct).toBe(320)
    expect(reallocation!.suggestedAmount).toBe(50000) // (240000-140000) remaining * 0.5, rounded to 1000
    expect(reallocation!.sentence).toContain('50 000') // formatCurrency uses a non-breaking space
  })

  it('produces a watch recommendation (no target) when ROMI is negative but no CPL growth data exists', () => {
    const losing = makeCampaign({
      id: 'losing',
      name: 'Тизерная сеть',
      channelId: 'ch_yandex',
      budgetSpent: 30000,
      leads: 40,
      revenue: 8000,
      previousPeriod: { impressions: 100000, clicks: 900, leads: 40, conversions: 3, revenue: 12000, spend: 30000 },
    })
    const recs = buildRecommendations([losing], CHANNELS)
    expect(recs.some((r) => r.campaignId === 'losing')).toBe(true)
  })

  it('does not flag a healthy, stable campaign', () => {
    const healthy = makeCampaign({ id: 'healthy', name: 'Стабильная кампания' })
    const recs = buildRecommendations([healthy], CHANNELS)
    expect(recs.find((r) => r.campaignId === 'healthy')).toBeUndefined()
  })

  it('sorts critical recommendations before warnings and info', () => {
    const critical = makeCampaign({
      id: 'critical',
      name: 'Critical',
      channelId: 'ch_yandex',
      budgetSpent: 50000,
      leads: 100,
      revenue: 40000,
      previousPeriod: { impressions: 50000, clicks: 1000, leads: 200, conversions: 20, revenue: 80000, spend: 50000 },
    })
    const warning = makeCampaign({
      id: 'warning',
      name: 'Warning',
      channelId: 'ch_yandex',
      budgetSpent: 50000,
      leads: 160,
      revenue: 90000,
      previousPeriod: { impressions: 50000, clicks: 1000, leads: 200, conversions: 20, revenue: 90000, spend: 50000 },
    })
    const strong = makeCampaign({ id: 'strong', name: 'Strong', channelId: 'ch_vk', budgetSpent: 40000, revenue: 168000 })

    const recs = buildRecommendations([critical, warning, strong], CHANNELS)
    const criticalIndex = recs.findIndex((r) => r.campaignId === 'critical')
    const warningIndex = recs.findIndex((r) => r.campaignId === 'warning')
    expect(criticalIndex).toBeGreaterThanOrEqual(0)
    expect(warningIndex).toBeGreaterThan(criticalIndex)
  })
})

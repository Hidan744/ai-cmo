/**
 * Правило-based движок рекомендаций — детерминированный и объяснимый (НЕ вызов LLM в этой
 * фазе), по аналогии с тем, как AI CFO в Business Financial OS начинался с rule-based
 * логики (buildInventoryDigest / diagnostics) до подключения настоящей модели.
 *
 * Архитектура нарочно повторяет buildFinancialContext: сначала чистыми функциями считаются
 * факты (buildCampaignFacts/buildChannelFacts) — ничего не пересчитывается дальше по цепочке,
 * — и только потом факты превращаются в предложения на естественном языке шаблонной функцией.
 * Это оставляет возможность в будущей фазе заменить buildRecommendations на вызов реальной
 * LLM через Supabase Edge Function (как ai-cfo у Business Financial OS), передав туда те же
 * факты, без переписывания остального кода.
 */
import type { Campaign, Channel } from '@/types/marketing'
import { formatCurrency } from '@/lib/utils'
import { calculateCPL, calculatePeriodGrowthPct, calculateROAS, calculateROMI } from './formulas'

/** CPL/CAC, выросший на столько процентов и больше к предыдущему периоду — сигнал «сжигает бюджет». */
export const CPL_GROWTH_THRESHOLD_PCT = 25
/** Порог тяжести: рост CPL от этого значения — критическая, а не предупреждающая рекомендация. */
export const CPL_GROWTH_CRITICAL_PCT = 40
/** ROMI ниже этого значения — тоже «сжигает бюджет», даже если CPL не вырос. */
export const LOW_ROMI_FLOOR_PCT = 0
/** Канал считается кандидатом для переноса бюджета, если его ROMI хотя бы во столько раз выше среднего по портфелю. */
export const HIGH_ROMI_MULTIPLIER = 1.3
/**
 * Доля оставшегося (неизрасходованного) планового бюджета проблемной кампании, которую
 * рекомендуется перенести. Если бюджет уже исчерпан — берётся та же доля от уже
 * потраченного, как консервативная оценка суммы, которую стоит остановить/не продлевать.
 */
export const REALLOCATION_SHARE = 0.5

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

export interface CampaignFact {
  campaignId: string
  campaignName: string
  channelId: string
  channelName: string
  spend: number
  budgetPlanned: number
  budgetRemaining: number
  cplNow: number | null
  cplPrev: number | null
  cplGrowthPct: number | null
  romiNow: number | null
}

export interface ChannelFact {
  channelId: string
  channelName: string
  spend: number
  revenue: number
  romiPct: number | null
  roas: number | null
}

/** Считает факты по каждой кампании один раз — дальше по коду только чтение, без пересчётов. */
export function buildCampaignFacts(campaigns: Campaign[], channels: Channel[]): CampaignFact[] {
  const channelById = new Map(channels.map((c) => [c.id, c]))
  return campaigns.map((c) => {
    const channel = channelById.get(c.channelId)
    const cplNow = calculateCPL(c.budgetSpent, c.leads)
    const cplPrev = calculateCPL(c.previousPeriod.spend, c.previousPeriod.leads)
    const cplGrowthPct = cplNow !== null && cplPrev !== null ? calculatePeriodGrowthPct(cplNow, cplPrev) : null
    const romiNow = calculateROMI(c.revenue, c.budgetSpent)
    return {
      campaignId: c.id,
      campaignName: c.name,
      channelId: c.channelId,
      channelName: channel?.name ?? 'Без канала',
      spend: c.budgetSpent,
      budgetPlanned: c.budgetPlanned,
      budgetRemaining: Math.max(0, c.budgetPlanned - c.budgetSpent),
      cplNow,
      cplPrev,
      cplGrowthPct,
      romiNow,
    }
  })
}

/** Агрегирует кампании по каналу — считает ROMI/ROAS канала целиком, а не среднее по кампаниям. */
export function buildChannelFacts(campaigns: Campaign[], channels: Channel[]): ChannelFact[] {
  return channels.map((channel) => {
    const own = campaigns.filter((c) => c.channelId === channel.id)
    const spend = own.reduce((sum, c) => sum + c.budgetSpent, 0)
    const revenue = own.reduce((sum, c) => sum + c.revenue, 0)
    return {
      channelId: channel.id,
      channelName: channel.name,
      spend,
      revenue,
      romiPct: calculateROMI(revenue, spend),
      roas: calculateROAS(revenue, spend),
    }
  })
}

export type RecommendationSeverity = 'critical' | 'warning' | 'info'
export type RecommendationType = 'reallocate' | 'watch' | 'opportunity'

export interface Recommendation {
  id: string
  type: RecommendationType
  severity: RecommendationSeverity
  campaignId: string | null
  campaignName: string | null
  metricChangePct: number | null
  targetChannelId: string | null
  targetChannelName: string | null
  targetChannelRomiPct: number | null
  suggestedAmount: number | null
  sentence: string
}

/** Шаблон предложения для переноса бюджета — единственное место, где собирается текст рекомендации. */
export function buildReallocationSentence(input: {
  campaignName: string
  metricChangePct: number
  targetChannelName: string
  targetChannelRomiPct: number
  suggestedAmount: number
}): string {
  const changeLabel = input.metricChangePct >= 0 ? `выросла на ${Math.round(input.metricChangePct)}%` : `снизилась на ${Math.round(Math.abs(input.metricChangePct))}%`
  return `Кампания «${input.campaignName}» сжигает бюджет: стоимость лида ${changeLabel} за период. Рекомендую перераспределить ${formatCurrency(input.suggestedAmount)} в канал ${input.targetChannelName}, где ROMI составляет ${Math.round(input.targetChannelRomiPct)}%.`
}

export function buildWatchSentence(input: { campaignName: string; romiPct: number }): string {
  return `Кампания «${input.campaignName}» работает в минус: ROMI составляет ${Math.round(input.romiPct)}%. Подходящего канала для переноса бюджета пока не видно — проверьте оффер и таргетинг или поставьте кампанию на паузу.`
}

export function buildOpportunitySentence(input: { channelName: string; romiPct: number; portfolioAvgRomiPct: number }): string {
  const diffPct = Math.round(input.romiPct - input.portfolioAvgRomiPct)
  return `Канал ${input.channelName} показывает ROMI ${Math.round(input.romiPct)}% — на ${diffPct} п.п. выше среднего по портфелю. Стоит рассмотреть увеличение бюджета на этом канале.`
}

function pickBestTargetChannel(channelFacts: ChannelFact[], excludeChannelId: string): ChannelFact | null {
  const candidates = channelFacts.filter((c) => c.channelId !== excludeChannelId && c.romiPct !== null)
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) => ((c.romiPct as number) > (best.romiPct as number) ? c : best))
}

/**
 * Строит ранжированный список рекомендаций: критичные — первыми. Детерминированный набор
 * правил, без обращения к LLM — см. комментарий в шапке файла.
 */
export function buildRecommendations(campaigns: Campaign[], channels: Channel[]): Recommendation[] {
  const campaignFacts = buildCampaignFacts(campaigns, channels)
  const channelFacts = buildChannelFacts(campaigns, channels)

  const totalSpend = channelFacts.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = channelFacts.reduce((sum, c) => sum + c.revenue, 0)
  const portfolioAvgRomiPct = calculateROMI(totalRevenue, totalSpend)

  const recommendations: Recommendation[] = []
  const usedTargetChannelIds = new Set<string>()

  for (const fact of campaignFacts) {
    const cplBurning = fact.cplGrowthPct !== null && fact.cplGrowthPct >= CPL_GROWTH_THRESHOLD_PCT
    const romiBurning = fact.romiNow !== null && fact.romiNow < LOW_ROMI_FLOOR_PCT
    if (!cplBurning && !romiBurning) continue

    const severity: RecommendationSeverity =
      (fact.cplGrowthPct !== null && fact.cplGrowthPct >= CPL_GROWTH_CRITICAL_PCT) || (fact.romiNow !== null && fact.romiNow < -25)
        ? 'critical'
        : 'warning'

    const target = pickBestTargetChannel(channelFacts, fact.channelId)

    if (target && cplBurning && fact.cplGrowthPct !== null) {
      const base = fact.budgetRemaining > 0 ? fact.budgetRemaining : fact.spend
      const suggestedAmount = roundToStep(base * REALLOCATION_SHARE, 1000)
      usedTargetChannelIds.add(target.channelId)
      recommendations.push({
        id: `realloc_${fact.campaignId}`,
        type: 'reallocate',
        severity,
        campaignId: fact.campaignId,
        campaignName: fact.campaignName,
        metricChangePct: fact.cplGrowthPct,
        targetChannelId: target.channelId,
        targetChannelName: target.channelName,
        targetChannelRomiPct: target.romiPct,
        suggestedAmount,
        sentence: buildReallocationSentence({
          campaignName: fact.campaignName,
          metricChangePct: fact.cplGrowthPct,
          targetChannelName: target.channelName,
          targetChannelRomiPct: target.romiPct as number,
          suggestedAmount,
        }),
      })
    } else if (romiBurning) {
      recommendations.push({
        id: `watch_${fact.campaignId}`,
        type: 'watch',
        severity,
        campaignId: fact.campaignId,
        campaignName: fact.campaignName,
        metricChangePct: fact.cplGrowthPct,
        targetChannelId: null,
        targetChannelName: null,
        targetChannelRomiPct: null,
        suggestedAmount: null,
        sentence: buildWatchSentence({ campaignName: fact.campaignName, romiPct: fact.romiNow as number }),
      })
    }
  }

  if (portfolioAvgRomiPct !== null) {
    const opportunity = channelFacts
      .filter((c) => c.romiPct !== null && !usedTargetChannelIds.has(c.channelId) && (c.romiPct as number) >= portfolioAvgRomiPct * HIGH_ROMI_MULTIPLIER)
      .sort((a, b) => (b.romiPct as number) - (a.romiPct as number))[0]

    if (opportunity) {
      recommendations.push({
        id: `opportunity_${opportunity.channelId}`,
        type: 'opportunity',
        severity: 'info',
        campaignId: null,
        campaignName: null,
        metricChangePct: null,
        targetChannelId: opportunity.channelId,
        targetChannelName: opportunity.channelName,
        targetChannelRomiPct: opportunity.romiPct,
        suggestedAmount: null,
        sentence: buildOpportunitySentence({
          channelName: opportunity.channelName,
          romiPct: opportunity.romiPct as number,
          portfolioAvgRomiPct,
        }),
      })
    }
  }

  const severityRank: Record<RecommendationSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return recommendations.sort((a, b) => {
    const bySeverity = severityRank[a.severity] - severityRank[b.severity]
    if (bySeverity !== 0) return bySeverity
    return (b.suggestedAmount ?? 0) - (a.suggestedAmount ?? 0)
  })
}

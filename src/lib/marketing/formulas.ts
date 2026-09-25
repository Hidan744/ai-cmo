/**
 * Базовые формулы маркетинговой аналитики. Все функции — чистые, без побочных эффектов.
 * Деление на ноль / некорректные входные данные не бросают исключений и не
 * возвращают NaN — они возвращают null, а UI обязан обработать null явно
 * (тот же приём, что и в src/lib/finance/formulas.ts у Business Financial OS).
 */

/** CTR (Click-Through Rate): клики / показы, в процентах. */
export function calculateCTR(clicks: number, impressions: number): number | null {
  if (impressions <= 0) return null
  return (clicks / impressions) * 100
}

/** CPC (Cost Per Click): расход / клики. */
export function calculateCPC(spend: number, clicks: number): number | null {
  if (clicks <= 0) return null
  return spend / clicks
}

/** CPL (Cost Per Lead): расход / лиды. */
export function calculateCPL(spend: number, leads: number): number | null {
  if (leads <= 0) return null
  return spend / leads
}

/** CPA (Cost Per Acquisition): расход / конверсии (продажи, заявки, целевые действия). */
export function calculateCPA(spend: number, conversions: number): number | null {
  if (conversions <= 0) return null
  return spend / conversions
}

/** CAC (Customer Acquisition Cost): весь маркетинговый бюджет / количество НОВЫХ клиентов за период. */
export function calculateCAC(totalSpend: number, newCustomers: number): number | null {
  if (newCustomers <= 0) return null
  return totalSpend / newCustomers
}

/** ROAS (Return on Ad Spend): выручка, атрибутированная рекламе / расход. Без учёта маржи. */
export function calculateROAS(attributedRevenue: number, spend: number): number | null {
  if (spend <= 0) return null
  return attributedRevenue / spend
}

/**
 * ROMI (Return on Marketing Investment), в процентах: (выручка − расход) / расход × 100.
 * В отличие от ROAS учитывает, что часть выручки — не чистая прибыль, но здесь (как и в
 * calculateMarketingEfficiencyPct у Business Financial OS) используется вся атрибутированная
 * выручка без валовой маржи — грубая, но стандартная для маркетинга версия ROMI.
 */
export function calculateROMI(attributedRevenue: number, spend: number): number | null {
  if (spend <= 0) return null
  return ((attributedRevenue - spend) / spend) * 100
}

/** Конверсия из кликов в лиды/продажи, в процентах: конверсии / клики. */
export function calculateConversionRate(conversions: number, clicks: number): number | null {
  if (clicks <= 0) return null
  return (conversions / clicks) * 100
}

/** Конверсия из лидов в клиентов (продажи), в процентах: клиенты / лиды. */
export function calculateLeadToCustomerRate(customers: number, leads: number): number | null {
  if (leads <= 0) return null
  return (customers / leads) * 100
}

/** Освоение бюджета, в процентах: потрачено / запланировано. Может быть > 100 (перерасход). */
export function calculateBudgetUtilizationPct(spent: number, planned: number): number | null {
  if (planned <= 0) return null
  return (spent / planned) * 100
}

/** Средний чек, атрибутированный маркетингу: выручка / количество продаж (конверсий). */
export function calculateAverageOrderValue(revenue: number, conversions: number): number | null {
  if (conversions <= 0) return null
  return revenue / conversions
}

/** % изменения показателя к предыдущему значению. null, если базовое значение — 0. */
export function calculatePeriodGrowthPct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export interface AggregateSpendRevenue {
  spend: number
  revenue: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
}

/** Суммирует сырые показатели по списку кампаний/каналов — основа для «слепых» (blended) KPI. */
export function aggregateCampaignMetrics(
  items: Array<{ budgetSpent: number; revenue: number; impressions: number; clicks: number; leads: number; conversions: number }>,
): AggregateSpendRevenue {
  return items.reduce(
    (acc, item) => ({
      spend: acc.spend + item.budgetSpent,
      revenue: acc.revenue + item.revenue,
      impressions: acc.impressions + item.impressions,
      clicks: acc.clicks + item.clicks,
      leads: acc.leads + item.leads,
      conversions: acc.conversions + item.conversions,
    }),
    { spend: 0, revenue: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0 },
  )
}

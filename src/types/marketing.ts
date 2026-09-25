export type PrimaryGoal = 'leads' | 'sales' | 'awareness'

export const GOAL_LABELS: Record<PrimaryGoal, string> = {
  leads: 'Лиды',
  sales: 'Продажи',
  awareness: 'Узнаваемость',
}

export interface MarketingProfile {
  id: string
  companyName: string
  niche: string
  monthlyBudget: number
  primaryGoal: PrimaryGoal
  createdAt: string
}

export type ChannelType = 'context' | 'target' | 'seo' | 'smm' | 'email' | 'offline'

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  context: 'Контекстная реклама',
  target: 'Таргетированная реклама',
  seo: 'SEO',
  smm: 'SMM',
  email: 'Email-маркетинг',
  offline: 'Офлайн',
}

export interface Channel {
  id: string
  name: string
  type: ChannelType
  isActive: boolean
}

export type CampaignStatus = 'active' | 'paused' | 'completed'

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Активна',
  paused: 'На паузе',
  completed: 'Завершена',
}

/** Откуда взяты данные кампании — визуально продаёт идею «сквозной аналитики» в демо. */
export type CampaignSource = 'yandex_direct' | 'vk_ads' | 'crm' | 'manual'

export const CAMPAIGN_SOURCE_LABELS: Record<CampaignSource, string> = {
  yandex_direct: 'Яндекс.Директ',
  vk_ads: 'VK Реклама',
  crm: 'CRM (amoCRM)',
  manual: 'Вручную / CSV',
}

/** Сырые метрики за период — общая форма и для текущего периода кампании, и для предыдущего (сравнение). */
export interface CampaignPeriodMetrics {
  impressions: number
  clicks: number
  leads: number
  conversions: number
  revenue: number
  spend: number
}

export interface Campaign {
  id: string
  name: string
  channelId: string
  /** Откуда пришли данные кампании — для CSV-импорта всегда 'manual'. */
  source: CampaignSource
  budgetPlanned: number
  budgetSpent: number
  startDate: string
  endDate: string
  status: CampaignStatus
  impressions: number
  clicks: number
  leads: number
  conversions: number
  revenue: number
  /**
   * Метрики за предыдущий сопоставимый период (напр. прошлая неделя) — база для
   * расчёта динамики (рост CPL/CAC/ROAS) и триггеров рекомендаций. budgetSpent
   * текущего периода соответствует полю spend в CampaignPeriodMetrics.
   */
  previousPeriod: CampaignPeriodMetrics
}

export type ContentStatus = 'idea' | 'in-progress' | 'published'

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: 'Идея',
  'in-progress': 'В работе',
  published: 'Опубликовано',
}

export interface ContentPlanItem {
  id: string
  date: string
  platform: string
  topic: string
  status: ContentStatus
}

export type DataConnectorId = 'yandex-direct' | 'vk-ads' | 'crm'

export interface DataConnector {
  id: DataConnectorId
  name: string
  description: string
}

export const DATA_CONNECTORS: DataConnector[] = [
  { id: 'yandex-direct', name: 'Яндекс.Директ', description: 'Импорт кампаний, расходов и конверсий напрямую из рекламного кабинета.' },
  { id: 'vk-ads', name: 'VK Реклама', description: 'Синхронизация кампаний и метрик из VK Рекламы в реальном времени.' },
  { id: 'crm', name: 'CRM (amoCRM / Bitrix24)', description: 'Подтягивает сделки и выручку, атрибутированную каждой кампании.' },
]

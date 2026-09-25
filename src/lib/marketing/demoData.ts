import { generateBusinessId, generateId } from '@/lib/id'
import type { Campaign, Channel, ContentPlanItem, MarketingProfile } from '@/types/marketing'

export interface DemoWorkspace {
  profile: MarketingProfile
  channels: Channel[]
  campaigns: Campaign[]
  contentPlan: ContentPlanItem[]
}

/**
 * Демо-датасет «GlowLab» — сеть косметологических клиник. Числа подобраны так, чтобы
 * сходиться (CTR/CPC/CPL/ROMI считаются из показов/кликов/расхода/выручки, а не выдуманы
 * отдельно), и чтобы движок рекомендаций (recommendations.ts) реально находил проблемную
 * кампанию и канал-кандидат для переноса бюджета — то есть демо доказывает, что правила
 * работают, а не просто иллюстрирует UI.
 */
export function buildDemoWorkspace(): DemoWorkspace {
  const ch = {
    yandex: 'ch_yandex_direct',
    vk: 'ch_vk_ads',
    seo: 'ch_seo',
    email: 'ch_email',
    offline: 'ch_offline',
  }

  const channels: Channel[] = [
    { id: ch.yandex, name: 'Яндекс.Директ', type: 'context', isActive: true },
    { id: ch.vk, name: 'VK Реклама', type: 'target', isActive: true },
    { id: ch.seo, name: 'SEO', type: 'seo', isActive: true },
    { id: ch.email, name: 'Email-рассылки', type: 'email', isActive: true },
    { id: ch.offline, name: 'Офлайн (наружная реклама)', type: 'offline', isActive: false },
  ]

  const campaigns: Campaign[] = [
    {
      id: generateId('camp'),
      name: 'Осенняя распродажа',
      channelId: ch.yandex,
      source: 'yandex_direct',
      budgetPlanned: 240000,
      budgetSpent: 140000,
      startDate: '2026-09-08',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 155600,
      clicks: 4667,
      leads: 500,
      conversions: 50,
      revenue: 200000,
      previousPeriod: { impressions: 150000, clicks: 4600, leads: 500, conversions: 45, revenue: 190000, spend: 100000 },
    },
    {
      id: generateId('camp'),
      name: 'Тизерная сеть — баннеры',
      channelId: ch.yandex,
      source: 'yandex_direct',
      budgetPlanned: 50000,
      budgetSpent: 30000,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 200000,
      clicks: 1000,
      leads: 40,
      conversions: 2,
      revenue: 8000,
      previousPeriod: { impressions: 180000, clicks: 1100, leads: 45, conversions: 3, revenue: 12000, spend: 25000 },
    },
    {
      id: generateId('camp'),
      name: 'Ретаргетинг на подписчиков',
      channelId: ch.vk,
      source: 'vk_ads',
      budgetPlanned: 60000,
      budgetSpent: 40000,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 90000,
      clicks: 4050,
      leads: 210,
      conversions: 50,
      revenue: 168000,
      previousPeriod: { impressions: 80000, clicks: 3600, leads: 190, conversions: 42, revenue: 126000, spend: 35000 },
    },
    {
      id: generateId('camp'),
      name: 'Продвижение сообщества клиники',
      channelId: ch.vk,
      source: 'vk_ads',
      budgetPlanned: 25000,
      budgetSpent: 18000,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 60000,
      clicks: 1800,
      leads: 70,
      conversions: 12,
      revenue: 36000,
      previousPeriod: { impressions: 55000, clicks: 1650, leads: 65, conversions: 10, revenue: 30000, spend: 16000 },
    },
    {
      id: generateId('camp'),
      name: 'Органический трафик / блог',
      channelId: ch.seo,
      source: 'manual',
      budgetPlanned: 25000,
      budgetSpent: 20000,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 40000,
      clicks: 6000,
      leads: 80,
      conversions: 16,
      revenue: 64000,
      previousPeriod: { impressions: 36000, clicks: 5400, leads: 70, conversions: 13, revenue: 52000, spend: 18000 },
    },
    {
      id: generateId('camp'),
      name: 'Email-рассылка по базе клиентов',
      channelId: ch.email,
      source: 'crm',
      budgetPlanned: 10000,
      budgetSpent: 8000,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      status: 'active',
      impressions: 12000,
      clicks: 900,
      leads: 30,
      conversions: 8,
      revenue: 20000,
      previousPeriod: { impressions: 11500, clicks: 850, leads: 28, conversions: 7, revenue: 17000, spend: 7500 },
    },
  ]

  const contentPlan: ContentPlanItem[] = [
    { id: generateId('content'), date: '2026-09-26', platform: 'Instagram*', topic: 'До/после: коррекция контура лица', status: 'published' },
    { id: generateId('content'), date: '2026-09-28', platform: 'VK', topic: 'Разбор мифов об уходе за кожей', status: 'published' },
    { id: generateId('content'), date: '2026-10-01', platform: 'Блог сайта', topic: 'Как выбрать косметолога: чек-лист', status: 'in-progress' },
    { id: generateId('content'), date: '2026-10-03', platform: 'Email', topic: 'Осенняя акция для постоянных клиентов', status: 'in-progress' },
    { id: generateId('content'), date: '2026-10-05', platform: 'VK', topic: 'Отзыв клиентки после курса процедур', status: 'idea' },
    { id: generateId('content'), date: '2026-10-08', platform: 'Instagram*', topic: 'Reels: день из жизни клиники', status: 'idea' },
    { id: generateId('content'), date: '2026-10-10', platform: 'Блог сайта', topic: 'Сравнение аппаратных методик омоложения', status: 'idea' },
  ]

  const profile: MarketingProfile = {
    id: generateBusinessId(),
    companyName: 'GlowLab',
    niche: 'Сеть косметологических клиник',
    monthlyBudget: 410000,
    primaryGoal: 'leads',
    createdAt: new Date().toISOString(),
  }

  return { profile, channels, campaigns, contentPlan }
}

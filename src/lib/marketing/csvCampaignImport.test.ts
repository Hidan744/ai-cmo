import { describe, expect, it } from 'vitest'
import { generateCampaignCsvTemplate, parseCampaignCsv } from './csvCampaignImport'

describe('parseCampaignCsv', () => {
  it('parses a well-formed file into campaign rows', () => {
    const csv = [
      'Канал,Кампания,Дата начала,Дата окончания,План бюджета,Расход,Показы,Клики,Лиды,Конверсии,Выручка,Статус',
      'Яндекс.Директ,Осенняя распродажа,2026-09-01,2026-09-30,240000,140000,155600,4667,500,50,200000,Активна',
      'VK Реклама,Ретаргетинг,2026-09-01,2026-09-30,60000,40000,90000,4050,210,50,168000,Активна',
    ].join('\n')

    const result = parseCampaignCsv(csv)
    expect(result.warnings).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      channelName: 'Яндекс.Директ',
      campaignName: 'Осенняя распродажа',
      budgetPlanned: 240000,
      budgetSpent: 140000,
      leads: 500,
      revenue: 200000,
      status: 'active',
    })
  })

  it('warns and returns no rows when required columns are missing', () => {
    const result = parseCampaignCsv('Показы,Клики\n100,5')
    expect(result.rows).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('warns and returns no rows when there is no data row', () => {
    const result = parseCampaignCsv('Канал,Кампания')
    expect(result.rows).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('skips a row missing the channel or campaign name', () => {
    const csv = 'Канал,Кампания,Расход\n,Без канала,1000\nVK,Есть всё,2000'
    const result = parseCampaignCsv(csv)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].campaignName).toBe('Есть всё')
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('defaults an unparsable numeric cell to 0 and warns', () => {
    const csv = 'Канал,Кампания,Расход\nVK,Test,не число'
    const result = parseCampaignCsv(csv)
    expect(result.rows[0].budgetSpent).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('parses a paused status', () => {
    const csv = 'Канал,Кампания,Статус\nVK,Test,На паузе'
    const result = parseCampaignCsv(csv)
    expect(result.rows[0].status).toBe('paused')
  })
})

describe('generateCampaignCsvTemplate', () => {
  it('round-trips through the parser without warnings', () => {
    const template = generateCampaignCsvTemplate()
    const result = parseCampaignCsv(template)
    expect(result.warnings).toEqual([])
    expect(result.rows).toHaveLength(1)
  })
})

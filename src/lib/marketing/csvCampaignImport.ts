/**
 * Импорт кампаний из CSV — тот же приём, что и у csvFinancialImport.ts в Business Financial
 * OS (синонимы заголовков колонок, устойчивый разбор чисел), но по одной строке на кампанию,
 * а не по одному «текущему периоду» на файл. Это ручной, но реальный (не заглушка) канал
 * получения данных в эту фазу — то же место, куда позже подключится живой коннектор
 * Яндекс.Директ/VK Рекламы.
 */
import type { CampaignStatus } from '@/types/marketing'

export interface CsvCampaignRow {
  channelName: string
  campaignName: string
  startDate: string
  endDate: string
  budgetPlanned: number
  budgetSpent: number
  impressions: number
  clicks: number
  leads: number
  conversions: number
  revenue: number
  status: CampaignStatus
}

export interface CampaignImportResult {
  rows: CsvCampaignRow[]
  warnings: string[]
}

const HEADER_ALIASES = {
  channelName: ['канал', 'channel'],
  campaignName: ['кампания', 'campaign', 'название кампании'],
  startDate: ['дата начала', 'start date', 'начало'],
  endDate: ['дата окончания', 'end date', 'окончание'],
  budgetPlanned: ['план бюджета', 'бюджет план', 'planned budget', 'budget planned'],
  budgetSpent: ['расход', 'потрачено', 'spend', 'budget spent'],
  impressions: ['показы', 'impressions'],
  clicks: ['клики', 'clicks'],
  leads: ['лиды', 'leads'],
  conversions: ['конверсии', 'продажи', 'conversions'],
  revenue: ['выручка', 'revenue'],
  status: ['статус', 'status'],
} as const

type Field = keyof typeof HEADER_ALIASES

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseNumericCell(raw: string): number | null {
  const cleaned = (raw ?? '').replace(/[\s ]/g, '').replace(',', '.').replace(/[₽$€]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseStatus(raw: string): CampaignStatus {
  const v = raw.trim().toLowerCase()
  if (v.includes('пауз') || v === 'paused') return 'paused'
  if (v.includes('заверш') || v === 'completed') return 'completed'
  return 'active'
}

/** Наивный CSV-парсер: одна ячейка = значение между запятыми, кавычки не поддерживаются
 *  (данные кампаний — числа и короткие названия, без запятых внутри значений). */
function splitCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim())
}

export function parseCampaignCsv(csvText: string): CampaignImportResult {
  const warnings: string[] = []
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    return { rows: [], warnings: ['В файле нет строк с данными (нужны заголовок + хотя бы одна строка кампании).'] }
  }

  const headerCells = splitCsvLine(lines[0]).map(normalizeHeader)
  const columnIndex: Partial<Record<Field, number>> = {}
  for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
    const idx = headerCells.findIndex((h) => (HEADER_ALIASES[field] as readonly string[]).includes(h))
    if (idx !== -1) columnIndex[field] = idx
  }

  if (columnIndex.channelName === undefined || columnIndex.campaignName === undefined) {
    return { rows: [], warnings: ['Не найдены обязательные колонки «Канал» и «Кампания».'] }
  }

  const rows: CsvCampaignRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const get = (field: Field) => (columnIndex[field] !== undefined ? cells[columnIndex[field] as number] : undefined)
    const num = (field: Field): number => {
      const raw = get(field)
      if (raw === undefined || raw === '') return 0
      const parsed = parseNumericCell(raw)
      if (parsed === null) {
        warnings.push(`Строка ${i + 1}: значение поля «${field}» («${raw}») не распознано как число — заменено на 0.`)
        return 0
      }
      return parsed < 0 ? 0 : parsed
    }

    const channelName = (get('channelName') ?? '').trim()
    const campaignName = (get('campaignName') ?? '').trim()
    if (!channelName || !campaignName) {
      warnings.push(`Строка ${i + 1}: пропущена — не заполнены канал или название кампании.`)
      continue
    }

    rows.push({
      channelName,
      campaignName,
      startDate: (get('startDate') ?? '').trim() || new Date().toISOString().slice(0, 10),
      endDate: (get('endDate') ?? '').trim() || new Date().toISOString().slice(0, 10),
      budgetPlanned: num('budgetPlanned'),
      budgetSpent: num('budgetSpent'),
      impressions: num('impressions'),
      clicks: num('clicks'),
      leads: num('leads'),
      conversions: num('conversions'),
      revenue: num('revenue'),
      status: parseStatus(get('status') ?? ''),
    })
  }

  return { rows, warnings }
}

export function generateCampaignCsvTemplate(): string {
  const headers = ['Канал', 'Кампания', 'Дата начала', 'Дата окончания', 'План бюджета', 'Расход', 'Показы', 'Клики', 'Лиды', 'Конверсии', 'Выручка', 'Статус']
  const example = ['Яндекс.Директ', 'Пример кампании', '2026-09-01', '2026-09-30', 100000, 85000, 120000, 3600, 240, 24, 96000, 'Активна']
  return [headers.join(','), example.join(',')].join('\n')
}

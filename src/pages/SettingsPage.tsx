import { useRef, useState } from 'react'
import { Database, Download, Search, Share2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useMarketingStore } from '@/store/marketingStore'
import { generateCampaignCsvTemplate, parseCampaignCsv } from '@/lib/marketing/csvCampaignImport'
import { DATA_CONNECTORS, GOAL_LABELS } from '@/types/marketing'

const CONNECTOR_ICONS = { 'yandex-direct': Search, 'vk-ads': Share2, crm: Database } as const

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const profile = useMarketingStore((s) => s.profile)
  const channels = useMarketingStore((s) => s.channels)
  const importCampaignsFromCsv = useMarketingStore((s) => s.importCampaignsFromCsv)
  const reset = useMarketingStore((s) => s.reset)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [importSummary, setImportSummary] = useState<string | null>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed = parseCampaignCsv(text)
      setWarnings(parsed.warnings)
      if (parsed.rows.length > 0) {
        const result = importCampaignsFromCsv(parsed.rows)
        setImportSummary(
          `Импортировано кампаний: ${result.importedCount}.` +
            (result.createdChannels.length > 0 ? ` Созданы новые каналы: ${result.createdChannels.join(', ')}.` : ''),
        )
      } else {
        setImportSummary(null)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-50">Настройки</h1>
        <p className="text-sm text-ink-500 mt-1">Профиль, источники данных и импорт</p>
      </div>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Профиль компании</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-ink-500 mb-1">Компания</div>
              <div className="text-ink-100">{profile.companyName}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">Ниша</div>
              <div className="text-ink-100">{profile.niche}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">Месячный бюджет</div>
              <div className="text-ink-100">{profile.monthlyBudget.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">Главная цель</div>
              <div className="text-ink-100">{GOAL_LABELS[profile.primaryGoal]}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Источники данных</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-400">
            Прямые интеграции с рекламными кабинетами и CRM подключаются в следующей фазе. Сейчас данные можно
            загрузить вручную через CSV ниже — тот же формат, в который в будущем будут писать живые коннекторы.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {DATA_CONNECTORS.map((connector) => {
              const Icon = CONNECTOR_ICONS[connector.id]
              return (
                <div key={connector.id} className="rounded-xl border border-ink-800 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-ink-800 text-ink-400">
                      <Icon className="size-4" />
                    </div>
                    <div className="text-sm font-medium text-ink-100">{connector.name}</div>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed flex-1">{connector.description}</p>
                  <Button variant="secondary" size="sm" disabled className="justify-center">
                    Подключить · скоро
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Импорт кампаний из CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-400">
            Колонки: Канал, Кампания, Дата начала, Дата окончания, План бюджета, Расход, Показы, Клики, Лиды,
            Конверсии, Выручка, Статус. Незнакомые каналы будут созданы автоматически.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" onClick={() => downloadTextFile('ai-cmo-campaigns-template.csv', generateCampaignCsvTemplate())}>
              <Download className="size-4" /> Скачать шаблон
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" /> Загрузить CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </div>
          {importSummary && <p className="text-sm text-positive-500">{importSummary}</p>}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-warning-500/25 bg-warning-500/10 p-3.5 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-warning-500">
                  {w}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Каналы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {channels.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 text-sm text-ink-200">
                <Checkbox checked={c.isActive} readOnly className="pointer-events-none" />
                {c.name}
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-negative-500/30">
        <CardHeader>
          <CardTitle>Опасная зона</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-400 mb-3">Полностью сбросить рабочее пространство и начать заново.</p>
          <Button variant="destructive" onClick={reset}>
            Сбросить всё
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

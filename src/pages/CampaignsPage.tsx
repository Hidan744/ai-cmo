import { useState } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SourceBadge } from '@/features/marketing/SourceBadge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useMarketingStore } from '@/store/marketingStore'
import { calculateCPC, calculateCPL, calculateCTR, calculateROAS, calculateROMI } from '@/lib/marketing/formulas'
import { CAMPAIGN_STATUS_LABELS, type Campaign, type CampaignStatus } from '@/types/marketing'

type CampaignFormData = {
  name: string
  channelId: string
  status: CampaignStatus
  budgetPlanned: string
  budgetSpent: string
  startDate: string
  endDate: string
  impressions: string
  clicks: string
  leads: string
  conversions: string
  revenue: string
}

function emptyForm(defaultChannelId: string): CampaignFormData {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: '',
    channelId: defaultChannelId,
    status: 'active',
    budgetPlanned: '',
    budgetSpent: '',
    startDate: today,
    endDate: today,
    impressions: '',
    clicks: '',
    leads: '',
    conversions: '',
    revenue: '',
  }
}

function toNumber(v: string): number {
  const n = Number(v.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function campaignToForm(c: Campaign): CampaignFormData {
  return {
    name: c.name,
    channelId: c.channelId,
    status: c.status,
    budgetPlanned: String(c.budgetPlanned),
    budgetSpent: String(c.budgetSpent),
    startDate: c.startDate,
    endDate: c.endDate,
    impressions: String(c.impressions),
    clicks: String(c.clicks),
    leads: String(c.leads),
    conversions: String(c.conversions),
    revenue: String(c.revenue),
  }
}

export function CampaignsPage() {
  const campaigns = useMarketingStore((s) => s.campaigns)
  const channels = useMarketingStore((s) => s.channels)
  const addCampaign = useMarketingStore((s) => s.addCampaign)
  const updateCampaign = useMarketingStore((s) => s.updateCampaign)
  const deleteCampaign = useMarketingStore((s) => s.deleteCampaign)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<CampaignFormData>(emptyForm(channels[0]?.id ?? ''))

  const channelById = new Map(channels.map((c) => [c.id, c]))

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm(channels[0]?.id ?? ''))
    setFormOpen(true)
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id)
    setForm(campaignToForm(c))
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
  }

  function handleSave() {
    if (!form.name.trim() || !form.channelId) return
    const payload = {
      name: form.name.trim(),
      channelId: form.channelId,
      status: form.status,
      budgetPlanned: toNumber(form.budgetPlanned),
      budgetSpent: toNumber(form.budgetSpent),
      startDate: form.startDate,
      endDate: form.endDate,
      impressions: toNumber(form.impressions),
      clicks: toNumber(form.clicks),
      leads: toNumber(form.leads),
      conversions: toNumber(form.conversions),
      revenue: toNumber(form.revenue),
    }
    if (editingId) {
      updateCampaign(editingId, payload)
    } else {
      addCampaign({
        ...payload,
        source: 'manual',
        previousPeriod: { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, spend: 0 },
      })
    }
    closeForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-50">Кампании</h1>
          <p className="text-sm text-ink-500 mt-1">Бюджет, расход и ключевые показатели по каждой кампании</p>
        </div>
        <Button onClick={openCreate} disabled={channels.length === 0}>
          <Plus className="size-4" /> Добавить кампанию
        </Button>
      </div>

      {formOpen && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-ink-100">{editingId ? 'Редактировать кампанию' : 'Новая кампания'}</div>
            <button onClick={closeForm} aria-label="Закрыть" className="text-ink-500 hover:text-ink-200">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Название">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Канал">
              <Select value={form.channelId} onValueChange={(v) => setForm((f) => ({ ...f, channelId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите канал" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Статус">
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CampaignStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="План бюджета, ₽">
              <Input inputMode="decimal" value={form.budgetPlanned} onChange={(e) => setForm((f) => ({ ...f, budgetPlanned: e.target.value }))} />
            </Field>
            <Field label="Расход, ₽">
              <Input inputMode="decimal" value={form.budgetSpent} onChange={(e) => setForm((f) => ({ ...f, budgetSpent: e.target.value }))} />
            </Field>
            <Field label="Выручка, ₽">
              <Input inputMode="decimal" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
            </Field>
            <Field label="Показы">
              <Input inputMode="decimal" value={form.impressions} onChange={(e) => setForm((f) => ({ ...f, impressions: e.target.value }))} />
            </Field>
            <Field label="Клики">
              <Input inputMode="decimal" value={form.clicks} onChange={(e) => setForm((f) => ({ ...f, clicks: e.target.value }))} />
            </Field>
            <Field label="Лиды">
              <Input inputMode="decimal" value={form.leads} onChange={(e) => setForm((f) => ({ ...f, leads: e.target.value }))} />
            </Field>
            <Field label="Конверсии">
              <Input inputMode="decimal" value={form.conversions} onChange={(e) => setForm((f) => ({ ...f, conversions: e.target.value }))} />
            </Field>
            <Field label="Дата начала">
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </Field>
            <Field label="Дата окончания">
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Button variant="outline" onClick={closeForm}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.channelId}>
              Сохранить
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns.length === 0 && (
          <Card className="p-8 text-center text-sm text-ink-500">Пока нет ни одной кампании — добавьте вручную или импортируйте CSV в Настройках.</Card>
        )}
        {campaigns.map((c) => {
          const ctr = calculateCTR(c.clicks, c.impressions)
          const cpc = calculateCPC(c.budgetSpent, c.clicks)
          const cpl = calculateCPL(c.budgetSpent, c.leads)
          const roas = calculateROAS(c.revenue, c.budgetSpent)
          const romi = calculateROMI(c.revenue, c.budgetSpent)
          const channel = channelById.get(c.channelId)
          const utilizationPct = c.budgetPlanned > 0 ? (c.budgetSpent / c.budgetPlanned) * 100 : null

          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-50">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-ink-500">{channel?.name ?? 'Без канала'}</span>
                    <SourceBadge source={c.source} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Редактировать">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)} aria-label="Удалить">
                    <Trash2 className="size-4 text-negative-500" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                <Metric label="Бюджет" value={`${formatCurrency(c.budgetSpent)} / ${formatCurrency(c.budgetPlanned)}`} sub={utilizationPct !== null ? formatPercent(utilizationPct) : undefined} warn={utilizationPct !== null && utilizationPct > 100} />
                <Metric label="CTR" value={ctr !== null ? formatPercent(ctr) : '—'} />
                <Metric label="CPC" value={cpc !== null ? formatCurrency(cpc) : '—'} />
                <Metric label="CPL" value={cpl !== null ? formatCurrency(cpl) : '—'} />
                <Metric label="Лиды" value={String(c.leads)} />
                <Metric label="ROAS" value={roas !== null ? `${roas.toFixed(2)}×` : '—'} />
                <Metric label="ROMI" value={romi !== null ? formatPercent(romi) : '—'} negative={romi !== null && romi < 0} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Metric({ label, value, sub, negative, warn }: { label: string; value: string; sub?: string; negative?: boolean; warn?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={negative ? 'font-medium text-negative-500' : 'font-medium text-ink-100'}>{value}</div>
      {sub && <div className={warn ? 'text-[11px] text-negative-500' : 'text-[11px] text-ink-500'}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    active: 'text-positive-500 bg-positive-500/10 border-positive-500/25',
    paused: 'text-warning-500 bg-warning-500/10 border-warning-500/25',
    completed: 'text-ink-400 bg-ink-800 border-ink-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  )
}

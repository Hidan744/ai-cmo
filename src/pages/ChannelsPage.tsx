import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { CATEGORICAL, CHART_CHROME } from '@/lib/chartColors'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { CHANNEL_TYPE_LABELS } from '@/types/marketing'
import { useMarketingStore } from '@/store/marketingStore'
import { useMarketingFacts } from '@/hooks/useMarketingFacts'
import { calculateCTR } from '@/lib/marketing/formulas'

export function ChannelsPage() {
  const channels = useMarketingStore((s) => s.channels)
  const campaigns = useMarketingStore((s) => s.campaigns)
  const facts = useMarketingFacts()

  const rows = [...facts.channelFacts].sort((a, b) => (b.romiPct ?? -Infinity) - (a.romiPct ?? -Infinity))
  const chartData = rows.map((r) => ({ name: r.channelName, ROMI: r.romiPct !== null ? Math.round(r.romiPct) : 0 }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-50">Каналы</h1>
        <p className="text-sm text-ink-500 mt-1">Сравнение каналов по ROMI, CAC и CTR — видно, что работает, а что нет</p>
      </div>

      <Card className="p-5">
        <div className="text-sm font-medium text-ink-200 mb-4">ROMI по каналам, %</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART_CHROME.mutedInk, fontSize: 12 }} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} />
            <YAxis tick={{ fill: CHART_CHROME.mutedInk, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={56} />
            <Tooltip
              contentStyle={{ background: '#0b1826', border: '1px solid #1f3450', borderRadius: 12, fontSize: 12 }}
              formatter={(value) => [`${value}%`, 'ROMI']}
            />
            <Bar dataKey="ROMI" fill={CATEGORICAL.slot7} radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="space-y-3">
        {rows.map((r, i) => {
          const channel = channels.find((c) => c.id === r.channelId)
          const channelCampaigns = campaigns.filter((c) => c.channelId === r.channelId)
          const totalClicks = channelCampaigns.reduce((sum, c) => sum + c.clicks, 0)
          const totalImpressions = channelCampaigns.reduce((sum, c) => sum + c.impressions, 0)
          const ctr = calculateCTR(totalClicks, totalImpressions)

          return (
            <Card key={r.channelId} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-600 font-medium">#{i + 1}</span>
                  <span className="text-sm font-semibold text-ink-50">{r.channelName}</span>
                  {!channel?.isActive && (
                    <span className="text-[11px] text-ink-500 bg-ink-800 border border-ink-700 rounded-full px-2 py-0.5">неактивен</span>
                  )}
                </div>
                <span className="text-xs text-ink-500">{channel ? CHANNEL_TYPE_LABELS[channel.type] : ''}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                <Metric label="Расход" value={formatCurrency(r.spend)} />
                <Metric label="Выручка" value={formatCurrency(r.revenue)} />
                <Metric label="ROAS" value={r.roas !== null ? `${r.roas.toFixed(2)}×` : '—'} />
                <Metric label="ROMI" value={r.romiPct !== null ? formatPercent(r.romiPct) : '—'} negative={r.romiPct !== null && r.romiPct < 0} />
                <Metric label="CTR" value={ctr !== null ? formatPercent(ctr) : '—'} />
              </div>
            </Card>
          )
        })}
        {rows.length === 0 && <Card className="p-8 text-center text-sm text-ink-500">Пока нет каналов с данными.</Card>}
      </div>
    </div>
  )
}

function Metric({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={negative ? 'font-medium text-negative-500' : 'font-medium text-ink-100'}>{value}</div>
    </div>
  )
}

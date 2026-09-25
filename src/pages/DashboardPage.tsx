import { CheckCircle2, Percent, Target, Users, Wallet } from 'lucide-react'
import { KpiCard } from '@/features/dashboard/KpiCard'
import { RecommendationCard } from '@/features/dashboard/RecommendationCard'
import { MarketingHealthPanel, type MarketingHealthStatus } from '@/features/dashboard/MarketingHealthPanel'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useMarketingStore } from '@/store/marketingStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useMarketingFacts } from '@/hooks/useMarketingFacts'
import { calculateConversionRate } from '@/lib/marketing/formulas'

export function DashboardPage() {
  const profile = useMarketingStore((s) => s.profile)
  const recommendations = useRecommendations()
  const facts = useMarketingFacts()

  if (!profile) return null

  const criticalCount = recommendations.filter((r) => r.severity === 'critical').length
  const warningCount = recommendations.filter((r) => r.severity === 'warning').length
  const healthStatus: MarketingHealthStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'attention' : 'stable'
  const conversionRatePct = calculateConversionRate(facts.totals.conversions, facts.totals.clicks)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-50">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">{profile.companyName} · {profile.niche}</p>
      </div>

      {/* Рекомендации — герой дашборда: продукт говорит «вот что делать», а не только показывает цифры. */}
      <div>
        <h2 className="text-sm font-semibold text-ink-200 mb-3">Рекомендации</h2>
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        ) : (
          <Card className="p-5 flex items-center gap-3 border-positive-500/30 bg-positive-500/10">
            <CheckCircle2 className="size-5 text-positive-500 shrink-0" />
            <p className="text-sm text-ink-100">
              Явных проблем не найдено. Все кампании держат стоимость лида и ROMI в норме.
            </p>
          </Card>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Расход"
          value={formatCurrency(facts.totals.spend)}
          tooltip="Суммарный расход по всем кампаниям за текущий период."
          icon={<Wallet className="size-4 text-ink-500" />}
        />
        <KpiCard
          label="Выручка, атрибутированная маркетингу"
          value={formatCurrency(facts.totals.revenue)}
          tooltip="Суммарная выручка, привязанная к кампаниям — из CRM или введённая вручную."
        />
        <KpiCard
          label="Blended ROAS"
          value={facts.blendedRoas !== null ? `${facts.blendedRoas.toFixed(2)}×` : '—'}
          tooltip="Суммарная атрибутированная выручка / суммарный расход по всем кампаниям."
          accent={facts.blendedRoas !== null ? (facts.blendedRoas >= 1 ? 'positive' : 'negative') : 'neutral'}
        />
        <KpiCard
          label="Blended CAC"
          value={facts.blendedCac !== null ? formatCurrency(facts.blendedCac) : '—'}
          tooltip="Суммарный расход / количество новых клиентов (конверсий) по всем кампаниям."
          icon={<Users className="size-4 text-ink-500" />}
        />
        <KpiCard
          label="Лиды"
          value={String(facts.totals.leads)}
          tooltip="Суммарное количество лидов по всем кампаниям за период."
          icon={<Target className="size-4 text-ink-500" />}
        />
        <KpiCard
          label="Конверсия из кликов"
          value={conversionRatePct !== null ? formatPercent(conversionRatePct) : '—'}
          tooltip="Конверсии / клики по всем кампаниям."
          icon={<Percent className="size-4 text-ink-500" />}
        />
        <KpiCard
          label="Blended ROMI"
          value={facts.blendedRomiPct !== null ? formatPercent(facts.blendedRomiPct) : '—'}
          tooltip="(Выручка − расход) / расход по всем кампаниям."
          accent={facts.blendedRomiPct !== null ? (facts.blendedRomiPct >= 0 ? 'positive' : 'negative') : 'neutral'}
        />
        <KpiCard
          label="Освоение бюджета"
          value={facts.budgetUtilizationPct !== null ? formatPercent(facts.budgetUtilizationPct) : '—'}
          tooltip="Потрачено / запланировано по всем кампаниям."
          accent={facts.budgetUtilizationPct !== null && facts.budgetUtilizationPct > 100 ? 'negative' : 'neutral'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MarketingHealthPanel
            status={healthStatus}
            blendedRoas={facts.blendedRoas}
            blendedRomiPct={facts.blendedRomiPct}
            budgetUtilizationPct={facts.budgetUtilizationPct}
            criticalCount={criticalCount}
            warningCount={warningCount}
          />
        </div>

        <Card className="p-6 flex flex-col">
          <div className="text-sm font-medium text-ink-200 mb-3">Каналы по ROMI</div>
          <ol className="space-y-2.5 text-sm flex-1">
            {[...facts.channelFacts]
              .filter((c) => c.romiPct !== null)
              .sort((a, b) => (b.romiPct as number) - (a.romiPct as number))
              .slice(0, 5)
              .map((c, i) => (
                <li key={c.channelId} className="flex items-center justify-between gap-2">
                  <span className="text-ink-400 truncate">
                    {i + 1}. {c.channelName}
                  </span>
                  <span className={c.romiPct !== null && c.romiPct >= 0 ? 'text-positive-500 font-medium' : 'text-negative-500 font-medium'}>
                    {formatPercent(c.romiPct as number)}
                  </span>
                </li>
              ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecommendationCard } from '@/features/dashboard/RecommendationCard'
import { useMarketingStore } from '@/store/marketingStore'
import { useRecommendations } from '@/hooks/useRecommendations'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })
}

/**
 * «Утренний брифинг» — тот же приём, что и DailyDigestModal у Business Financial OS:
 * всплывает не чаще раза в календарный день (сравнение с датой в localStorage, а не с
 * состоянием сессии — переживает перезагрузку страницы в тот же день), показывает топ-3
 * рекомендации из того же движка, что и hero-лента на Dashboard.
 */
export function MorningBriefingModal() {
  const hasHydrated = useMarketingStore((s) => s.hasHydrated)
  const onboardingComplete = useMarketingStore((s) => s.onboardingComplete)
  const companyName = useMarketingStore((s) => s.profile?.companyName)
  const digestLastSeen = useMarketingStore((s) => s.digestLastSeen)
  const markDigestSeen = useMarketingStore((s) => s.markDigestSeen)
  const recommendations = useRecommendations()

  const today = todayStr()
  const shouldShow = hasHydrated && onboardingComplete && recommendations.length > 0 && digestLastSeen !== today

  if (!shouldShow) return null

  function close() {
    markDigestSeen(today)
  }

  const top = recommendations.slice(0, 3)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80" onClick={close} />
      <div className="relative w-full max-w-[600px] max-h-[85vh] bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-7 py-6 border-b border-ink-800 shrink-0">
          <div className="flex gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-[11px] bg-brand-500/15 shrink-0">
              <Sparkles className="size-5 text-brand-400" />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-ink-50">Утренний брифинг</div>
              <div className="text-[13px] text-ink-500 mt-0.5">
                {companyName ?? 'Ваш маркетинг'} · {formatDateLong(today)}
              </div>
            </div>
          </div>
          <button aria-label="Закрыть" onClick={close} className="text-ink-500 hover:text-ink-200 transition-colors shrink-0">
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto scrollbar-thin space-y-3">
          <div className="text-[11.5px] font-semibold tracking-wide uppercase text-ink-500 mb-1">
            Главное, что стоит сделать сегодня
          </div>
          {top.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-7 py-4.5 border-t border-ink-800 shrink-0">
          <Button variant="outline" onClick={close}>
            Закрыть
          </Button>
          <Button asChild onClick={close}>
            <Link to="/app/dashboard">Открыть Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

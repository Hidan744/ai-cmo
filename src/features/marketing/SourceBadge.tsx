import { Database, Search, Share2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CAMPAIGN_SOURCE_LABELS, type CampaignSource } from '@/types/marketing'

const SOURCE_ICONS = {
  yandex_direct: Search,
  vk_ads: Share2,
  crm: Database,
  manual: Upload,
} as const

const SOURCE_STYLES: Record<CampaignSource, string> = {
  yandex_direct: 'text-negative-500 bg-negative-500/10 border-negative-500/25',
  vk_ads: 'text-aurora-blue-soft bg-aurora-blue/10 border-aurora-blue/25',
  crm: 'text-positive-500 bg-positive-500/10 border-positive-500/25',
  manual: 'text-ink-400 bg-ink-800 border-ink-700',
}

export function SourceBadge({ source, className }: { source: CampaignSource; className?: string }) {
  const Icon = SOURCE_ICONS[source]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
        SOURCE_STYLES[source],
        className,
      )}
    >
      <Icon className="size-3" />
      Источник: {CAMPAIGN_SOURCE_LABELS[source]}
    </span>
  )
}

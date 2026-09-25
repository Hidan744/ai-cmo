import type { ComponentType } from 'react'
import { LayoutDashboard, Megaphone, Radar, CalendarDays, Settings } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/campaigns', label: 'Кампании', icon: Megaphone },
  { to: '/app/channels', label: 'Каналы', icon: Radar },
  { to: '/app/content-plan', label: 'Контент-план', icon: CalendarDays },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
]

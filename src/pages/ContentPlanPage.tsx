import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarketingStore } from '@/store/marketingStore'
import { CONTENT_STATUS_LABELS, type ContentStatus } from '@/types/marketing'

const STATUS_STYLES: Record<ContentStatus, string> = {
  idea: 'text-ink-400 bg-ink-800 border-ink-700',
  'in-progress': 'text-warning-500 bg-warning-500/10 border-warning-500/25',
  published: 'text-positive-500 bg-positive-500/10 border-positive-500/25',
}

export function ContentPlanPage() {
  const items = useMarketingStore((s) => s.contentPlan)
  const addContentItem = useMarketingStore((s) => s.addContentItem)
  const updateContentItem = useMarketingStore((s) => s.updateContentItem)
  const deleteContentItem = useMarketingStore((s) => s.deleteContentItem)

  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [platform, setPlatform] = useState('')
  const [topic, setTopic] = useState('')

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date))

  function handleAdd() {
    if (!platform.trim() || !topic.trim()) return
    addContentItem({ date, platform: platform.trim(), topic: topic.trim(), status: 'idea' })
    setPlatform('')
    setTopic('')
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-50">Контент-план</h1>
          <p className="text-sm text-ink-500 mt-1">Публикации по датам и площадкам</p>
        </div>
        <Button onClick={() => setFormOpen((v) => !v)}>
          <Plus className="size-4" /> Добавить публикацию
        </Button>
      </div>

      {formOpen && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-ink-100">Новая публикация</div>
            <button onClick={() => setFormOpen(false)} aria-label="Закрыть" className="text-ink-500 hover:text-ink-200">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Площадка</Label>
              <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="VK, Instagram*, Блог…" />
            </div>
            <div className="space-y-1.5">
              <Label>Тема</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="О чём публикация" />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button onClick={handleAdd} disabled={!platform.trim() || !topic.trim()}>
              Добавить
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2.5">
        {sorted.length === 0 && <Card className="p-8 text-center text-sm text-ink-500">Пока нет публикаций в плане.</Card>}
        {sorted.map((item) => (
          <Card key={item.id} className="p-4 flex items-center gap-3 flex-wrap">
            <div className="text-xs text-ink-500 w-24 shrink-0">
              {new Date(item.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs text-ink-400 w-28 shrink-0 truncate">{item.platform}</div>
            <div className="flex-1 min-w-0 text-sm text-ink-100 truncate">{item.topic}</div>
            <Select value={item.status} onValueChange={(v) => updateContentItem(item.id, { status: v as ContentStatus })}>
              <SelectTrigger className={`h-8 w-40 text-xs border ${STATUS_STYLES[item.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => deleteContentItem(item.id)} aria-label="Удалить">
              <Trash2 className="size-4 text-negative-500" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}

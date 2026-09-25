import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { BrandMark } from '@/components/icons/BrandMark'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarketingStore } from '@/store/marketingStore'
import { CHANNEL_TYPE_LABELS, GOAL_LABELS, type ChannelType, type PrimaryGoal } from '@/types/marketing'

interface FormData {
  companyName: string
  niche: string
  monthlyBudget: string
  primaryGoal: PrimaryGoal
  channelTypes: ChannelType[]
}

const INITIAL: FormData = {
  companyName: '',
  niche: '',
  monthlyBudget: '',
  primaryGoal: 'leads',
  channelTypes: ['context', 'target'],
}

const CHANNEL_TYPE_HINTS: Record<ChannelType, string> = {
  context: 'Яндекс.Директ и другая контекстная реклама по поисковым запросам',
  target: 'VK Реклама и другая таргетированная реклама в соцсетях',
  seo: 'Органический трафик из поисковиков — сайт, блог',
  smm: 'Ведение сообществ и органический контент в соцсетях',
  email: 'Рассылки по базе клиентов',
  offline: 'Наружная реклама, полиграфия, офлайн-мероприятия',
}

type StepKind = 'text' | 'number' | 'goal' | 'channels'

interface StepDef {
  key: string
  title: string
  hint?: string
  kind: StepKind
  placeholder?: string
  suffix?: string
}

const STEPS: StepDef[] = [
  { key: 'companyName', title: 'Как называется ваша компания?', kind: 'text', placeholder: 'Например, GlowLab' },
  { key: 'niche', title: 'В какой нише вы работаете?', kind: 'text', placeholder: 'Например, сеть косметологических клиник' },
  { key: 'monthlyBudget', title: 'Какой у вас месячный маркетинговый бюджет?', kind: 'number', suffix: '₽' },
  { key: 'primaryGoal', title: 'Какая у вас главная цель маркетинга?', kind: 'goal' },
  {
    key: 'channelTypes',
    title: 'Какие каналы вы используете?',
    kind: 'channels',
    hint: 'Отметьте активные — для каждого мы создадим отдельный раздел в «Каналах» и «Кампаниях».',
  },
]

function toNumber(v: string): number {
  const n = Number(v.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const completeOnboarding = useMarketingStore((s) => s.completeOnboarding)
  const loadDemo = useMarketingStore((s) => s.loadDemo)
  const [stepIndex, setStepIndex] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function toggleChannelType(type: ChannelType) {
    setData((d) => ({
      ...d,
      channelTypes: d.channelTypes.includes(type) ? d.channelTypes.filter((t) => t !== type) : [...d.channelTypes, type],
    }))
  }

  const canProceed =
    step.kind === 'text'
      ? (data[step.key as 'companyName' | 'niche'] as string).trim().length > 0
      : step.kind === 'number'
        ? data.monthlyBudget.trim().length > 0
        : step.kind === 'channels'
          ? data.channelTypes.length > 0
          : true

  async function handleNext() {
    if (!canProceed) return
    if (!isLast) {
      setStepIndex((i) => i + 1)
      return
    }
    setSubmitting(true)
    completeOnboarding(
      {
        companyName: data.companyName.trim(),
        niche: data.niche.trim(),
        monthlyBudget: toNumber(data.monthlyBudget),
        primaryGoal: data.primaryGoal,
      },
      data.channelTypes.map((type) => ({ name: CHANNEL_TYPE_LABELS[type], type, isActive: true })),
    )
    navigate('/app/dashboard')
  }

  function handleBack() {
    if (stepIndex === 0) return
    setStepIndex((i) => i - 1)
  }

  function handleSkipToDemo() {
    loadDemo()
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <header className="flex items-center justify-between px-4 lg:px-8 h-16 border-b border-ink-800">
        <div className="flex items-center gap-2">
          <BrandMark className="size-4 text-brand-400" />
          <span className="text-sm font-semibold text-ink-50">AI CMO</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSkipToDemo}>
          Пропустить и открыть демо
        </Button>
      </header>

      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
            <span>Шаг {stepIndex + 1} из {STEPS.length}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} />
        </div>

        <h1 className="text-2xl font-semibold text-ink-50 mb-2">{step.title}</h1>
        {step.hint && <p className="text-sm text-ink-400 mb-6">{step.hint}</p>}
        {!step.hint && <div className="mb-6" />}

        <div className="space-y-2">
          {step.kind === 'text' && (
            <Input
              autoFocus
              value={data[step.key as 'companyName' | 'niche'] as string}
              placeholder={step.placeholder}
              onChange={(e) => update(step.key as 'companyName' | 'niche', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
          )}

          {step.kind === 'number' && (
            <div className="relative">
              <Input
                autoFocus
                inputMode="decimal"
                value={data.monthlyBudget}
                placeholder="0"
                onChange={(e) => update('monthlyBudget', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className={step.suffix ? 'pr-10' : undefined}
              />
              {step.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">{step.suffix}</span>
              )}
            </div>
          )}

          {step.kind === 'goal' && (
            <Select value={data.primaryGoal} onValueChange={(v) => update('primaryGoal', v as PrimaryGoal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {step.kind === 'channels' && (
            <div className="grid sm:grid-cols-2 gap-2">
              {(Object.keys(CHANNEL_TYPE_LABELS) as ChannelType[]).map((type) => (
                <label
                  key={type}
                  className="flex items-start gap-2.5 rounded-xl border border-ink-800 px-3.5 py-3 cursor-pointer hover:bg-ink-900 transition-colors"
                >
                  <Checkbox checked={data.channelTypes.includes(type)} onChange={() => toggleChannelType(type)} className="mt-0.5" />
                  <span>
                    <span className="block text-sm text-ink-100">{CHANNEL_TYPE_LABELS[type]}</span>
                    <span className="block text-xs text-ink-500 mt-0.5">{CHANNEL_TYPE_HINTS[type]}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
            Назад
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || submitting}>
            {isLast ? 'Готово' : 'Далее'}
          </Button>
        </div>
      </div>
    </div>
  )
}

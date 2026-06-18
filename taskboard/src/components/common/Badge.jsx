import clsx from 'clsx'

const TONES = {
  high: 'bg-ember-100 text-ember-600',
  medium: 'bg-brass-100 text-brass-600',
  low: 'bg-jade-50 text-jade-600',
  neutral: 'bg-ink/5 text-ink-soft'
}

export default function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide', TONES[tone], className)}>
      {children}
    </span>
  )
}

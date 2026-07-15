import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { MOVEMENTS } from '../lib/types'
import type { Movement } from '../lib/types'

export function Btn({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
  const styles = {
    primary: 'bg-ink text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'border border-line bg-transparent text-ink hover:border-ink',
    danger: 'border border-line text-stone hover:border-ray-pink hover:text-ray-pink',
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-stone">{label}</span>
      <input
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink"
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  )
}

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-stone">{label}</span>
      <textarea
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink"
        rows={4}
        {...props}
      />
    </label>
  )
}

export function MovementChip({ movement, size = 'sm' }: { movement: Movement; size?: 'sm' | 'lg' }) {
  const m = MOVEMENTS[movement]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-[0.15em] ${
        size === 'lg' ? 'px-4 py-1.5 text-xs' : 'px-3 py-1 text-[10px]'
      }`}
      style={{ background: 'var(--color-mist)', color: 'var(--color-ink)' }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-stone">{children}</h2>
  )
}

export function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <img src="/brand/raysPurple.png" alt="" className="h-8 w-auto animate-pulse" />
    </div>
  )
}

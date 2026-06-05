import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MM/dd HH:mm', { locale: ko })
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

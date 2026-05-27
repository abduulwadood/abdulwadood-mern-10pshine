import { format, formatDistanceToNow, isYesterday, isToday } from 'date-fns'

export function formatDate(date) {
  if (!date) return ''
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelativeDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true })
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatReadingTime(seconds) {
  if (!seconds || seconds < 60) return '< 1 min read'
  const minutes = Math.round(seconds / 60)
  return `${minutes} min read`
}

export function formatWordCount(count) {
  if (!count) return '0 words'
  if (count < 1000) return `${count} words`
  return `${(count / 1000).toFixed(1)}k words`
}

export function truncateText(text, maxLength = 150) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  const trimmed = text.slice(0, maxLength)
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace > 0) return `${trimmed.slice(0, lastSpace)}...`
  return `${trimmed}...`
}

export function getInputMethodIcon(method) {
  const icons = { typed: '⌨️', voice: '🎤', mixed: '🎤⌨️' }
  return icons[method] || '⌨️'
}

export function getInputMethodLabel(method) {
  const labels = { typed: 'Typed', voice: 'Voice', mixed: 'Mixed' }
  return labels[method] || 'Typed'
}

export function getLanguageLabel(code) {
  const labels = { 'en-US': 'EN', 'ur-PK': 'UR', auto: 'AUTO' }
  return labels[code] || code
}

export function getNoteColorStyle(hexColor) {
  return { backgroundColor: hexColor || '#ffffff' }
}

export function capitalizeFirst(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function extractInitials(firstName, lastName) {
  const f = firstName?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.charAt(0)?.toUpperCase() || ''
  return `${f}${l}` || '?'
}

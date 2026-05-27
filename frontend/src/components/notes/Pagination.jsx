import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  }
  return pages
}

export function Pagination({ pagination, onPageChange }) {
  const { currentPage, totalPages, totalNotes, pageSize, hasNextPage, hasPrevPage } = pagination
  const from = Math.min((currentPage - 1) * pageSize + 1, totalNotes)
  const to = Math.min(currentPage * pageSize, totalNotes)
  const pageNumbers = buildPageNumbers(currentPage, totalPages)

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t border-gray-100 mt-4">
      <p className="text-sm text-gray-500">
        Showing {from}–{to} of {totalNotes} notes
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pageNumbers.map((page, i) =>
          page === '...' ? (
            <span key={`e-${i}`} className="px-2 text-gray-400 text-sm select-none">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[2rem]',
                page === currentPage && 'bg-indigo-600 border-indigo-600 hover:opacity-90'
              )}
            >
              {page}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

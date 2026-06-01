import { ChevronDown } from 'lucide-react'
import { NOTE_COLORS } from '../../constants'
import { Button } from '../ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { cn } from '../../lib/utils'

export function ColorPicker({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 flex-shrink-0">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="hidden sm:inline text-xs">Color</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-3" align="start">
        <p className="text-xs font-medium text-gray-500 mb-2">Note Color</p>
        <div className="grid grid-cols-4 gap-2">
          {NOTE_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              title={color.label}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                value === color.value
                  ? 'border-indigo-500 scale-110 shadow-md'
                  : 'border-gray-200'
              )}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

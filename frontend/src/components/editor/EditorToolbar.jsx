import { Bold, Italic, List, ListOrdered, Quote, Code } from 'lucide-react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { cn } from '../../lib/utils'

const TOOLBAR_GROUPS = [
  {
    key: 'format',
    items: [
      {
        icon: <Bold className="w-4 h-4" />,
        label: 'Bold (Ctrl+B)',
        action: e => e.chain().focus().toggleBold().run(),
        isActive: e => e.isActive('bold'),
      },
      {
        icon: <Italic className="w-4 h-4" />,
        label: 'Italic (Ctrl+I)',
        action: e => e.chain().focus().toggleItalic().run(),
        isActive: e => e.isActive('italic'),
      },
    ],
  },
  {
    key: 'headings',
    items: [
      {
        icon: <span className="text-xs font-bold leading-none">H1</span>,
        label: 'Heading 1',
        action: e => e.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: e => e.isActive('heading', { level: 1 }),
      },
      {
        icon: <span className="text-xs font-bold leading-none">H2</span>,
        label: 'Heading 2',
        action: e => e.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: e => e.isActive('heading', { level: 2 }),
      },
      {
        icon: <span className="text-xs font-bold leading-none">H3</span>,
        label: 'Heading 3',
        action: e => e.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: e => e.isActive('heading', { level: 3 }),
      },
    ],
  },
  {
    key: 'lists',
    items: [
      {
        icon: <List className="w-4 h-4" />,
        label: 'Bullet List',
        action: e => e.chain().focus().toggleBulletList().run(),
        isActive: e => e.isActive('bulletList'),
      },
      {
        icon: <ListOrdered className="w-4 h-4" />,
        label: 'Numbered List',
        action: e => e.chain().focus().toggleOrderedList().run(),
        isActive: e => e.isActive('orderedList'),
      },
    ],
  },
  {
    key: 'blocks',
    items: [
      {
        icon: <Quote className="w-4 h-4" />,
        label: 'Blockquote',
        action: e => e.chain().focus().toggleBlockquote().run(),
        isActive: e => e.isActive('blockquote'),
      },
      {
        icon: <Code className="w-4 h-4" />,
        label: 'Inline Code',
        action: e => e.chain().focus().toggleCode().run(),
        isActive: e => e.isActive('code'),
      },
    ],
  },
]

export function EditorToolbar({ editor }) {
  if (!editor) return null

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-white overflow-x-auto flex-shrink-0">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={group.key} className="flex items-center gap-0.5">
            {gi > 0 && <Separator orientation="vertical" className="h-5 mx-1" />}
            {group.items.map((tool, ti) => (
              <Tooltip key={ti}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => tool.action(editor)}
                    className={cn(
                      'h-8 w-8 p-0 flex items-center justify-center',
                      tool.isActive(editor) && 'bg-indigo-100 text-indigo-700'
                    )}
                  >
                    {tool.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

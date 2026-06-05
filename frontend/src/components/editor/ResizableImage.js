import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ResizableImageComponent from './ResizableImageComponent'

export const ResizableImage = Node.create({
  name: 'resizableImage',

  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src:   { default: null },
      alt:   { default: '' },
      title: { default: '' },
      width: { default: '480' },
      align: { default: 'center' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => ({
          src:   dom.getAttribute('src'),
          alt:   dom.getAttribute('alt') || '',
          title: dom.getAttribute('title') || '',
          width: dom.style.width?.replace('px', '') || '480',
          align: 'center',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { width = '480', align = 'center', ...rest } = HTMLAttributes

    const marginMap = {
      left:   '20px 0',
      center: '20px auto',
      right:  '20px 0 20px auto',
    }

    const style = [
      `width: ${width}px`,
      `max-width: 100%`,
      `height: auto`,
      `display: block`,
      `border-radius: 10px`,
      `box-shadow: 0 4px 20px rgba(0,0,0,0.10)`,
      `margin: ${marginMap[align] ?? '20px auto'}`,
    ].join('; ')

    return ['img', mergeAttributes(rest, { style, class: 'note-image' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})

export default ResizableImage

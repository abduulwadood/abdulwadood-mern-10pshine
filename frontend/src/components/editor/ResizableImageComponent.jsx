import { NodeViewWrapper } from '@tiptap/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

const MIN_WIDTH = 80
const MAX_WIDTH = 860

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const { src, alt = '', width = '480', align = 'center' } = node.attrs

  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startX.current = e.clientX
    startW.current = parseInt(width, 10)
  }, [width])

  useEffect(() => {
    if (!isResizing) return

    const onMove = (e) => {
      const delta = e.clientX - startX.current
      const next  = Math.round(
        Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta))
      )
      updateAttributes({ width: String(next) })
    }

    const onUp = () => setIsResizing(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizing, updateAttributes])

  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }

  return (
    <NodeViewWrapper
      contentEditable={false}
      style={{
        display: 'flex',
        justifyContent: justifyMap[align] ?? 'center',
        margin: '20px 0',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>

        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            width: `${width}px`,
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 10,
            boxShadow: selected
              ? '0 0 0 3px #6366f1, 0 6px 24px rgba(0,0,0,0.15)'
              : '0 4px 16px rgba(0,0,0,0.10)',
            cursor: isResizing ? 'ew-resize' : 'default',
            transition: isResizing ? 'none' : 'box-shadow 0.15s',
          }}
        />

        {/* Size badge while resizing */}
        {isResizing && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(17,17,27,0.85)',
            backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 11,
            fontFamily: 'monospace', letterSpacing: '0.5px',
            padding: '3px 10px', borderRadius: 5,
            pointerEvents: 'none',
          }}>
            {width}px
          </div>
        )}

        {/* Resize handle — right edge */}
        {selected && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 14, height: 44,
              background: 'linear-gradient(180deg, #818cf8, #6366f1)',
              borderRadius: 6, cursor: 'ew-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(99,102,241,0.5)',
              zIndex: 10,
            }}
          >
            <svg width="4" height="18" viewBox="0 0 4 18" fill="white" opacity="0.9">
              <circle cx="2" cy="3"  r="1.3"/>
              <circle cx="2" cy="7"  r="1.3"/>
              <circle cx="2" cy="11" r="1.3"/>
              <circle cx="2" cy="15" r="1.3"/>
            </svg>
          </div>
        )}

        {/* Alignment + size preset toolbar — shows when selected */}
        {selected && (
          <div style={{
            position: 'absolute',
            top: -42, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '5px 8px',
            background: '#0f0f1a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            zIndex: 20,
          }}>
            {[
              { value: 'left',   Icon: AlignLeft,   label: 'Left' },
              { value: 'center', Icon: AlignCenter, label: 'Center' },
              { value: 'right',  Icon: AlignRight,  label: 'Right' },
            ].map(({ value, Icon, label }) => (
              <button
                key={value}
                title={label}
                onMouseDown={(e) => { e.preventDefault(); updateAttributes({ align: value }) }}
                style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  background: align === value ? '#6366f1' : 'transparent',
                  color: align === value ? '#fff' : '#9ca3af',
                  transition: 'all 0.12s',
                }}
              >
                <Icon size={14} />
              </button>
            ))}

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

            {[
              { label: 'S', w: '200' },
              { label: 'M', w: '480' },
              { label: 'L', w: '700' },
            ].map(({ label, w }) => (
              <button
                key={w}
                title={`${w}px`}
                onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: w }) }}
                style={{
                  width: 28, height: 28, fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  background: width === w ? '#6366f1' : 'transparent',
                  color: width === w ? '#fff' : '#9ca3af',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default ResizableImageComponent

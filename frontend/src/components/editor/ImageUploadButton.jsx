import { useRef, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const MAX_SIZE_MB      = 10
const ACCEPTED_MIME    = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const TARGET_MAX_PX    = 1200
const JPEG_QUALITY     = 0.75
const TARGET_MAX_BYTES = 300_000

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > TARGET_MAX_PX || height > TARGET_MAX_PX) {
        const ratio = Math.min(TARGET_MAX_PX / width, TARGET_MAX_PX / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }

    img.src = url
  })

const ImageUploadButton = ({ editor }) => {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)

  if (!editor) return null

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF or WebP images are allowed')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`)
      return
    }

    setLoading(true)
    const tid = toast.loading('Compressing image…')

    try {
      let base64 = await compressImage(file)

      // If still over target, drop quality to 55%
      if (base64.length > TARGET_MAX_BYTES * 1.4) {
        const img2 = new Image()
        await new Promise((res) => { img2.onload = res; img2.src = base64 })
        const c = document.createElement('canvas')
        c.width  = img2.width
        c.height = img2.height
        c.getContext('2d').drawImage(img2, 0, 0)
        base64 = c.toDataURL('image/jpeg', 0.55)
      }

      toast.dismiss(tid)

      editor.chain().focus().insertContent({
        type: 'resizableImage',
        attrs: { src: base64, alt: file.name, title: file.name, width: '480', align: 'center' },
      }).run()

      toast.success(`Image inserted (${Math.round(base64.length / 1024)}kb)`)
    } catch (err) {
      toast.dismiss(tid)
      toast.error('Failed to process image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); if (!loading) inputRef.current?.click() }}
        disabled={loading}
        title="Insert image"
        className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
      </button>
    </>
  )
}

export default ImageUploadButton

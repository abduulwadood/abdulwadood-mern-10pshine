import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Trash2, Loader2, ImageOff } from 'lucide-react'
import { useGetUserImagesQuery, useDeleteImageMutation } from '../../features/images/imagesApi'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

export default function ImageLibraryDialog({ isOpen, onClose, onInsert }) {
  const { data, isLoading } = useGetUserImagesQuery(undefined, { skip: !isOpen })
  const [deleteImage] = useDeleteImageMutation()
  const [deletingId, setDeletingId] = useState(null)

  const images = data?.data?.images ?? []

  async function handleDelete(e, imageId) {
    e.stopPropagation()
    setDeletingId(imageId)
    try {
      await deleteImage(imageId).unwrap()
      toast.success('Image deleted')
    } catch {
      toast.error('Could not delete image')
    } finally {
      setDeletingId(null)
    }
  }

  function handleInsert(image) {
    onInsert(image.url, image.originalName)
    onClose()
    toast.success('Image inserted')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Library</DialogTitle>
          <DialogDescription>
            Click an image to insert it into your note.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading images…</span>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
              <ImageOff className="w-10 h-10" />
              <p className="text-sm">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {images.map((img) => (
                <div
                  key={img._id}
                  onClick={() => handleInsert(img)}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.originalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, img._id)}
                    disabled={deletingId === img._id}
                    className={cn(
                      'absolute top-1.5 right-1.5 w-6 h-6 rounded-full',
                      'bg-red-500 text-white flex items-center justify-center',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-red-600 disabled:opacity-50'
                    )}
                  >
                    {deletingId === img._id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                  </button>

                  <div className="absolute bottom-0 inset-x-0 py-1 px-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{img.originalName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import {
  useGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
} from '../../features/comments/commentsApi'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

const MAX_CHARS = 1000
const WARN_CHARS = 900

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function getInitials(user) {
  if (!user) return 'U'
  return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || 'U'
}

function CommentSkeleton() {
  return (
    <div className="cs-comment animate-pulse">
      <div className="cs-avatar" style={{ background: '#e5e4e0' }} />
      <div className="cs-body">
        <div style={{ width: '40%', height: '12px', marginBottom: '8px', background: '#e5e4e0', borderRadius: '4px' }} />
        <div style={{ width: '85%', height: '14px', background: '#e5e4e0', borderRadius: '4px' }} />
      </div>
    </div>
  )
}

function CommentItem({ comment, noteId, user }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [editComment, { isLoading: isSaving }] = useEditCommentMutation()
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation()
  const editRef = useRef(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (!editText.trim() || editText.length > MAX_CHARS) return
    try {
      await editComment({ noteId, commentId: comment._id, text: editText }).unwrap()
      setEditing(false)
      toast.success('Comment updated')
    } catch {
      toast.error('Could not update comment')
    }
  }

  async function handleDelete() {
    try {
      await deleteComment({ noteId, commentId: comment._id }).unwrap()
      toast.success('Comment deleted')
    } catch {
      toast.error('Could not delete comment')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setEditing(false); setEditText(comment.text) }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave()
  }

  return (
    <div className="cs-comment">
      <div className="cs-avatar">{getInitials(user)}</div>
      <div className="cs-body">
        <div className="cs-header">
          <span className="cs-name">{user?.firstName || 'You'}</span>
          <span className="cs-time">{timeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="cs-edited">edited</span>}
        </div>

        {editing ? (
          <div className="cs-edit-wrap">
            <textarea
              ref={editRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_CHARS}
              className="cs-textarea"
              rows={3}
            />
            <div className="cs-edit-actions">
              <span className={cn('cs-charcount', editText.length > WARN_CHARS && 'cs-charcount--warn')}>
                {editText.length}/{MAX_CHARS}
              </span>
              <button
                className="cs-action-btn cs-action-btn--cancel"
                onClick={() => { setEditing(false); setEditText(comment.text) }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                className="cs-action-btn cs-action-btn--save"
                onClick={handleSave}
                disabled={isSaving || !editText.trim()}
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="cs-text">{comment.text}</p>
        )}
      </div>

      {!editing && (
        <div className="cs-actions">
          <button
            className="cs-icon-btn cs-icon-btn--edit"
            onClick={() => setEditing(true)}
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            className="cs-icon-btn cs-icon-btn--delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete"
          >
            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CommentsSection({ noteId }) {
  const [text, setText] = useState('')
  const user = useSelector(selectCurrentUser)

  const { data, isLoading } = useGetCommentsQuery(noteId)
  const [addComment, { isLoading: isPosting }] = useAddCommentMutation()

  const comments = data?.data?.comments ?? []

  async function handlePost() {
    if (!text.trim() || text.length > MAX_CHARS) return
    try {
      await addComment({ noteId, text }).unwrap()
      setText('')
      toast.success('Comment added')
    } catch {
      toast.error('Could not add comment')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost()
  }

  return (
    <section className="cs-root">
      <div className="cs-section-header">
        <MessageSquare size={18} className="cs-section-icon" />
        <h3 className="cs-section-title">Comments</h3>
        {comments.length > 0 && (
          <span className="cs-count">{comments.length}</span>
        )}
      </div>

      <div className="cs-add-wrap">
        <div className="cs-avatar cs-avatar--you">{getInitials(user)}</div>
        <div className="cs-add-body">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            placeholder="Add a comment… (Ctrl+Enter to post)"
            rows={2}
            className="cs-textarea"
          />
          <div className="cs-add-footer">
            <span className={cn('cs-charcount', text.length > WARN_CHARS && 'cs-charcount--warn')}>
              {text.length > 0 && `${text.length} / ${MAX_CHARS}`}
            </span>
            <button
              className="cs-post-btn"
              onClick={handlePost}
              disabled={!text.trim() || text.length > MAX_CHARS || isPosting}
            >
              {isPosting
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="cs-list">
        {isLoading ? (
          <><CommentSkeleton /><CommentSkeleton /></>
        ) : comments.length === 0 ? (
          <div className="cs-empty">
            <MessageSquare size={32} strokeWidth={1.2} className="cs-empty-icon" />
            <p className="cs-empty-text">No comments yet. Add one above!</p>
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem key={c._id} comment={c} noteId={noteId} user={user} />
          ))
        )}
      </div>
    </section>
  )
}

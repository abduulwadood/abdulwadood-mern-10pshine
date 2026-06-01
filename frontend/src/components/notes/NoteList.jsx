import NoteListItem from './NoteListItem'

export function NoteList({ notes, onDelete, onPin, onArchive, onClick }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {notes.map(note => (
        <NoteListItem
          key={note._id}
          note={note}
          onDelete={onDelete}
          onPin={onPin}
          onArchive={onArchive}
          onClick={onClick}
        />
      ))}
    </div>
  )
}

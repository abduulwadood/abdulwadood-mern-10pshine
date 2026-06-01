import NoteCard from './NoteCard'

export function NoteGrid({ notes, onDelete, onPin, onArchive, onClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {notes.map(note => (
        <NoteCard
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

'use strict';

function formatAsJSON(notes, userId) {
  return {
    exportedBy: String(userId),
    exportedAt: new Date().toISOString(),
    version: '1.0',
    totalNotes: notes.length,
    notes: notes.map((note) => ({
      title: note.title,
      content: note.content,
      tags: note.tags,
      color: note.color,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      inputMethod: note.inputMethod,
      voiceLanguage: note.voiceLanguage,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })),
  };
}

function stripHTML(html) {
  return (html || '').replace(/<[^>]*>/g, '');
}

function formatAsTXT(notes) {
  return notes
    .map((note, index) => {
      const separator = '═'.repeat(50);
      return [
        separator,
        `NOTE ${index + 1}: ${note.title}`,
        separator,
        `Tags: ${note.tags?.join(', ') || 'None'}`,
        `Created: ${new Date(note.createdAt).toLocaleString()}`,
        `Input: ${note.inputMethod || 'typed'}`,
        '',
        stripHTML(note.content || ''),
        '',
      ].join('\n');
    })
    .join('\n');
}

function validateImportData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid file format');
    return { valid: false, errors };
  }

  if (!Array.isArray(data.notes)) {
    errors.push('Missing or invalid notes array');
    return { valid: false, errors };
  }

  if (data.notes.length === 0) {
    errors.push('File contains no notes');
    return { valid: false, errors };
  }

  if (data.notes.length > 500) {
    errors.push('Cannot import more than 500 notes at once');
    return { valid: false, errors };
  }

  data.notes.forEach((note, index) => {
    if (!note.title || typeof note.title !== 'string') {
      errors.push(`Note ${index + 1}: Missing or invalid title`);
    }
    if (!note.content || typeof note.content !== 'string') {
      errors.push(`Note ${index + 1}: Missing or invalid content`);
    }
  });

  return { valid: errors.length === 0, errors };
}

function formatSingleNoteAsJSON(note, userId) {
  const separator = '═'.repeat(50);
  return {
    exportedBy: String(userId),
    exportedAt: new Date().toISOString(),
    version: '1.0',
    totalNotes: 1,
    notes: [
      {
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        inputMethod: note.inputMethod,
        voiceLanguage: note.voiceLanguage,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    ],
  };
}

function formatSingleNoteAsTXT(note) {
  const separator = '═'.repeat(50);
  return [
    separator,
    `NOTE: ${note.title}`,
    separator,
    `Tags: ${note.tags?.join(', ') || 'None'}`,
    `Created: ${new Date(note.createdAt).toLocaleString()}`,
    `Updated: ${new Date(note.updatedAt).toLocaleString()}`,
    `Input Method: ${note.inputMethod || 'typed'}`,
    `Color: ${note.color || 'None'}`,
    '',
    stripHTML(note.content || ''),
    '',
    separator,
  ].join('\n');
}

module.exports = { formatAsJSON, formatAsTXT, validateImportData, formatSingleNoteAsJSON, formatSingleNoteAsTXT };

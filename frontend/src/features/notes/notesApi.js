import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../lib/baseQuery'

export const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notes', 'Note', 'Stats', 'Tags'],
  endpoints: (builder) => ({
    getNotes: builder.query({
      query: (params = {}) => ({ url: '/notes', params }),
      providesTags: ['Notes'],
    }),

    getNoteById: builder.query({
      query: (id) => ({ url: `/notes/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Note', id }],
    }),

    createNote: builder.mutation({
      query: (data) => ({ url: '/notes', method: 'POST', data }),
      invalidatesTags: ['Notes', 'Stats'],
    }),

    createVoiceNote: builder.mutation({
      query: (data) => ({ url: '/notes/voice', method: 'POST', data }),
      invalidatesTags: ['Notes', 'Stats'],
    }),

    updateNote: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/notes/${id}`, method: 'PUT', data }),
      invalidatesTags: (result, error, { id }) => ['Notes', { type: 'Note', id }],
    }),

    patchNote: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/notes/${id}`, method: 'PATCH', data }),
      invalidatesTags: (result, error, { id }) => ['Notes', { type: 'Note', id }],
    }),

    updateNoteWithVoice: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/notes/${id}/voice`, method: 'PUT', data }),
      invalidatesTags: (result, error, { id }) => ['Notes', { type: 'Note', id }],
    }),

    deleteNote: builder.mutation({
      query: (id) => ({ url: `/notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notes', 'Stats'],
    }),

    restoreNote: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/restore`, method: 'PATCH' }),
      invalidatesTags: ['Notes', 'Stats'],
    }),

    toggleArchive: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/archive`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => ['Notes', { type: 'Note', id }],
    }),

    togglePin: builder.mutation({
      query: (id) => ({ url: `/notes/${id}/pin`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => ['Notes', { type: 'Note', id }],
    }),

    addTags: builder.mutation({
      query: ({ id, tags }) => ({ url: `/notes/${id}/tags`, method: 'POST', data: { tags } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Note', id }, 'Tags'],
    }),

    removeTags: builder.mutation({
      query: ({ id, tags }) => ({ url: `/notes/${id}/tags`, method: 'DELETE', data: { tags } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Note', id }, 'Tags'],
    }),

    getNoteStats: builder.query({
      query: () => ({ url: '/notes/stats' }),
      providesTags: ['Stats'],
    }),

    getUserTags: builder.query({
      query: () => ({ url: '/notes/tags/all' }),
      providesTags: ['Tags'],
    }),

    getAllVoiceNotes: builder.query({
      query: (params = {}) => ({ url: '/notes/voice/all', params }),
      providesTags: ['Notes'],
    }),

    searchNotes: builder.query({
      query: (search) => ({ url: '/notes', params: { search } }),
      providesTags: ['Notes'],
    }),
  }),
})

export const {
  useGetNotesQuery,
  useGetNoteByIdQuery,
  useCreateNoteMutation,
  useCreateVoiceNoteMutation,
  useUpdateNoteMutation,
  usePatchNoteMutation,
  useUpdateNoteWithVoiceMutation,
  useDeleteNoteMutation,
  useRestoreNoteMutation,
  useToggleArchiveMutation,
  useTogglePinMutation,
  useAddTagsMutation,
  useRemoveTagsMutation,
  useGetNoteStatsQuery,
  useGetUserTagsQuery,
  useGetAllVoiceNotesQuery,
  useSearchNotesQuery,
} = notesApi

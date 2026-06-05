import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../lib/baseQuery'

export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Comments'],
  endpoints: (builder) => ({

    getComments: builder.query({
      query: (noteId) => ({ url: `/notes/${noteId}/comments` }),
      providesTags: (result, error, noteId) => [{ type: 'Comments', id: noteId }],
    }),

    addComment: builder.mutation({
      query: ({ noteId, text }) => ({
        url: `/notes/${noteId}/comments`,
        method: 'POST',
        data: { text },
      }),
      invalidatesTags: (result, error, { noteId }) => [{ type: 'Comments', id: noteId }],
    }),

    editComment: builder.mutation({
      query: ({ noteId, commentId, text }) => ({
        url: `/notes/${noteId}/comments/${commentId}`,
        method: 'PATCH',
        data: { text },
      }),
      invalidatesTags: (result, error, { noteId }) => [{ type: 'Comments', id: noteId }],
    }),

    deleteComment: builder.mutation({
      query: ({ noteId, commentId }) => ({
        url: `/notes/${noteId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { noteId }) => [{ type: 'Comments', id: noteId }],
    }),

  }),
})

export const {
  useGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
} = commentsApi

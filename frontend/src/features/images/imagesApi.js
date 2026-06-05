import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../lib/baseQuery'

export const imagesApi = createApi({
  reducerPath: 'imagesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Images'],
  endpoints: (builder) => ({

    getUserImages: builder.query({
      query: () => ({ url: '/images' }),
      providesTags: ['Images'],
    }),

    deleteImage: builder.mutation({
      query: (imageId) => ({
        url: `/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Images'],
    }),

  }),
})

export const {
  useGetUserImagesQuery,
  useDeleteImageMutation,
} = imagesApi

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

    uploadImage: builder.mutation({
      query: (formData) => ({
        url: '/images/upload',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      invalidatesTags: ['Images'],
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
  useUploadImageMutation,
  useDeleteImageMutation,
} = imagesApi

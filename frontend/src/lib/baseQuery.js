import axiosInstance from '../utils/axiosInstance'

export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      // axiosInstance success interceptor returns response.data already
      const result = await axiosInstance({ url, method, data, params, headers })
      return { data: result }
    } catch (err) {
      return {
        error: {
          status: err?.error?.code || err?.statusCode || 500,
          data: err?.message || 'Something went wrong',
        },
      }
    }
  }

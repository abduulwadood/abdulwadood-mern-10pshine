export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Notes App'
export const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'notes_app_access_token'
export const USER_KEY = import.meta.env.VITE_USER_KEY || 'notes_app_user'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  DASHBOARD: '/dashboard',
  NOTE_DETAIL: '/notes/:id',
  NOTE_NEW: '/notes/new',
  NOTE_EDIT: '/notes/:id/edit',
  PROFILE: '/profile',
  NOT_FOUND: '*',
}

export const VOICE_LANGUAGES = {
  ENGLISH: { code: 'en-US', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  URDU: { code: 'ur-PK', label: 'اردو', flag: '🇵🇰', dir: 'rtl' },
}

export const NOTE_COLORS = [
  { value: '#ffffff', label: 'White', tailwind: 'bg-white' },
  { value: '#fef3c7', label: 'Yellow', tailwind: 'bg-amber-100' },
  { value: '#d1fae5', label: 'Green', tailwind: 'bg-emerald-100' },
  { value: '#dbeafe', label: 'Blue', tailwind: 'bg-blue-100' },
  { value: '#fce7f3', label: 'Pink', tailwind: 'bg-pink-100' },
  { value: '#ede9fe', label: 'Purple', tailwind: 'bg-violet-100' },
  { value: '#fee2e2', label: 'Red', tailwind: 'bg-red-100' },
  { value: '#f3f4f6', label: 'Gray', tailwind: 'bg-gray-100' },
]

export const INPUT_METHODS = {
  TYPED: 'typed',
  VOICE: 'voice',
  MIXED: 'mixed',
}

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-updatedAt', label: 'Recently Updated' },
  { value: 'title', label: 'Title A-Z' },
  { value: '-title', label: 'Title Z-A' },
]

export const FILTER_OPTIONS = [
  { value: 'all', label: 'All Notes' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'archived', label: 'Archived' },
  { value: 'voice', label: 'Voice Notes' },
  { value: 'typed', label: 'Typed Notes' },
]

export const TOAST_MESSAGES = {
  NOTE_CREATED: 'Note created successfully!',
  NOTE_UPDATED: 'Note updated successfully!',
  NOTE_DELETED: 'Note deleted!',
  NOTE_RESTORED: 'Note restored!',
  NOTE_ARCHIVED: 'Note archived!',
  NOTE_UNARCHIVED: 'Note unarchived!',
  NOTE_PINNED: 'Note pinned!',
  NOTE_UNPINNED: 'Note unpinned!',
  VOICE_STARTED: 'Listening... Speak now',
  VOICE_STOPPED: 'Voice input captured',
  VOICE_ERROR: 'Voice recognition failed. Please try again.',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Account created! Check your email for OTP.',
  OTP_VERIFIED: 'Email verified! Account is active.',
  OTP_RESENT: 'New OTP sent to your email',
  PROFILE_UPDATED: 'Profile updated successfully!',
  COPY_SUCCESS: 'Copied to clipboard!',
  ERROR_GENERIC: 'Something went wrong. Please try again.',
  ERROR_NETWORK: 'Network error. Check your connection.',
  ERROR_UNAUTHORIZED: 'Session expired. Please login again.',
}

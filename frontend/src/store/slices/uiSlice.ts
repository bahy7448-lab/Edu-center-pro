import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  darkMode: boolean
  language: 'ar' | 'en'
  sidebarOpen: boolean
}

const initialState: UiState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  language: (localStorage.getItem('language') as 'ar' | 'en') ?? 'ar',
  sidebarOpen: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
      localStorage.setItem('darkMode', String(state.darkMode))
      document.documentElement.classList.toggle('dark', state.darkMode)
    },
    setLanguage(state, action: PayloadAction<'ar' | 'en'>) {
      state.language = action.payload
      localStorage.setItem('language', action.payload)
      document.dir = action.payload === 'ar' ? 'rtl' : 'ltr'
    },
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
  },
})

export const { toggleDarkMode, setLanguage, toggleSidebar } = uiSlice.actions
export default uiSlice.reducer

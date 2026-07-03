import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }
interface NotificationsState { items: Notification[]; unreadCount: number }

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 } as NotificationsState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload
      state.unreadCount = action.payload.filter(n => !n.isRead).length
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find(i => i.id === action.payload)
      if (n) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1) }
    },
    markAllRead(state) {
      state.items.forEach(n => n.isRead = true)
      state.unreadCount = 0
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload)
      if (!action.payload.isRead) state.unreadCount++
    },
  },
})

export const { setNotifications, markRead, markAllRead, addNotification } = notificationsSlice.actions
export default notificationsSlice.reducer

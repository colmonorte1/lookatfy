'use client'

import { createClient } from '@/utils/supabase/client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type NotificationRow = {
  id: string
  recipient_user_id: string | null
  target_role: 'client' | 'expert' | 'admin' | null
  type: string
  title: string
  body: string | null
  data: any | null
  status: 'unread' | 'read' | 'archived'
  created_at: string
}

type NotificationsContextValue = {
  notifications: NotificationRow[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  archive: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  markAllUnreadRead: () => Promise<void>
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const refresh = async () => {
    try {
      const res = await fetch('/api/notifications?limit=30', { cache: 'no-store' })
      const json = await res.json()
      setNotifications(Array.isArray(json.notifications) ? json.notifications : [])
    } catch {}
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new as NotificationRow
          setNotifications((prev) => [row, ...prev])
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' } as NotificationRow : n))
    )
  }

  const archive = async (id: string) => {
    await fetch(`/api/notifications/${id}/archive`, { method: 'PATCH' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'archived' } as NotificationRow : n))
    )
  }

  const remove = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const markAllUnreadRead = async () => {
    const list = notifications.filter((n) => n.status === 'unread')
    await Promise.all(list.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })))
    setNotifications((prev) => prev.map((n) => (n.status === 'unread' ? { ...n, status: 'read' } : n)))
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === 'unread').length,
    [notifications]
  )

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    markRead,
    archive,
    remove,
    markAllUnreadRead,
    refresh,
  }

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      markRead: async () => {},
      archive: async () => {},
      remove: async () => {},
      markAllUnreadRead: async () => {},
      refresh: async () => {},
    }
  }
  return ctx
}

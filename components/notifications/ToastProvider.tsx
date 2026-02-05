'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Toast = { id: string; title: string; body?: string | null }

export default function ToastProvider() {
  const supabase = useMemo(() => createClient(), [])
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('notifications-toasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as { id: string; title: string; body?: string | null }
          const toast = { id: n.id, title: n.title, body: n.body }
          setToasts((prev) => [toast, ...prev])
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
          }, 4000)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'grid', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: 'white', border: '1px solid rgb(var(--border))', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', borderRadius: 10, padding: '0.75rem 1rem', minWidth: 260 }}>
          <div style={{ fontWeight: 700 }}>{t.title}</div>
          {t.body && <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>{t.body}</div>}
        </div>
      ))}
    </div>
  )
}

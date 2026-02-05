'use client'

import { useNotifications } from '@/components/notifications/NotificationsProvider'

export default function NotificationsInbox() {
  return <InboxClient />
}

function InboxClient() {
  const { notifications, markRead, archive, remove, refresh } = useNotifications()
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Notificaciones</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button onClick={refresh} style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid rgb(var(--border))', background: 'white' }}>Actualizar</button>
      </div>
      {notifications.length === 0 && (
        <div style={{ color: 'rgb(var(--text-secondary))' }}>No hay notificaciones</div>
      )}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {notifications.map((n) => (
          <div key={n.id} style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid rgb(var(--border))', background: n.status === 'unread' ? 'rgba(0,0,0,0.02)' : 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>{n.body}</div>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {n.status !== 'read' && <button onClick={() => markRead(n.id)} style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgb(var(--border))', background: 'white' }}>Leer</button>}
                <button onClick={() => archive(n.id)} style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgb(var(--border))', background: 'white' }}>Archivar</button>
                {n.recipient_user_id && <button onClick={() => remove(n.id)} style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgb(var(--border))', background: 'white', color: '#d00000' }}>Eliminar</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

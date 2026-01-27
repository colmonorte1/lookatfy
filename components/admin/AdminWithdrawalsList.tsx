"use client";

import { Button } from '@/components/ui/Button/Button';
import { ArrowRight, Check, X } from 'lucide-react';
import { AdminWithdrawalDetail, approveWithdrawal, markWithdrawalPaid, rejectWithdrawal } from '@/app/admin/withdrawals/actions';
import { useState } from 'react';

interface Props {
  items: AdminWithdrawalDetail[];
}

export default function AdminWithdrawalsList({ items }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    await approveWithdrawal(id);
    setLoadingId(null);
  };
  const handleReject = async (id: string) => {
    setLoadingId(id);
    await rejectWithdrawal(id, 'Rechazado por riesgo');
    setLoadingId(null);
  };
  const handlePaid = async (id: string) => {
    const ref = refs[id]?.trim();
    if (!ref || ref.length < 3) return;
    setLoadingId(id);
    await markWithdrawalPaid(id, ref);
    setLoadingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', bg: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' };
      case 'approved':
        return { label: 'Aprobado', bg: 'rgba(var(--primary), 0.12)', color: 'rgb(var(--primary))' };
      case 'paid':
        return { label: 'Pagado', bg: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))' };
      case 'rejected':
        return { label: 'Rechazado', bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
      default:
        return { label: status, bg: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-secondary))' };
    }
  };

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map(({ withdrawal: w, expert, bookings, commission_rate, commission_amount, release_date_label, risk }) => (
        <div key={w.id} style={{
          background: 'rgb(var(--surface))',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgb(var(--border))',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {(expert.full_name || 'E')[0]}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{expert.full_name || expert.id}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>{expert.email || ''}</div>
              </div>
              <span style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, background: getStatusBadge(w.status).bg, color: getStatusBadge(w.status).color }}>
                {getStatusBadge(w.status).label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Monto solicitado</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCOP(Number(w.amount))}</div>
              </div>
              <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Comisión plataforma</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCOP(Number(commission_amount))} ({Math.round(commission_rate * 100)}%)</div>
              </div>
              <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Fecha de liberación</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{release_date_label}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bookings asociados</div>
            {bookings.length === 0 ? (
              <div style={{ color: 'rgb(var(--text-secondary))' }}>Sin asignación automática</div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'rgb(var(--text-secondary))' }}>{bookings.length} asociados</div>
                <Button variant="outline" size="sm" onClick={() => setOpenId(w.id)}>Ver asociados</Button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Estado de riesgo</div>
              <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div>Disputas abiertas: {risk.open_disputes}</div>
                <div>Disputas perdidas: {risk.lost_disputes}</div>
                <div>Fraude: {risk.fraud_flag ? 'Sí' : 'No'}</div>
              </div>
            </div>

            <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Método de pago</div>
              <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                {w.bank_snapshot.bank} • {w.bank_snapshot.account_type} • ****{String(w.bank_snapshot.account_number).slice(-4)}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>{w.bank_snapshot.holder_name} • {w.bank_snapshot.document_id}</div>
              {w.status === 'approved' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Referencia de transacción</label>
                  <input
                    value={refs[w.id] || ''}
                    onChange={e => setRefs(prev => ({ ...prev, [w.id]: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))' }}
                    placeholder="Ej: TRANS-12345"
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {w.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleReject(w.id)} disabled={loadingId === w.id} style={{ borderColor: 'rgb(var(--error))', color: 'rgb(var(--error))' }}>
                    <X size={16} /> Rechazar
                  </Button>
                  <Button size="sm" onClick={() => handleApprove(w.id)} disabled={loadingId === w.id}>
                    <Check size={16} /> Aprobar
                  </Button>
                </>
              )}
              {w.status === 'approved' && (
                <Button size="sm" onClick={() => handlePaid(w.id)} disabled={loadingId === w.id || !refs[w.id] || refs[w.id].trim().length < 3}>
                  Marcar Pagado
                </Button>
              )}
              {w.status === 'paid' && (
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))', fontSize: '0.85rem', fontWeight: 600 }}>Pagado</span>
              )}
              {w.status === 'rejected' && (
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))', fontSize: '0.85rem', fontWeight: 600 }}>Rechazado</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>No hay solicitudes pendientes.</div>
      )}
    </div>

    {openId && (() => {
      const item = items.find(i => i.withdrawal.id === openId);
      const list = item?.bookings || [];
      const total = list.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="withdrawal-bookings-title" style={{ width: 'min(720px, 92vw)', maxHeight: '80vh', overflow: 'auto', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 id="withdrawal-bookings-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bookings que cubren el retiro</h3>
              <Button variant="outline" size="sm" onClick={() => setOpenId(null)}>Cerrar</Button>
            </div>
            {list.length === 0 ? (
              <div style={{ color: 'rgb(var(--text-secondary))' }}>No hay bookings asociados.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {list.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ArrowRight size={16} />
                      <span>{b.service_title || 'Servicio'}</span>
                      <span style={{ color: 'rgb(var(--text-secondary))', marginLeft: '0.5rem' }}>{b.user_full_name || ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                      <span>{b.date_label}</span>
                      {b.time && <span>{b.time}</span>}
                      <span>{formatCOP(b.price)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed rgb(var(--border))', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
                {item?.withdrawal.status === 'paid' && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', color: 'rgb(var(--text-secondary))' }}>
                    <span>Pagado el</span>
                    <span>{item.withdrawal.processed_at ? new Date(item.withdrawal.processed_at).toLocaleString('es-CO') : '—'}</span>
                  </div>
                )}
                {item?.withdrawal.transaction_ref && (
                  <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', color: 'rgb(var(--text-secondary))' }}>
                    <span>Ref</span>
                    <span>{item.withdrawal.transaction_ref}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    })()}
    </>
  );
}

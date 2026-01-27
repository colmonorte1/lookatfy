"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { getCountries, getAdminServices, createAdminService, toggleAdminServiceActive, deleteAdminService, getCurrentRole } from './adminActions';

type Country = { code: string; name: string };
type AdminService = { id: string; name: string; description?: string | null; price: number; country_code?: string | null; active: boolean; recording_enabled?: boolean };

export default function AdminServicesClient() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [items, setItems] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string; price: string; country_code: string; active: boolean; recording_enabled: boolean }>({ name: '', description: '', price: '', country_code: '', active: true, recording_enabled: false });
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [cs, svcs, rinfo] = await Promise.all([getCountries(), getAdminServices(), getCurrentRole()]);
      setCountries((cs || []).map((c: any) => ({ code: c.code, name: c.name })));
      setItems((svcs || []).map((s: any) => ({ id: s.id, name: s.name, description: s.description, price: Number(s.price || 0), country_code: s.country_code, active: !!s.active, recording_enabled: !!s.recording_enabled })));
      setRole((rinfo as any)?.role ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return alert('Nombre requerido');
    const priceNum = Number(form.price);
    if (Number.isNaN(priceNum) || priceNum <= 0) return alert('Precio inválido');
    setSaving(true);
    try {
      const res = await createAdminService({ name: form.name.trim(), description: form.description?.trim() || undefined, price: priceNum, country_code: form.country_code || undefined, active: form.active, recording_enabled: form.recording_enabled });
      if ((res as any)?.error) alert((res as any).error);
      else {
        setForm({ name: '', description: '', price: '', country_code: '', active: true, recording_enabled: false });
        await load();
      }
    } catch (e) {
      alert('Error al crear servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await toggleAdminServiceActive(id, !active);
    if ((res as any)?.error) alert((res as any).error);
    else await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar servicio?')) return;
    const res = await deleteAdminService(id);
    if ((res as any)?.error) alert((res as any).error);
    else await load();
  };

  return (
    <div>
      {role !== 'admin' && (
        <div style={{ background: 'rgba(var(--warning), 0.12)', border: '1px solid rgba(var(--warning), 0.3)', color: 'rgb(var(--warning))', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          Necesitas permisos de administrador para crear o modificar servicios de plataforma.
        </div>
      )}
      <div style={{ display: 'grid',  gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Crear Servicio de Plataforma</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Nombre" name="name" value={form.name} onChange={handleChange} placeholder="Ej. Consulta inicial" />
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Breve descripción" style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))', color: 'rgb(var(--text-main))' }} />
            </div>
            <Input label="Precio" type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" />
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>País</label>
              <select name="country_code" value={form.country_code} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))', color: 'rgb(var(--text-main))' }} aria-label="Seleccionar país">
                <option value="">Todos</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              Activo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" name="recording_enabled" checked={form.recording_enabled} onChange={handleChange} />
              Este servicio habilita grabación (recording)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleCreate} isLoading={saving} disabled={saving || role !== 'admin'}>
                {saving ? 'Creando...' : 'Crear Servicio'}
              </Button>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Servicios de Plataforma</h2>
          <div style={{ border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                  <th style={{ padding: '0.75rem' }}>Nombre</th>
                  <th style={{ padding: '0.75rem' }}>Precio</th>
                  <th style={{ padding: '0.75rem' }}>País</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem' }}>Recording</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>Cargando...</td></tr>
                )}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>No hay servicios de plataforma.</td></tr>
                )}
                {!loading && items.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '0.75rem' }}>{s.price.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>{s.country_code || 'Todos'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600, background: s.active ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)', color: s.active ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
                        {s.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem', background: s.recording_enabled ? 'rgba(var(--primary), 0.1)' : 'rgba(var(--surface-hover), 1)', color: s.recording_enabled ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))' }}>
                        {s.recording_enabled ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button size="sm" variant="outline" onClick={() => handleToggle(s.id, s.active)} disabled={role !== 'admin'}>
                          {s.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} disabled={role !== 'admin'}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

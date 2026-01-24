"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { createBank, updateBank, deleteBank, BankAccount, ActionResult } from '@/app/expert/banks/actions';
import { Edit2, Trash2, Save, Plus } from 'lucide-react';

interface Props {
  initialBanks: BankAccount[];
}

export default function BanksManager({ initialBanks }: Props) {
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BankAccount, 'id' | 'expert_id' | 'created_at'>>({
    bank: '', account_type: '', account_number: '', holder_name: '', document_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => setForm({ bank: '', account_type: '', account_number: '', holder_name: '', document_id: '' });

  const handleCreate = async () => {
    if (!form.bank.trim() || !form.account_number.trim() || !form.holder_name.trim() || !form.document_id.trim() || !form.account_type.trim()) return;
    setIsSaving(true);
    const res: ActionResult = await createBank(form);
    setIsSaving(false);
    if ('error' in res) return;
    // Refresh list via server revalidation is async; optimistically update
    const tmp: BankAccount = {
      id: crypto.randomUUID(), expert_id: 'me', created_at: new Date().toISOString(), ...form
    } as BankAccount;
    setBanks(prev => [tmp, ...prev]);
    resetForm();
  };

  const startEdit = (b: BankAccount) => {
    setEditingId(b.id);
    setForm({
      bank: b.bank,
      account_type: b.account_type,
      account_number: b.account_number,
      holder_name: b.holder_name,
      document_id: b.document_id,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setIsSaving(true);
    const res: ActionResult = await updateBank(editingId, form);
    setIsSaving(false);
    if ('error' in res) return;
    setBanks(prev => prev.map(b => b.id === editingId ? { ...b, ...form } as BankAccount : b));
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    const res: ActionResult = await deleteBank(id);
    setIsSaving(false);
    if ('error' in res) return;
    setBanks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        background: 'rgb(var(--surface))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Banco</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Input label="Banco" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
          <Input label="Tipo de cuenta" value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })} />
          <Input label="Número de cuenta" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
          <Input label="Titular" value={form.holder_name} onChange={e => setForm({ ...form, holder_name: e.target.value })} />
          <Input label="Documento" value={form.document_id} onChange={e => setForm({ ...form, document_id: e.target.value })} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <Button onClick={handleCreate} disabled={isSaving} style={{ gap: '0.5rem' }}>
            <Plus size={16} /> Añadir Banco
          </Button>
        </div>
      </div>

      <div style={{
        background: 'rgb(var(--surface))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Mis Bancos</h3>
        {banks.length === 0 && (
          <div style={{ color: 'rgb(var(--text-secondary))' }}>Aún no has añadido bancos.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {banks.map((b) => (
            <div key={b.id} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              alignItems: 'center',
              border: '1px solid rgb(var(--border))',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem'
            }}>
              {editingId === b.id ? (
                <>
                  <Input label="Banco" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                  <Input label="Tipo de cuenta" value={form.account_type} onChange={e => setForm({ ...form, account_type: e.target.value })} />
                  <Input label="Número de cuenta" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
                  <Input label="Titular" value={form.holder_name} onChange={e => setForm({ ...form, holder_name: e.target.value })} />
                  <Input label="Documento" value={form.document_id} onChange={e => setForm({ ...form, document_id: e.target.value })} />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="primary" size="sm" onClick={handleUpdate} disabled={isSaving} style={{ gap: '0.5rem' }}>
                      <Save size={16} /> Guardar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(null); resetForm(); }}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div><strong>{b.bank}</strong></div>
                  <div>{b.account_type}</div>
                  <div>{b.account_number}</div>
                  <div>{b.holder_name}</div>
                  <div>{b.document_id}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(b)} title="Editar">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} title="Eliminar" style={{ color: 'rgb(var(--error))' }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

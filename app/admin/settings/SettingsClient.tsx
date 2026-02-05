"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Settings, Save, DollarSign, Shield, Bell, Globe, Plus, Trash2, MapPin, Tag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import { getPlatformSettings, updatePlatformSettings, getMasterData, addCountry, deleteCountry, addCurrency, deleteCurrency, addCategory, deleteCategory, addServiceType, deleteServiceType, updateServiceType } from './actions';
import { Input } from '@/components/ui/Input/Input';

type FeedbackType = { type: 'success' | 'error'; message: string } | null;

export default function SettingsClient() {
    const [settings, setSettings] = useState({
        platformFee: 10,
        minWithdrawal: 50000,
        currency: 'COP',
        autoApproveServices: false,
        autoVerifyExperts: false,
        supportEmail: '',
        notifyDisputes: true,
        notifyNewExperts: true
    });

    const [countries, setCountries] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<FeedbackType>(null);

    // Modal States
    const [countryModalOpen, setCountryModalOpen] = useState(false);
    const [newCountry, setNewCountry] = useState({ code: '', name: '' });

    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' });

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon: '' });

    const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
    const [editServiceTypeId, setEditServiceTypeId] = useState<string | null>(null);
    const [newServiceType, setNewServiceType] = useState({ name: '', slug: '' });

    const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-hide feedback after 4 seconds
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const settingsData = await getPlatformSettings();
            if (settingsData) {
                setSettings(prev => ({
                    ...prev,
                    platformFee: settingsData.commission_percentage || 10,
                    minWithdrawal: settingsData.min_withdrawal || 50000,
                    currency: settingsData.currency || 'COP',
                    autoApproveServices: settingsData.auto_approve_services || false,
                    autoVerifyExperts: settingsData.auto_verify_experts || false,
                    supportEmail: settingsData.support_email || 'soporte@lookatfy.com'
                }));
            }

            const masterData = await getMasterData();
            if (masterData) {
                setCountries(masterData.countries);
                setCurrencies(masterData.currencies);
                setCategories(masterData.categories);
                setServiceTypes(masterData.service_types);
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Error al cargar la configuración' });
        }
        setIsLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleToggle = (name: string) => {
        setSettings(prev => ({
            ...prev,
            [name]: !prev[name as keyof typeof prev]
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updatePlatformSettings(settings);
            if (res.error) {
                setFeedback({ type: 'error', message: 'Error al guardar: ' + res.error });
            } else {
                setFeedback({ type: 'success', message: 'Configuración guardada correctamente' });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Error al guardar cambios' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Country Actions ---
    const handleAddCountry = async () => {
        if (!newCountry.code || !newCountry.name) {
            setFeedback({ type: 'error', message: 'Completa todos los campos del país' });
            return;
        }
        const res = await addCountry(newCountry);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'País agregado correctamente' });
            setCountryModalOpen(false);
            setNewCountry({ code: '', name: '' });
            loadData();
        }
    };

    const handleDeleteCountry = async (code: string) => {
        const res = await deleteCountry(code);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'País eliminado' });
            loadData();
        }
        setDeleteConfirm(null);
    };

    // --- Currency Actions ---
    const handleAddCurrency = async () => {
        if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) {
            setFeedback({ type: 'error', message: 'Completa todos los campos de la moneda' });
            return;
        }
        const res = await addCurrency(newCurrency);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'Moneda agregada correctamente' });
            setCurrencyModalOpen(false);
            setNewCurrency({ code: '', name: '', symbol: '' });
            loadData();
        }
    };

    const handleDeleteCurrency = async (code: string) => {
        const res = await deleteCurrency(code);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'Moneda eliminada' });
            loadData();
        }
        setDeleteConfirm(null);
    };

    // --- Category Actions ---
    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.slug) {
            setFeedback({ type: 'error', message: 'Nombre y Slug son requeridos' });
            return;
        }
        const res = await addCategory(newCategory);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'Categoría agregada correctamente' });
            setCategoryModalOpen(false);
            setNewCategory({ name: '', slug: '', icon: '' });
            loadData();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const res = await deleteCategory(id);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'Categoría eliminada' });
            loadData();
        }
        setDeleteConfirm(null);
    };

    // --- Service Type Actions ---
    const handleSaveServiceType = async () => {
        if (!newServiceType.name) {
            setFeedback({ type: 'error', message: 'Nombre requerido' });
            return;
        }
        const res = editServiceTypeId
            ? await updateServiceType(editServiceTypeId, newServiceType)
            : await addServiceType(newServiceType);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: editServiceTypeId ? 'Tipo actualizado' : 'Tipo agregado' });
            setServiceTypeModalOpen(false);
            setEditServiceTypeId(null);
            setNewServiceType({ name: '', slug: '' });
            loadData();
        }
    };

    const handleDeleteServiceType = async (id: string) => {
        const res = await deleteServiceType(id);
        if (res.error) {
            setFeedback({ type: 'error', message: res.error });
        } else {
            setFeedback({ type: 'success', message: 'Tipo de servicio eliminado' });
            loadData();
        }
        setDeleteConfirm(null);
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Settings size={32} />
                        Configuración de Plataforma
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'rgb(var(--text-secondary))' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '1rem' }}>Cargando configuración...</span>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Feedback Toast */}
            {feedback && (
                <div style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 100,
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: feedback.type === 'success' ? 'rgb(var(--success))' : 'rgb(var(--error))',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: 'slideIn 0.3s ease'
                }}>
                    {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {feedback.message}
                </div>
            )}
            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Confirmar eliminación</h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem' }}>
                            ¿Estás seguro de eliminar <strong>{deleteConfirm.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                            <Button
                                style={{ background: 'rgb(var(--error))', color: 'white' }}
                                onClick={() => {
                                    if (deleteConfirm.type === 'country') handleDeleteCountry(deleteConfirm.id);
                                    else if (deleteConfirm.type === 'currency') handleDeleteCurrency(deleteConfirm.id);
                                    else if (deleteConfirm.type === 'category') handleDeleteCategory(deleteConfirm.id);
                                    else if (deleteConfirm.type === 'serviceType') handleDeleteServiceType(deleteConfirm.id);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Settings size={32} />
                    Configuración de Plataforma
                </h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} /> : <Save size={18} style={{ marginRight: '0.5rem' }} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <Tabs defaultValue="business">
                <TabsList>
                    <TabsTrigger value="business">Reglas de Negocio</TabsTrigger>
                    <TabsTrigger value="master-data">Países, Monedas, Categorías y Tipos</TabsTrigger>
                </TabsList>

                <TabsContent value="business">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '1rem' }}>

                        {/* Financial Settings */}
                        <div style={{ background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--success), 0.1)', borderRadius: '8px', color: 'rgb(var(--success))' }}>
                                    <DollarSign size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Finanzas y Monetización</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Comisión de Plataforma (%)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            name="platformFee"
                                            value={settings.platformFee}
                                            onChange={handleChange}
                                            min={0}
                                            max={100}
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--background))', color: 'rgb(var(--text-main))', width: '100px'
                                            }}
                                        />
                                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>por transacción exitosa</span>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Monto Mínimo de Retiro</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            name="minWithdrawal"
                                            value={settings.minWithdrawal}
                                            onChange={handleChange}
                                            min={0}
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--background))', color: 'rgb(var(--text-main))', width: '120px'
                                            }}
                                        />
                                        <select
                                            name="currency"
                                            value={settings.currency}
                                            onChange={handleChange}
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--background))', color: 'rgb(var(--text-main))'
                                            }}
                                        >
                                            {/* Default options + dynamic from DB */}
                                            <option value="COP">COP - Peso Colombiano</option>
                                            <option value="USD">USD - Dólar</option>
                                            {currencies
                                                .filter(c => !['COP', 'USD'].includes(c.code))
                                                .map(c => (
                                                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Moderation & Security */}
                        <div style={{ background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--warning), 0.1)', borderRadius: '8px', color: 'rgb(var(--warning))' }}>
                                    <Shield size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Moderación y Reglas</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Aprobación Automática de Servicios</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>Publicar servicios sin revisión manual.</div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle('autoApproveServices')}
                                        style={{
                                            width: '48px', height: '24px', borderRadius: '12px',
                                            background: settings.autoApproveServices ? 'rgb(var(--success))' : 'rgb(var(--border))',
                                            position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                                            position: 'absolute', top: '3px', left: settings.autoApproveServices ? '27px' : '3px',
                                            transition: 'left 0.3s'
                                        }} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Verificación Automática de Expertos</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>No requerir validación de identidad.</div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle('autoVerifyExperts')}
                                        style={{
                                            width: '48px', height: '24px', borderRadius: '12px',
                                            background: settings.autoVerifyExperts ? 'rgb(var(--success))' : 'rgb(var(--border))',
                                            position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                                            position: 'absolute', top: '3px', left: settings.autoVerifyExperts ? '27px' : '3px',
                                            transition: 'left 0.3s'
                                        }} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications & Support */}
                        <div style={{ background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--primary), 0.1)', borderRadius: '8px', color: 'rgb(var(--primary))' }}>
                                    <Bell size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Notificaciones de Admin</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyDisputes}
                                        onChange={() => handleToggle('notifyDisputes')}
                                        style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--primary))' }}
                                    />
                                    <span>Notificar nuevas disputas por email</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyNewExperts}
                                        onChange={() => handleToggle('notifyNewExperts')}
                                        style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--primary))' }}
                                    />
                                    <span>Notificar nuevos registros de expertos</span>
                                </label>
                            </div>
                        </div>

                        {/* General Info */}
                        <div style={{ background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--info), 0.1)', borderRadius: '8px', color: 'rgb(var(--info))' }}>
                                    <Globe size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Información General</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Email de Soporte</label>
                                    <input
                                        type="email"
                                        name="supportEmail"
                                        value={settings.supportEmail}
                                        onChange={handleChange}
                                        style={{
                                            padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                            background: 'rgb(var(--background))', color: 'rgb(var(--text-main))', width: '100%'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                                        Este correo será visible para los usuarios en la sección de ayuda.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </TabsContent>

                <TabsContent value="master-data">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>

                        {/* Countries Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={18} /> Países ({countries.length})
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCountryModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {countries.map(country => (
                                    <div key={country.code} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgb(var(--primary))' }}>{country.code}</span>
                                            <span style={{ fontSize: '0.9rem' }}>{country.name}</span>
                                        </div>
                                        <button onClick={() => setDeleteConfirm({ type: 'country', id: country.code, name: country.name })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))', padding: '0.25rem' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {countries.length === 0 && <div style={{ padding: '1.5rem', color: 'rgb(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem' }}>No hay países</div>}
                            </div>

                            {countryModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--background))', borderTop: '1px solid rgb(var(--border))' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Agregar País</h3>
                                    <Input placeholder="Código (ej: CO)" maxLength={2} value={newCountry.code} onChange={e => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })} style={{ marginBottom: '0.5rem' }} />
                                    <Input placeholder="Nombre (ej: Colombia)" value={newCountry.name} onChange={e => setNewCountry({ ...newCountry, name: e.target.value })} style={{ marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="outline" onClick={() => setCountryModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCountry}>Guardar</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Currencies Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={18} /> Monedas ({currencies.length})
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCurrencyModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {currencies.map(currency => (
                                    <div key={currency.code} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgb(var(--success))' }}>{currency.symbol}</span>
                                            <span style={{ fontWeight: 500 }}>{currency.code}</span>
                                            <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>{currency.name}</span>
                                        </div>
                                        <button onClick={() => setDeleteConfirm({ type: 'currency', id: currency.code, name: `${currency.code} - ${currency.name}` })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))', padding: '0.25rem' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {currencies.length === 0 && <div style={{ padding: '1.5rem', color: 'rgb(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem' }}>No hay monedas</div>}
                            </div>

                            {currencyModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--background))', borderTop: '1px solid rgb(var(--border))' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Agregar Moneda</h3>
                                    <Input placeholder="Código (ej: COP)" maxLength={3} value={newCurrency.code} onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })} style={{ marginBottom: '0.5rem' }} />
                                    <Input placeholder="Símbolo (ej: $)" value={newCurrency.symbol} onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })} style={{ marginBottom: '0.5rem' }} />
                                    <Input placeholder="Nombre (ej: Peso Colombiano)" value={newCurrency.name} onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })} style={{ marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="outline" onClick={() => setCurrencyModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCurrency}>Guardar</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Categories Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tag size={18} /> Categorías ({categories.length})
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCategoryModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {categories.map(category => (
                                    <div key={category.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{category.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                                /{category.slug}
                                                {category.service_count > 0 && (
                                                    <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: 'rgba(var(--primary), 0.1)', color: 'rgb(var(--primary))', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                                                        {category.service_count} servicio{category.service_count !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setDeleteConfirm({ type: 'category', id: category.id, name: category.name })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))', padding: '0.25rem' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && <div style={{ padding: '1.5rem', color: 'rgb(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem' }}>No hay categorías</div>}
                            </div>

                            {categoryModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--background))', borderTop: '1px solid rgb(var(--border))' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Agregar Categoría</h3>
                                    <Input placeholder="Nombre (ej: Tecnología)" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} style={{ marginBottom: '0.5rem' }} />
                                    <Input placeholder="Slug (ej: tecnologia)" value={newCategory.slug} onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })} style={{ marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCategory}>Guardar</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Service Types Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tag size={18} /> Tipos de Servicio ({serviceTypes.length})
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => { setEditServiceTypeId(null); setNewServiceType({ name: '', slug: '' }); setServiceTypeModalOpen(true); }}><Plus size={16} /></Button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {serviceTypes.map(t => (
                                    <div key={t.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{t.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                                {t.slug && `/${t.slug}`}
                                                {t.service_count > 0 && (
                                                    <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: 'rgba(var(--info), 0.1)', color: 'rgb(var(--info))', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                                                        {t.service_count} servicio{t.service_count !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button onClick={() => { setEditServiceTypeId(t.id); setNewServiceType({ name: t.name, slug: t.slug || '' }); setServiceTypeModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--primary))', fontSize: '0.8rem', padding: '0.25rem' }}>
                                                Editar
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ type: 'serviceType', id: t.id, name: t.name })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))', padding: '0.25rem' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {serviceTypes.length === 0 && <div style={{ padding: '1.5rem', color: 'rgb(var(--text-muted))', textAlign: 'center', fontSize: '0.9rem' }}>No hay tipos</div>}
                            </div>

                            {serviceTypeModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--background))', borderTop: '1px solid rgb(var(--border))' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>{editServiceTypeId ? 'Editar' : 'Agregar'} Tipo</h3>
                                    <Input placeholder="Nombre (ej: Videollamada)" value={newServiceType.name} onChange={e => setNewServiceType({ ...newServiceType, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} style={{ marginBottom: '0.5rem' }} />
                                    <Input placeholder="Slug (opcional)" value={newServiceType.slug} onChange={e => setNewServiceType({ ...newServiceType, slug: e.target.value })} style={{ marginBottom: '0.75rem' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="outline" onClick={() => setServiceTypeModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleSaveServiceType}>{editServiceTypeId ? 'Actualizar' : 'Guardar'}</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

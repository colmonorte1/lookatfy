"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Settings, Save, DollarSign, Shield, Bell, Globe, Plus, Trash2, MapPin, Tag, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import { getPlatformSettings, updatePlatformSettings, getMasterData, addCountry, deleteCountry, addCurrency, deleteCurrency, addCategory, deleteCategory } from './actions';
import { Input } from '@/components/ui/Input/Input';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        platformFee: 10,
        minWithdrawal: 50,
        currency: 'USD',
        autoApproveServices: false,
        autoVerifyExperts: false,
        supportEmail: '',
        notifyDisputes: true,
        notifyNewExperts: true
    });

    const [countries, setCountries] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [countryModalOpen, setCountryModalOpen] = useState(false);
    const [newCountry, setNewCountry] = useState({ code: '', name: '' });

    const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
    const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' });

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const settingsData = await getPlatformSettings();
        if (settingsData) {
            setSettings(prev => ({
                ...prev,
                platformFee: settingsData.commission_percentage || 10,
                minWithdrawal: settingsData.min_withdrawal || 50,
                currency: settingsData.currency || 'USD',
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
            if (res.error) alert('Error al guardar: ' + res.error);
            else alert('Configuración guardada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al guardar cambios');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Country Actions ---
    const handleAddCountry = async () => {
        if (!newCountry.code || !newCountry.name) return alert("Completa todos los campos");
        const res = await addCountry(newCountry);
        if (res.error) alert(res.error);
        else {
            setCountryModalOpen(false);
            setNewCountry({ code: '', name: '' });
            loadData();
        }
    };

    const handleDeleteCountry = async (code: string) => {
        if (!confirm('¿Eliminar país?')) return;
        const res = await deleteCountry(code);
        if (res.error) alert(res.error);
        else loadData();
    };

    // --- Currency Actions ---
    const handleAddCurrency = async () => {
        if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) return alert("Completa todos los campos");
        const res = await addCurrency(newCurrency);
        if (res.error) alert(res.error);
        else {
            setCurrencyModalOpen(false);
            setNewCurrency({ code: '', name: '', symbol: '' });
            loadData();
        }
    };

    const handleDeleteCurrency = async (code: string) => {
        if (!confirm('¿Eliminar moneda?')) return;
        const res = await deleteCurrency(code);
        if (res.error) alert(res.error);
        else loadData();
    };

    // --- Category Actions ---
    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.slug) return alert("Nombre y Slug requeridos");
        const res = await addCategory(newCategory);
        if (res.error) alert(res.error);
        else {
            setCategoryModalOpen(false);
            setNewCategory({ name: '', slug: '', icon: '' });
            loadData();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Eliminar categoría?')) return;
        const res = await deleteCategory(id);
        if (res.error) alert(res.error);
        else loadData();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Settings size={32} />
                    Configuración de Plataforma
                </h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save size={18} style={{ marginRight: '0.5rem' }} />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <Tabs defaultValue="business">
                <TabsList>
                    <TabsTrigger value="business">Reglas de Negocio</TabsTrigger>
                    <TabsTrigger value="master-data">Países, Monedas y Categorías</TabsTrigger>
                </TabsList>

                <TabsContent value="business">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>

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
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-main))', width: '100px'
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
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-main))', width: '100px'
                                            }}
                                        />
                                        <select
                                            name="currency"
                                            value={settings.currency}
                                            onChange={handleChange}
                                            style={{
                                                padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                                background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-main))'
                                            }}
                                        >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="MXN">MXN</option>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyDisputes}
                                        onChange={() => handleToggle('notifyDisputes')}
                                        style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--primary))' }}
                                    />
                                    <label>Notificar nuevas disputas por email</label>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.notifyNewExperts}
                                        onChange={() => handleToggle('notifyNewExperts')}
                                        style={{ width: '18px', height: '18px', accentColor: 'rgb(var(--primary))' }}
                                    />
                                    <label>Notificar nuevos registros de expertos</label>
                                </div>
                            </div>
                        </div>

                        {/* General Info */}
                        <div style={{ background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(var(--secondary), 0.1)', borderRadius: '8px', color: 'rgb(var(--secondary))' }}>
                                    <Globe size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Información General</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 500 }}>Email de Soporte</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    value={settings.supportEmail}
                                    onChange={handleChange}
                                    style={{
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))',
                                        background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-main))', width: '100%'
                                    }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                    Este correo será visible para los usuarios en la sección de ayuda.
                                </p>
                            </div>
                        </div>

                    </div>
                </TabsContent>

                <TabsContent value="master-data">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '1rem' }}>

                        {/* Countries Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={18} /> Países
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCountryModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div>
                                {countries.map(country => (
                                    <div key={country.code} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{country.code}</span>
                                            <span>{country.name}</span>
                                        </div>
                                        <button onClick={() => handleDeleteCountry(country.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {countries.length === 0 && <div style={{ padding: '1rem', color: 'rgb(var(--text-muted))', textAlign: 'center' }}>No hay países registrados</div>}
                            </div>

                            {countryModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--surface-hover))', borderTop: '1px solid rgb(var(--border))', animation: 'fadeIn 0.2s' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Agregar País</h3>
                                    <Input
                                        placeholder="Código (ej: ES)"
                                        maxLength={2}
                                        value={newCountry.code}
                                        onChange={e => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <Input
                                        placeholder="Nombre (ej: España)"
                                        value={newCountry.name}
                                        onChange={e => setNewCountry({ ...newCountry, name: e.target.value })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="secondary" onClick={() => setCountryModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCountry}>Guardar</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Currencies Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={18} /> Monedas
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCurrencyModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div>
                                {currencies.map(currency => (
                                    <div key={currency.code} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', width: '30px' }}>{currency.code}</span>
                                            <span style={{ color: 'rgb(var(--text-secondary))' }}>{currency.name} ({currency.symbol})</span>
                                        </div>
                                        <button onClick={() => handleDeleteCurrency(currency.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {currencies.length === 0 && <div style={{ padding: '1rem', color: 'rgb(var(--text-muted))', textAlign: 'center' }}>No hay monedas registradas</div>}
                            </div>

                            {currencyModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--surface-hover))', borderTop: '1px solid rgb(var(--border))', animation: 'fadeIn 0.2s' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Agregar Moneda</h3>
                                    <Input
                                        placeholder="Código (ej: USD)"
                                        maxLength={3}
                                        value={newCurrency.code}
                                        onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <Input
                                        placeholder="Símbolo (ej: $)"
                                        value={newCurrency.symbol}
                                        onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <Input
                                        placeholder="Nombre (ej: Dolar)"
                                        value={newCurrency.name}
                                        onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="secondary" onClick={() => setCurrencyModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCurrency}>Guardar</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Categories Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tag size={18} /> Categorías
                                </h2>
                                <Button size="sm" variant="outline" onClick={() => setCategoryModalOpen(true)}><Plus size={16} /></Button>
                            </div>
                            <div>
                                {categories.map(category => (
                                    <div key={category.id} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{category.name}</div>
                                            {/* Count is mock for now unless join works */}
                                            {category.services && <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{category.services.count || 0} Servicios</div>}
                                        </div>
                                        <button onClick={() => handleDeleteCategory(category.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && <div style={{ padding: '1rem', color: 'rgb(var(--text-muted))', textAlign: 'center' }}>No hay categorías registradas</div>}
                            </div>

                            {categoryModalOpen && (
                                <div style={{ padding: '1rem', background: 'rgb(var(--surface-hover))', borderTop: '1px solid rgb(var(--border))', animation: 'fadeIn 0.2s' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Agregar Categoría</h3>
                                    <Input
                                        placeholder="Nombre (ej: Deportes)"
                                        value={newCategory.name}
                                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <Input
                                        placeholder="Slug (ej: deportes)"
                                        value={newCategory.slug}
                                        onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button size="sm" variant="secondary" onClick={() => setCategoryModalOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddCategory}>Guardar</Button>
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

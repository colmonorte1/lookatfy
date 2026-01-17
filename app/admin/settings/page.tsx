"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Settings, Save, DollarSign, Shield, Bell, Globe, Plus, Trash2, MapPin, Tag } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        platformFee: 15,
        minWithdrawal: 50,
        currency: 'USD',
        autoApproveServices: false,
        autoVerifyExperts: false,
        supportEmail: 'soporte@lookatfy.com',
        notifyDisputes: true,
        notifyNewExperts: true
    });

    // Mock Data for Master Data Tab
    const [countries, setCountries] = useState([
        { id: 1, name: 'España', code: 'ES', status: 'active' },
        { id: 2, name: 'México', code: 'MX', status: 'active' },
        { id: 3, name: 'Colombia', code: 'CO', status: 'active' },
        { id: 4, name: 'Argentina', code: 'AR', status: 'inactive' },
    ]);

    const [currencies, setCurrencies] = useState([
        { id: 1, code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
        { id: 2, code: 'EUR', symbol: '€', name: 'Euro' },
        { id: 3, code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
    ]);

    const [categories, setCategories] = useState([
        { id: 1, name: 'Moda y Estilo', count: 12 },
        { id: 2, name: 'Bienestar y Salud', count: 8 },
        { id: 3, name: 'Legal y Trámites', count: 5 },
        { id: 4, name: 'Tecnología', count: 3 },
    ]);

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle checkbox/toggle logic manually or via checked attribute if using checkboxes directly
        // For simplicity in this mock, we'll assume direct value mapping or handling boolean differently below
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

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert('Configuración guardada correctamente');
        }, 1000);
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
                                <Button size="sm" variant="outline"><Plus size={16} /></Button>
                            </div>
                            <div>
                                {countries.map(country => (
                                    <div key={country.id} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{country.code}</span>
                                            <span>{country.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: country.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--text-muted))' }} />
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Currencies Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={18} /> Monedas
                                </h2>
                                <Button size="sm" variant="outline"><Plus size={16} /></Button>
                            </div>
                            <div>
                                {currencies.map(currency => (
                                    <div key={currency.id} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', width: '30px' }}>{currency.code}</span>
                                            <span style={{ color: 'rgb(var(--text-secondary))' }}>{currency.name}</span>
                                        </div>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Categories Column */}
                        <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Tag size={18} /> Categorías
                                </h2>
                                <Button size="sm" variant="outline"><Plus size={16} /></Button>
                            </div>
                            <div>
                                {categories.map(category => (
                                    <div key={category.id} style={{ padding: '1rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{category.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{category.count} Servicios</div>
                                        </div>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-secondary))' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

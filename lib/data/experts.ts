export interface Expert {
    id: string;
    name: string;
    title: string;
    rating: number;
    reviews: number;
    price: number;
    image: string;
    tags: string[];
    bio: string;
    isOnline: boolean;
    languages?: Array<{ name: string; level: string }>;
    skills?: Array<{ name: string; level: string }>;
}

export const EXPERTS: Expert[] = [
    {
        id: '1',
        name: 'Sofia Rodriguez',
        title: 'Consultora de Tecnología Personal',
        rating: 4.9,
        reviews: 120,
        price: 25,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        tags: ['Tech', 'Apple', 'Setup'],
        bio: 'Te ayudo a elegir tu próximo computador, configurar tu oficina en casa o resolver problemas técnicos complejos en minutos.',
        isOnline: true
    },
    {
        id: '2',
        name: 'Carlos Mendez',
        title: 'Verificador de Vehículos Usados',
        rating: 4.8,
        reviews: 85,
        price: 40,
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        tags: ['Automotriz', 'Mecánica', 'Compras'],
        bio: 'Acompañamiento virtual para inspeccionar ese auto usado que quieres comprar. No te dejes engañar.',
        isOnline: false
    },
    {
        id: '3',
        name: 'Ana García',
        title: 'Personal Shopper & Stylist',
        rating: 5.0,
        reviews: 210,
        price: 60,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        tags: ['Moda', 'Estilo', 'Compras'],
        bio: 'Asesoría de imagen en tiempo real para tus compras importantes o eventos especiales.',
        isOnline: true
    },
    {
        id: '4',
        name: 'Javier Torres',
        title: 'Experto en Reparaciones Domésticas',
        rating: 4.7,
        reviews: 45,
        price: 20,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        tags: ['DIY', 'Plomería', 'Electricidad'],
        bio: 'Guía paso a paso para arreglar ese grifo que gotea o instalar tu nueva lámpara sin riesgos.',
        isOnline: true
    },
    {
        id: '5',
        name: 'Elena Wu',
        title: 'Chef y Asesora Gastronómica',
        rating: 4.9,
        reviews: 150,
        price: 35,
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
        tags: ['Cocina', 'Eventos', 'Recetas'],
        bio: '¿Te atascaste con la receta? Llámame y salvamos la cena juntos.',
        isOnline: false
    },
    {
        id: '6',
        name: 'Marco Polo',
        title: 'Guía Local en Roma',
        rating: 5.0,
        reviews: 300,
        price: 50,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        tags: ['Turismo', 'Viajes', 'Italia'],
        bio: 'Camino por las calles de Roma por ti. Verifica hoteles, ubicaciones o simplemente disfruta la vista.',
        isOnline: true
    }
];

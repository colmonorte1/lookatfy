export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'expert' | 'user';
    status: 'active' | 'inactive';
    joinedAt: string;
}

export const USERS_MOCK: User[] = [
    { id: '1', name: 'Ana Silva', email: 'ana@admin.com', role: 'admin', status: 'active', joinedAt: '2023-01-15' },
    { id: '2', name: 'Carlos Mendez', email: 'carlos@expert.com', role: 'expert', status: 'active', joinedAt: '2023-03-10' },
    { id: '3', name: 'Usuario Demo', email: 'user@demo.com', role: 'user', status: 'active', joinedAt: '2023-05-22' },
    { id: '4', name: 'Elena Wu', email: 'elena@expert.com', role: 'expert', status: 'inactive', joinedAt: '2023-06-01' },
    { id: '5', name: 'Pedro Pascal', email: 'pedro@user.com', role: 'user', status: 'active', joinedAt: '2023-07-14' },
];

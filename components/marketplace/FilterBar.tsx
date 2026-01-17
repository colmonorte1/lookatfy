"use client";

import { Search } from 'lucide-react';
import styles from './FilterBar.module.css';

export const FilterBar = () => {
    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={20} />
                <input
                    type="text"
                    placeholder="Buscar un experto (ej. Tecnología, Moda...)"
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.filters}>
                <select className={styles.select}>
                    <option value="">Todas las categorías</option>
                    <option value="tech">Tecnología</option>
                    <option value="fashion">Moda</option>
                    <option value="home">Hogar</option>
                </select>

                <select className={styles.select}>
                    <option value="">Precio</option>
                    <option value="low">Menos de $30</option>
                    <option value="high">$30+</option>
                </select>
            </div>
        </div>
    );
};

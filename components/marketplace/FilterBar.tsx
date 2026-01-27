"use client";

import { Search } from 'lucide-react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    category: string;
    onCategoryChange: (value: string) => void;
    price: string;
    onPriceChange: (value: string) => void;
    categories?: string[];
}

export const FilterBar = ({
    searchTerm,
    onSearchTermChange,
    category,
    onCategoryChange,
    price,
    onPriceChange,
    categories = ['Todas']
}: FilterBarProps) => {
    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={20} />
                <input
                    type="text"
                    placeholder="Buscar un experto (ej. Tecnología, Moda...)"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>

            <div className={styles.filters}>
                <select className={styles.select} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select className={styles.select} value={price} onChange={(e) => onPriceChange(e.target.value)}>
                    <option value="Todos">Precio</option>
                    <option value="low">Menos de $30</option>
                    <option value="high">$30+</option>
                </select>
            </div>
        </div>
    );
};

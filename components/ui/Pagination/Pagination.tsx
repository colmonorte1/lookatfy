'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button/Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page));
        const query = params.toString();
        router.push(`${basePath || ''}?${query}`);
    };

    if (totalPages <= 1) return null;

    // Calculate page range to show
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1.5rem 0'
        }}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ gap: '0.25rem' }}
            >
                <ChevronLeft size={16} />
                Anterior
            </Button>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {startPage > 1 && (
                    <>
                        <PageButton page={1} currentPage={currentPage} onClick={goToPage} />
                        {startPage > 2 && <span style={{ padding: '0.5rem', color: 'rgb(var(--text-muted))' }}>...</span>}
                    </>
                )}

                {pages.map((page) => (
                    <PageButton key={page} page={page} currentPage={currentPage} onClick={goToPage} />
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span style={{ padding: '0.5rem', color: 'rgb(var(--text-muted))' }}>...</span>}
                        <PageButton page={totalPages} currentPage={currentPage} onClick={goToPage} />
                    </>
                )}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ gap: '0.25rem' }}
            >
                Siguiente
                <ChevronRight size={16} />
            </Button>
        </div>
    );
}

interface PageButtonProps {
    page: number;
    currentPage: number;
    onClick: (page: number) => void;
}

function PageButton({ page, currentPage, onClick }: PageButtonProps) {
    const isActive = page === currentPage;

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isActive) {
            e.currentTarget.style.background = 'rgb(var(--surface-hover))';
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isActive) {
            e.currentTarget.style.background = 'rgb(var(--surface))';
        }
    };

    return (
        <button
            onClick={() => onClick(page)}
            disabled={isActive}
            style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgb(var(--border))',
                background: isActive ? 'rgb(var(--primary))' : 'rgb(var(--surface))',
                color: isActive ? 'white' : 'rgb(var(--text-main))',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                cursor: isActive ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '2.5rem'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {page}
        </button>
    );
}

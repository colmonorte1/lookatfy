"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Send } from 'lucide-react';
import styles from './Footer.module.css';
import { Button } from '../Button/Button';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.grid}>
                    {/* Brand Column */}
                    <div className={styles.column}>
                        <Link href="/" className={styles.logo}>
                            Lookatfy
                        </Link>
                        <p className={styles.description}>
                            Conectando conocimientos al instante. Tu plataforma de confianza para consultorías 1:1, mentorías y auditorías con expertos verificados.
                        </p>
                        <div className={styles.socials}>
                            <a href="#" className={styles.socialLink} aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" className={styles.socialLink} aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="#" className={styles.socialLink} aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" className={styles.socialLink} aria-label="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.column}>
                        <h4 className={styles.heading}>Explorar</h4>
                        <ul className={styles.list}>
                            <li><Link href="/services/search" className={styles.link}>Buscar Servicios</Link></li>
                            <li><Link href="/experts" className={styles.link}>Ver Expertos</Link></li>
                            <li><Link href="/about" className={styles.link}>Cómo funciona</Link></li>
                            <li><Link href="/pricing" className={styles.link}>Precios</Link></li>
                        </ul>
                    </div>

                    {/* Legal / Company */}
                    <div className={styles.column}>
                        <h4 className={styles.heading}>Compañía</h4>
                        <ul className={styles.list}>
                            <li><Link href="/about" className={styles.link}>Sobre Nosotros</Link></li>
                            <li><Link href="#" className={styles.link}>Términos de Servicio</Link></li>
                            <li><Link href="#" className={styles.link}>Política de Privacidad</Link></li>
                            <li><Link href="#" className={styles.link}>Centro de Ayuda</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className={styles.column}>
                        <h4 className={styles.heading}>Mantente al día</h4>
                        <p className={styles.description} style={{ marginBottom: '1rem' }}>
                            Recibe las mejores ofertas y novedades de nuestros expertos.
                        </p>
                        <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Tu email" className={styles.input} />
                            <Button size="sm" style={{ padding: '0.5rem' }}>
                                <Send size={18} />
                            </Button>
                        </form>
                    </div>
                </div>

                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>&copy; {currentYear} Lookatfy Inc. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

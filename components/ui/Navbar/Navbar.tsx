import Link from 'next/link';
import { Button } from '../Button/Button';
import styles from './Navbar.module.css';

export const Navbar = () => {
    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    Lookatfy
                </Link>

                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Inicio</Link>
                    <Link href="/services/search" className={styles.link}>Explorar</Link>
                    <Link href="/experts" className={styles.link}>Expertos</Link>
                    <Link href="/about" className={styles.link}>Cómo funciona</Link>
                </div>

                <div className={styles.actions}>
                    <Link href="/login">
                        <Button variant="ghost" size="sm">Log In</Button>
                    </Link>
                    <Link href="/register">
                        <Button variant="primary" size="sm">Sign Up</Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

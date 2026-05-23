import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',      icon: '▦' },
  { to: '/earnings',        label: 'Entradas',        icon: '↑' },
  { to: '/expenses',        label: 'Saídas',          icon: '↓' },
  { to: '/payment-methods', label: 'Cartões & Bancos', icon: '◈' },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>N</span>
          <span className={styles.brandName}>nummus</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button className={styles.signOut} onClick={signOut} title="Sair">
            ⏻
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '2px' }}>
        CARREGANDO...
      </span>
    </div>
  )

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

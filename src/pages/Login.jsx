import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>N</div>
          <h1 className={styles.title}>nummus</h1>
          <p className={styles.sub}>gestão financeira pessoal</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} value={email}
              onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Senha</label>
            <input type="password" className={styles.input} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

import React from 'react'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { expensesApi, earningsApi } from '../lib/api'
import styles from './Dashboard.module.css'

const MONTHS = Array.from({ length: 6 }, (_, i) =>
  dayjs().subtract(5 - i, 'month').format('YYYY-MM')
)

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { token } = useAuth()
  const [month,    setMonth]    = useState(dayjs().format('YYYY-MM'))
  const [summary,  setSummary]  = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!token) return
    loadDashboard()
  }, [token, month])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Summary do mês selecionado
      const s = await expensesApi.summary(token, month)
      setSummary(s)

      // Dados dos últimos 6 meses para o gráfico
      const results = await Promise.all(
        MONTHS.map(m => expensesApi.summary(token, m))
      )
      setChartData(results.map(r => ({
        month: r.month.slice(5), // "05"
        Entradas: r.total_earnings,
        Saídas:   r.total_expenses,
      })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const balance = summary?.balance ?? 0

  return (
    <div className={`${styles.page} fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Visão geral financeira</p>
        </div>
        <select
          className={styles.monthSelect}
          value={month}
          onChange={e => setMonth(e.target.value)}
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Entradas</span>
              <span className={`${styles.kpiValue} ${styles.green}`}>
                {fmt(summary?.total_earnings)}
              </span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Saídas</span>
              <span className={`${styles.kpiValue} ${styles.red}`}>
                {fmt(summary?.total_expenses)}
              </span>
            </div>
            <div className={`${styles.kpi} ${balance >= 0 ? styles.kpiPositive : styles.kpiNegative}`}>
              <span className={styles.kpiLabel}>Saldo</span>
              <span className={`${styles.kpiValue} ${balance >= 0 ? styles.green : styles.red}`}>
                {fmt(balance)}
              </span>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Últimos 6 meses</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Entradas" fill="var(--green)"  radius={[4,4,0,0]} />
                <Bar dataKey="Saídas"   fill="var(--red)"    radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
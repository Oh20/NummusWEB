import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { expensesApi } from '../lib/api'
import styles from './Dashboard.module.css'

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

function monthLabel(yyyymm) {
  const [year, month] = yyyymm.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]}/${year.slice(2)}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill ?? p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { token } = useAuth()
  const [month,       setMonth]       = useState(dayjs().format('YYYY-MM'))
  const [summary,     setSummary]     = useState(null)
  const [historySize, setHistorySize] = useState(6)
  const [showForecast,setShowForecast]= useState(true)
  const [forecastSize,setForecastSize]= useState(6)
  const [chartData,   setChartData]   = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!token) return
    loadDashboard()
  }, [token, month, historySize, forecastSize, showForecast])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Summary do mês selecionado
      const s = await expensesApi.summary(token, month)
      setSummary(s)

      // Histórico
      const historyMonths = Array.from({ length: historySize }, (_, i) =>
        dayjs().subtract(historySize - 1 - i, 'month').format('YYYY-MM')
      )
      const historyResults = await Promise.all(
        historyMonths.map(m => expensesApi.summary(token, m))
      )
      const historyData = historyResults.map(r => ({
        month:    monthLabel(r.month),
        Entradas: r.total_earnings,
        Saídas:   r.total_expenses,
        forecast: false,
      }))

      // Previsão
      let forecastData = []
      if (showForecast) {
        const raw = await expensesApi.forecast(token, forecastSize)
        forecastData = raw.map(r => ({
          month:    monthLabel(r.month),
          Entradas: r.total_earnings,
          Saídas:   r.total_expenses,
          forecast: true,
        }))
      }

      setChartData([...historyData, ...forecastData])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const balance = summary?.balance ?? 0
  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    dayjs().subtract(11 - i, 'month').format('YYYY-MM')
  )

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
          {availableMonths.map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
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

          {/* Gráfico */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Histórico & Previsão</h2>
              <div className={styles.chartControls}>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Histórico</span>
                  <select
                    className={styles.controlSelect}
                    value={historySize}
                    onChange={e => setHistorySize(Number(e.target.value))}
                  >
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                  </select>
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlToggle}>
                    <input
                      type="checkbox"
                      checked={showForecast}
                      onChange={e => setShowForecast(e.target.checked)}
                    />
                    <span>Previsão</span>
                  </label>
                  {showForecast && (
                    <select
                      className={styles.controlSelect}
                      value={forecastSize}
                      onChange={e => setForecastSize(Number(e.target.value))}
                    >
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: 'var(--green)' }} />
                Entradas
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: 'var(--red)' }} />
                Saídas
              </span>
              {showForecast && (
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: 'var(--text-muted)', opacity: 0.5 }} />
                  Previsão (recorrentes)
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={4} barCategoryGap="28%">
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
                  tickFormatter={v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar
                  dataKey="Entradas"
                  radius={[4,4,0,0]}
                  fill="var(--green)"
                  fillOpacity={1}
                  shape={(props) => {
                    const opacity = props.forecast ? 0.35 : 1
                    return <rect {...props} fillOpacity={opacity} />
                  }}
                />
                <Bar
                  dataKey="Saídas"
                  radius={[4,4,0,0]}
                  fill="var(--red)"
                  shape={(props) => {
                    const opacity = props.forecast ? 0.35 : 1
                    return <rect {...props} fillOpacity={opacity} />
                  }}
                />
              </BarChart>
            </ResponsiveContainer>

            {showForecast && (
              <p className={styles.forecastNote}>
                * Previsão baseada em lançamentos recorrentes cadastrados
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
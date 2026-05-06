import React from 'react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { earningsApi } from '../lib/api'
import styles from './DataPage.module.css'

const EMPTY = { title: '', value: '', recurrent: false, reference_month: dayjs().format('YYYY-MM') }

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

export default function Earnings() {
  const { token } = useAuth()
  const [items,   setItems]   = useState([])
  const [month,   setMonth]   = useState(dayjs().format('YYYY-MM'))
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { if (token) load() }, [token, month])

  async function load() {
    setLoading(true)
    try {
      const data = await earningsApi.list(token, month)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(item) {
    setForm({ title: item.title, value: item.value, recurrent: item.recurrent, reference_month: item.reference_month })
    setEditing(item.id)
    setModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...form, value: parseFloat(form.value) }
      if (editing) await earningsApi.update(token, editing, body)
      else         await earningsApi.create(token, body)
      setModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta entrada?')) return
    await earningsApi.remove(token, id)
    load()
  }

  const total = items.reduce((s, i) => s + parseFloat(i.value), 0)

  return (
    <div className={`${styles.page} fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Entradas</h1>
          <p className={styles.sub}>Rendas e recebimentos</p>
        </div>
        <div className={styles.headerActions}>
          <input
            type="month"
            className={styles.monthInput}
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={openCreate}>+ Nova entrada</button>
        </div>
      </header>

      <div className={styles.totalBar}>
        <span className={styles.totalLabel}>Total do mês</span>
        <span className={styles.totalValue} style={{ color: 'var(--green)' }}>{fmt(total)}</span>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Nenhuma entrada em {month}</div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>
                  <span className={styles.badge}>{item.reference_month}</span>
                  {item.recurrent && <span className={`${styles.badge} ${styles.badgeAccent}`}>Recorrente</span>}
                </div>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemValue} style={{ color: 'var(--green)' }}>
                  {fmt(item.value)}
                </span>
                <div className={styles.itemActions}>
                  <button className={styles.btnEdit}   onClick={() => openEdit(item)}>✎</button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(item.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{editing ? 'Editar entrada' : 'Nova entrada'}</h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Título</label>
                <input className={styles.input} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Valor (R$)</label>
                  <input className={styles.input} type="number" step="0.01" min="0.01"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Mês de referência</label>
                  <input className={styles.input} type="month" value={form.reference_month}
                    onChange={e => setForm(f => ({ ...f, reference_month: e.target.value }))} required />
                </div>
              </div>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.recurrent}
                  onChange={e => setForm(f => ({ ...f, recurrent: e.target.checked }))} />
                <span>Recorrente (todo mês)</span>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
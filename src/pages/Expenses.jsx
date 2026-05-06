import React from 'react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { expensesApi } from '../lib/api'
import styles from './DataPage.module.css'

const CATEGORIES = ['Contas', 'Alimentação', 'Educação', 'Saúde', 'Lazer', 'Transporte', 'Outros']
const EMPTY = {
  title: '', value: '', recurrent: false,
  reference_month: dayjs().format('YYYY-MM'),
  installments: 1, installment_of: 1,
  origin: 'bank', category: 'Contas'
}

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

const CATEGORY_COLORS = {
  'Contas': 'var(--blue)', 'Alimentação': 'var(--amber)', 'Educação': 'var(--accent)',
  'Saúde': 'var(--green)', 'Lazer': '#c084fc', 'Transporte': '#fb923c', 'Outros': 'var(--text-muted)'
}

export default function Expenses() {
  const { token } = useAuth()
  const [items,    setItems]    = useState([])
  const [month,    setMonth]    = useState(dayjs().format('YYYY-MM'))
  const [category, setCategory] = useState('')
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { if (token) load() }, [token, month, category])

  async function load() {
    setLoading(true)
    try {
      const data = await expensesApi.list(token, month, category)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(item) {
    setForm({
      title: item.title, value: item.value, recurrent: item.recurrent,
      reference_month: item.reference_month, installments: item.installments,
      installment_of: item.installment_of, origin: item.origin, category: item.category
    })
    setEditing(item.id)
    setModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        value:          parseFloat(form.value),
        installments:   parseInt(form.installments),
        installment_of: parseInt(form.installment_of),
      }
      if (editing) await expensesApi.update(token, editing, body)
      else         await expensesApi.create(token, body)
      setModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este gasto?')) return
    await expensesApi.remove(token, id)
    load()
  }

  const total = items.reduce((s, i) => s + parseFloat(i.value), 0)

  return (
    <div className={`${styles.page} fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Saídas</h1>
          <p className={styles.sub}>Gastos e despesas</p>
        </div>
        <div className={styles.headerActions}>
          <input type="month" className={styles.monthInput}
            value={month} onChange={e => setMonth(e.target.value)} />
          <select className={styles.monthInput} value={category}
            onChange={e => setCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Nova saída</button>
        </div>
      </header>

      <div className={styles.totalBar}>
        <span className={styles.totalLabel}>Total do mês</span>
        <span className={styles.totalValue} style={{ color: 'var(--red)' }}>{fmt(total)}</span>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Nenhuma saída em {month}</div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>
                  <span className={styles.badge}>{item.reference_month}</span>
                  <span className={styles.badge} style={{ color: CATEGORY_COLORS[item.category] }}>
                    {item.category}
                  </span>
                  <span className={styles.badge}>{item.origin === 'card' ? '💳 Cartão' : '🏦 Banco'}</span>
                  {item.installments > 1 && (
                    <span className={styles.badge}>{item.installment_of}/{item.installments}x</span>
                  )}
                  {item.recurrent && <span className={`${styles.badge} ${styles.badgeAccent}`}>Recorrente</span>}
                </div>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemValue} style={{ color: 'var(--red)' }}>
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
            <h2 className={styles.modalTitle}>{editing ? 'Editar saída' : 'Nova saída'}</h2>
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
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Origem</label>
                  <select className={styles.input} value={form.origin}
                    onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>
                    <option value="bank">Banco</option>
                    <option value="card">Cartão</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Categoria</label>
                  <select className={styles.input} value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Total de parcelas</label>
                  <input className={styles.input} type="number" min="1"
                    value={form.installments}
                    onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Parcela atual</label>
                  <input className={styles.input} type="number" min="1"
                    value={form.installment_of}
                    onChange={e => setForm(f => ({ ...f, installment_of: e.target.value }))} />
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
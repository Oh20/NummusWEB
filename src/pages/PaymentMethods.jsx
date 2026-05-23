import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../contexts/AuthContext'
import { paymentMethodsApi } from '../lib/api'
import styles from './PaymentMethods.module.css'

const EMPTY = { name: '', type: 'bank' }

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

export default function PaymentMethods() {
  const { token } = useAuth()
  const [methods,  setMethods]  = useState([])
  const [summary,  setSummary]  = useState([])
  const [month,    setMonth]    = useState(dayjs().format('YYYY-MM'))
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { if (token) load() }, [token, month])

  async function load() {
    setLoading(true)
    try {
      const [m, s] = await Promise.all([
        paymentMethodsApi.list(token),
        paymentMethodsApi.summary(token, month),
      ])
      setMethods(m ?? [])
      setSummary(s ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(m) {
    setForm({ name: m.name, type: m.type })
    setEditing(m.id)
    setModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await paymentMethodsApi.update(token, editing, form)
      else         await paymentMethodsApi.create(token, form)
      setModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover este método? As saídas vinculadas não serão afetadas.')) return
    await paymentMethodsApi.remove(token, id)
    load()
  }

  const totalPending = summary.reduce((s, m) => s + m.total_pending, 0)

  const banks = summary.filter(m => m.type === 'bank')
  const cards = summary.filter(m => m.type === 'card')

  return (
    <div className={`${styles.page} fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Cartões & Bancos</h1>
          <p className={styles.sub}>Métodos de pagamento e saldo pendente</p>
        </div>
        <div className={styles.headerActions}>
          <input type="month" className={styles.monthInput}
            value={month} onChange={e => setMonth(e.target.value)} />
          <button className={styles.btnPrimary} onClick={openCreate}>+ Adicionar</button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : methods.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum cartão ou banco cadastrado.</p>
          <button className={styles.btnPrimary} onClick={openCreate} style={{ marginTop: 16 }}>
            + Adicionar primeiro
          </button>
        </div>
      ) : (
        <>
          {/* Total geral */}
          <div className={styles.totalBar}>
            <span className={styles.totalLabel}>Total pendente em {month}</span>
            <span className={styles.totalValue}>{fmt(totalPending)}</span>
          </div>

          {/* Bancos */}
          {banks.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🏦 Bancos</h2>
              <div className={styles.grid}>
                {banks.map(m => (
                  <MethodCard
                    key={m.id}
                    method={m}
                    onEdit={() => openEdit(methods.find(x => x.id === m.id))}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cartões */}
          {cards.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>💳 Cartões</h2>
              <div className={styles.grid}>
                {cards.map(m => (
                  <MethodCard
                    key={m.id}
                    method={m}
                    onEdit={() => openEdit(methods.find(x => x.id === m.id))}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className={styles.overlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editing ? 'Editar' : 'Novo'} cartão ou banco
            </h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Nubank, Bradesco, Inter..."
                  required
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tipo</label>
                <div className={styles.typeToggle}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${form.type === 'bank' ? styles.typeBtnActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: 'bank' }))}
                  >
                    🏦 Banco
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${form.type === 'card' ? styles.typeBtnActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: 'card' }))}
                  >
                    💳 Cartão
                  </button>
                </div>
              </div>
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

function MethodCard({ method, onEdit, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardName}>{method.name}</span>
        <div className={styles.cardActions}>
          <button className={styles.btnEdit} onClick={onEdit}>✎</button>
          <button className={styles.btnDelete} onClick={onDelete}>✕</button>
        </div>
      </div>
      <div className={styles.cardPending}>
        <span className={styles.pendingLabel}>Pendente no mês</span>
        <span className={styles.pendingValue}>{fmt(method.total_pending)}</span>
      </div>
      {method.total_pending > 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  )
}
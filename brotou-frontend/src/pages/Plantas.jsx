import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Modal from '../components/Modal'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import { plantasApi, especiesApi } from '../services/api'

const FOTO_FALLBACK = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80'

export default function Plantas() {
  const { usuario, toast } = useApp()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ apelido: '', especieId: '', adquiridaEm: '', urlFoto: '', disponivelParaAdocao: false })
  const [saving, setSaving] = useState(false)

  const { data: plantasRes, loading, refetch } = useApi(
    () => plantasApi.listar({ donoId: usuario?.id }), [usuario?.id],
  )
  const { data: especiesRes } = useApi(() => especiesApi.listar(), [])

  const plantas = plantasRes?.dados || []
  const especies = especiesRes?.dados || []

  const filtered = plantas
    .filter(p => {
      if (filtro === 'adocao') return p.disponivelParaAdocao
      if (filtro === 'FACIL') return p.especie?.dificuldade === 'FACIL'
      if (filtro === 'MEDIO') return p.especie?.dificuldade === 'MEDIO'
      if (filtro === 'DIFICIL') return p.especie?.dificuldade === 'DIFICIL'
      return true
    })
    .filter(p => {
      const termo = busca.trim().toLowerCase()
      if (!termo) return true
      return (
        p.apelido?.toLowerCase().includes(termo) ||
        p.especie?.nomeComum?.toLowerCase().includes(termo) ||
        p.especie?.nomeCientifico?.toLowerCase().includes(termo)
      )
    })

  const limparFiltros = () => {
    setBusca('')
    setFiltro('todas')
  }

  const handleSave = async () => {
    if (!form.apelido || !form.especieId || !form.adquiridaEm) {
      toast('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      await plantasApi.criar({ ...form, donoId: usuario.id })
      toast('Planta cadastrada com sucesso!')
      setModalOpen(false)
      setForm({ apelido: '', especieId: '', adquiridaEm: '', urlFoto: '', disponivelParaAdocao: false })
      refetch()
    } catch (err) {
      toast('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const DIFIC_LABEL = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' }

  return (
    <AppShell activePage="plantas">
      <div className="page-hd">
        <div>
          <h1>Minhas Plantas</h1>
          <p>{loading ? 'Carregando...' : `${plantas.length} plantas cadastradas`}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Nova Planta</button>
      </div>

      <div className="filter-row">
        {[['todas', 'Todas'], ['FACIL', 'Fácil'], ['MEDIO', 'Médio'], ['DIFICIL', 'Difícil'], ['adocao', 'Para adoção']].map(([k, l]) => (
          <button key={k} className={`fbtn${filtro === k ? ' active' : ''}`} onClick={() => setFiltro(k)}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 18 }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Pesquisar por apelido, espécie ou nome científico"
          style={{ padding: '10px 14px', border: '1.5px solid var(--sand)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--white)' }}
        />
        <button type="button" className="btn btn-ghost" onClick={limparFiltros}>Reexibir todos</button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma planta encontrada</h3>
          <p>Ajuste a pesquisa ou use o botão "Reexibir todos".</p>
        </div>
      ) : (
        <div className="plant-grid">
          {filtered.map(p => (
            <div className="pc" key={p.id} onClick={() => navigate(`/plantas/${p.id}`)}>
              <div className="pc-img">
                <img
                  src={p.urlFoto || FOTO_FALLBACK}
                  alt={p.apelido}
                  onError={e => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = FOTO_FALLBACK
                  }}
                />
                <div className="pc-badges">
                  {p.disponivelParaAdocao && <span className="badge bg-green">adoção</span>}
                  <span className="badge bg-muted">{DIFIC_LABEL[p.especie?.dificuldade] || ''}</span>
                </div>
              </div>
              <div className="pc-body">
                <div className="pc-name">{p.apelido}</div>
                <div className="pc-sp">{p.especie?.nomeCientifico}</div>
                <div className="pc-foot">
                  <span className="pc-since">Desde {new Date(p.adquiridaEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                  <span className="pc-water">{p.especie?.dicaRega?.split(',')[0] || 'Ver dicas'}</span>
                </div>
              </div>
            </div>
          ))}

          <button className="add-pc" onClick={() => setModalOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <span>Adicionar planta</span>
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cadastrar nova planta">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Apelido da planta *</label>
            <input placeholder="Ex: Monstera da Janela" value={form.apelido} onChange={e => setForm(p => ({ ...p, apelido: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>Espécie *</label>
              <select value={form.especieId} onChange={e => setForm(p => ({ ...p, especieId: e.target.value }))}>
                <option value="">Selecionar...</option>
                {especies.map(e => <option key={e.id} value={e.id}>{e.nomeComum}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Data de aquisição *</label>
              <input type="date" value={form.adquiridaEm} onChange={e => setForm(p => ({ ...p, adquiridaEm: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label>URL da foto</label>
            <input placeholder="https://..." value={form.urlFoto} onChange={e => setForm(p => ({ ...p, urlFoto: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream)', borderRadius: 'var(--r-md)', padding: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Disponível para adoção</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Outros usuários poderão solicitar cuidado</div>
            </div>
            <button
              className={`toggle ${form.disponivelParaAdocao ? 'on' : 'off'}`}
              onClick={() => setForm(p => ({ ...p, disponivelParaAdocao: !p.disponivelParaAdocao }))}
            ><span className="toggle-k" /></button>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar planta'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}

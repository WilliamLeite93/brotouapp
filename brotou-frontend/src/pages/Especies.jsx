import { useState } from 'react'
import AppShell from '../components/AppShell'
import { useApi } from '../hooks/useApi'
import { especiesApi } from '../services/api'

const FOTOS_ESPECIES = [
  'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&q=80',
  'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&q=80',
  'https://images.unsplash.com/photo-1585058178215-33108215e3c8?w=400&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
  'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&q=80',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80',
]

const FOTO_FALLBACK = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80'

const DIFIC = { FACIL: 'bg-green', MEDIO: 'bg-orange', DIFICIL: 'bg-red' }
const DIFIC_L = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' }

export default function Especies() {
  const [filtro, setFiltro] = useState('TODAS')
  const [busca, setBusca] = useState('')

  const { data, loading } = useApi(() => especiesApi.listar(), [])
  const especies = (data?.dados || [])
    .filter(e => filtro === 'TODAS' || e.dificuldade === filtro)
    .filter(e => !busca || e.nomeComum.toLowerCase().includes(busca.toLowerCase()) || e.nomeCientifico?.toLowerCase().includes(busca.toLowerCase()))

  return (
    <AppShell activePage="especies">
      <div className="page-hd">
        <div><h1>Espécies</h1><p>{data?.total || 0} espécies catalogadas</p></div>
        <div style={{ position: 'relative' }}>
          <input
            placeholder="Buscar espécie..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid var(--sand)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--white)', width: 240 }}
          />
        </div>
      </div>

      <div className="filter-row">
        {[['TODAS', 'Todas'], ['FACIL', 'Fácil'], ['MEDIO', 'Médio'], ['DIFICIL', 'Difícil']].map(([k, l]) => (
          <button key={k} className={`fbtn${filtro === k ? ' active' : ''}`} onClick={() => setFiltro(k)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : especies.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma espécie encontrada</h3>
          <p>Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <div className="esp-grid">
          {especies.map((e, i) => (
            <div className="ec" key={e.id}>
              <div className="ec-img">
                <img
                  src={e.urlFoto || FOTOS_ESPECIES[i % FOTOS_ESPECIES.length] || FOTO_FALLBACK}
                  alt={e.nomeComum}
                  onError={ev => {
                    ev.currentTarget.onerror = null
                    ev.currentTarget.src = FOTO_FALLBACK
                  }}
                />
              </div>
              <div className="ec-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div className="ec-name">{e.nomeComum}</div>
                  <span className={`badge ${DIFIC[e.dificuldade] || 'bg-muted'}`} style={{ flexShrink: 0 }}>{DIFIC_L[e.dificuldade]}</span>
                </div>
                <div className="ec-sci">{e.nomeCientifico}</div>
                <div className="ec-tips">
                  {e.dicaRega && (
                    <div className="ec-tip">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      {e.dicaRega}
                    </div>
                  )}
                  {e.dicaLuz && (
                    <div className="ec-tip">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>
                      {e.dicaLuz}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}

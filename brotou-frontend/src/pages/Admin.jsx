import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useApi } from '../hooks/useApi'
import { adocoesApi, adminApi, especiesApi } from '../services/api'

function montarDonut(distribuicao) {
  const cores = {
    FACIL: 'var(--adm-green)',
    MEDIO: 'var(--adm-blue)',
    DIFICIL: 'var(--adm-amber)',
  }

  const total = distribuicao.reduce((acc, item) => acc + item.total, 0)
  if (!total) return 'conic-gradient(var(--adm-border) 0% 100%)'

  let inicio = 0
  const partes = distribuicao.map((item) => {
    const percentual = (item.total / total) * 100
    const fim = inicio + percentual
    const trecho = `${cores[item.dificuldade] || 'var(--adm-red)'} ${inicio}% ${fim}%`
    inicio = fim
    return trecho
  })

  if (inicio < 100) {
    partes.push(`var(--adm-red) ${inicio}% 100%`)
  }

  return `conic-gradient(${partes.join(',')})`
}

const STATUS_CORES = {
  PENDENTE: 'var(--adm-amber)',
  ATIVA: 'var(--adm-green)',
  CONCLUIDA: 'var(--adm-blue)',
}

const TIPO_LABELS = {
  REGA: 'Rega',
  ADUBACAO: 'Adubação',
  PODA: 'Poda',
  OBSERVACAO: 'Observação',
}

export default function Admin() {
  const { admin, logoutAdmin, toast } = useApp()
  const navigate = useNavigate()

  const [secao, setSecao] = useState('dashboard')
  const [busca, setBusca] = useState('')
  const [savingPlanta, setSavingPlanta] = useState(false)
  const [savingEspecie, setSavingEspecie] = useState(false)
  const [especieEditando, setEspecieEditando] = useState(null)
  const [acaoInteracao, setAcaoInteracao] = useState(null)
  const [formPlanta, setFormPlanta] = useState({
    apelido: '',
    especieId: '',
    donoId: '',
    adquiridaEm: '',
    urlFoto: '',
    disponivelParaAdocao: false,
  })
  const [formEspecie, setFormEspecie] = useState({
    nomeComum: '',
    nomeCientifico: '',
    urlFoto: '',
    dicaRega: '',
    dicaLuz: '',
    dificuldade: 'FACIL',
  })

  const { data: dashRes, loading: loadingDash, refetch: refDash } = useApi(() => adminApi.dashboard(), [])
  const { data: usuariosRes } = useApi(() => adminApi.listarUsuarios(), [])
  const { data: plantasRes, loading: loadingPlantas, refetch: refPlantas } = useApi(() => adminApi.listarPlantas(), [])
  const { data: especiesRes, refetch: refEspecies } = useApi(() => especiesApi.listar(), [])
  const { data: interacoesRes, loading: loadingInteracoes, refetch: refInteracoes } = useApi(() => adocoesApi.listar({}, { auth: 'admin' }), [])

  const dash = dashRes?.dados || {}
  const totais = dash.totais || {}
  const entradasUltimos7Dias = dash.entradasUltimos7Dias || []
  const distribuicaoDificuldade = dash.plantasPorDificuldade || []
  const adocoesPorStatus = dash.adocoesPorStatus || []
  const entradasPorTipo = dash.entradasPorTipo || []

  const usuarios = usuariosRes?.dados || []
  const especies = especiesRes?.dados || []
  const plantas = plantasRes?.dados || []
  const interacoes = interacoesRes?.dados || []

  const plantasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return plantas
    return plantas.filter((p) => {
      return (
        p.apelido?.toLowerCase().includes(termo) ||
        p.especie?.nomeComum?.toLowerCase().includes(termo) ||
        p.dono?.nome?.toLowerCase().includes(termo)
      )
    })
  }, [plantas, busca])

  const interacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return interacoes
    return interacoes.filter((i) => {
      return (
        i.planta?.apelido?.toLowerCase().includes(termo) ||
        i.cuidador?.nome?.toLowerCase().includes(termo) ||
        i.planta?.dono?.nome?.toLowerCase().includes(termo) ||
        i.status?.toLowerCase().includes(termo)
      )
    })
  }, [interacoes, busca])

  const especiesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return especies
    return especies.filter((e) => (
      e.nomeComum?.toLowerCase().includes(termo) ||
      e.nomeCientifico?.toLowerCase().includes(termo) ||
      e.dificuldade?.toLowerCase().includes(termo)
    ))
  }, [especies, busca])

  const handleLogout = () => {
    logoutAdmin()
    navigate('/')
  }

  const handleCriarPlanta = async () => {
    if (!formPlanta.apelido || !formPlanta.especieId || !formPlanta.donoId || !formPlanta.adquiridaEm) {
      toast('Preencha os campos obrigatórios para cadastrar o item.')
      return
    }

    setSavingPlanta(true)
    try {
      await adminApi.criarPlanta({ ...formPlanta, adminId: admin?.id || undefined })
      toast('Item cadastrado com sucesso.')
      setFormPlanta({
        apelido: '',
        especieId: '',
        donoId: '',
        adquiridaEm: '',
        urlFoto: '',
        disponivelParaAdocao: false,
      })
      refPlantas()
      refDash()
    } catch (err) {
      toast('Erro: ' + err.message)
    } finally {
      setSavingPlanta(false)
    }
  }

  const limparFormEspecie = () => {
    setEspecieEditando(null)
    setFormEspecie({
      nomeComum: '',
      nomeCientifico: '',
      urlFoto: '',
      dicaRega: '',
      dicaLuz: '',
      dificuldade: 'FACIL',
    })
  }

  const editarEspecie = (especie) => {
    setEspecieEditando(especie.id)
    setFormEspecie({
      nomeComum: especie.nomeComum || '',
      nomeCientifico: especie.nomeCientifico || '',
      urlFoto: especie.urlFoto || '',
      dicaRega: especie.dicaRega || '',
      dicaLuz: especie.dicaLuz || '',
      dificuldade: especie.dificuldade || 'FACIL',
    })
  }

  const handleSalvarEspecie = async () => {
    if (!formEspecie.nomeComum || !formEspecie.nomeCientifico || !formEspecie.dicaRega || !formEspecie.dicaLuz) {
      toast('Preencha os campos obrigatórios da espécie.')
      return
    }

    setSavingEspecie(true)
    try {
      if (especieEditando) {
        await especiesApi.atualizar(especieEditando, {
          ...formEspecie,
          urlFoto: formEspecie.urlFoto.trim(),
        })
        toast('Espécie atualizada com sucesso.')
      } else {
        await especiesApi.criar({
          ...formEspecie,
          urlFoto: formEspecie.urlFoto.trim(),
        })
        toast('Espécie cadastrada com sucesso.')
      }
      limparFormEspecie()
      refEspecies()
      refDash()
    } catch (err) {
      toast('Erro: ' + err.message)
    } finally {
      setSavingEspecie(false)
    }
  }

  const executarAcaoInteracao = async (id, acao, fn) => {
    setAcaoInteracao(`${acao}-${id}`)
    try {
      await fn()
      toast('Ação executada com sucesso.')
      refInteracoes()
      refDash()
    } catch (err) {
      toast('Erro: ' + err.message)
    } finally {
      setAcaoInteracao(null)
    }
  }

  const handleResponder = async (id) => {
    const resposta = window.prompt('Digite a resposta para o cliente:')
    if (!resposta || !resposta.trim()) return

    executarAcaoInteracao(id, 'responder', () => adocoesApi.responder(id, resposta.trim()))
  }

  const handleEnviarEmail = async (id) => {
    executarAcaoInteracao(id, 'email', () => adocoesApi.enviarEmail(id))
  }

  const handleConfirmar = async (id) => {
    executarAcaoInteracao(id, 'confirmar', () => adocoesApi.confirmar(id))
  }

  const handleExcluir = async (id) => {
    const confirmou = window.confirm('Deseja realmente excluir esta interação?')
    if (!confirmou) return

    executarAcaoInteracao(id, 'excluir', () => adocoesApi.remover(id, { auth: 'admin' }))
  }

  const renderDashboard = () => {
    const maxEntradas = Math.max(...entradasUltimos7Dias.map((d) => d.total), 1)
    const totalStatus = adocoesPorStatus.reduce((acc, item) => acc + item.total, 0)
    const maxTipoEntrada = Math.max(...entradasPorTipo.map((item) => item.total), 1)

    return (
      <>
        <div className="adm-page-hd">
          <div><h1>Dashboard</h1><p>Visão geral da plataforma com gráficos em tempo real</p></div>
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => setSecao('especies')}>
            Gerenciar espécies
          </button>
        </div>

        {loadingDash ? (
          <div className="loading-wrap"><div className="spinner" style={{ borderTopColor: 'var(--adm-blue)' }} /></div>
        ) : (
          <>
            <div className="adm-stats">
              <div className="adm-sc">
                <div className="adm-sc-top"><span className="adm-sc-label">Usuários</span></div>
                <div className="adm-sc-num">{totais.usuarios ?? 0}</div>
                <div className="adm-sc-delta up">contas registradas</div>
              </div>
              <div className="adm-sc">
                <div className="adm-sc-top"><span className="adm-sc-label">Itens</span></div>
                <div className="adm-sc-num">{totais.plantas ?? 0}</div>
                <div className="adm-sc-delta up">itens cadastrados</div>
              </div>
              <div className="adm-sc">
                <div className="adm-sc-top"><span className="adm-sc-label">Interações</span></div>
                <div className="adm-sc-num">{totais.adocoes ?? 0}</div>
                <div className="adm-sc-delta up">interações de clientes</div>
              </div>
              <div className="adm-sc">
                <div className="adm-sc-top"><span className="adm-sc-label">Pendentes</span></div>
                <div className="adm-sc-num">{totais.interacoesPendentes ?? 0}</div>
                <div className="adm-sc-delta down">aguardando resposta</div>
              </div>
            </div>

            <div className="adm-grid-2">
              <div className="adm-chart-box">
                <div className="adm-chart-title">Entradas no diário - últimos 7 dias</div>
                <div className="adm-bar-chart">
                  {entradasUltimos7Dias.map((item) => {
                    const altura = Math.max(6, Math.round((item.total / maxEntradas) * 100))
                    return (
                      <div className="adm-bar-g" key={item.data}>
                        <div className="adm-bar" style={{ height: `${altura}%` }} title={`${item.rotulo}: ${item.total}`} />
                        <div className="adm-bar-lbl">{item.rotulo}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="adm-chart-box">
                <div className="adm-chart-title">Distribuição de espécies por dificuldade</div>
                <div className="adm-donut-wrap">
                  <div className="adm-donut" style={{ background: montarDonut(distribuicaoDificuldade) }} />
                  <div className="adm-legend">
                    {distribuicaoDificuldade.map((item) => (
                      <div className="adm-leg-item" key={item.dificuldade}>
                        <div className="adm-leg-dot" style={{
                          background:
                            item.dificuldade === 'FACIL'
                              ? 'var(--adm-green)'
                              : item.dificuldade === 'MEDIO'
                                ? 'var(--adm-blue)'
                                : 'var(--adm-amber)',
                        }} />
                        {item.dificuldade} - {item.total}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-grid-2">
              <div className="adm-chart-box">
                <div className="adm-chart-title">Interações por status</div>
                {adocoesPorStatus.length === 0 ? (
                  <div className="adm-chart-empty">Sem interações registradas.</div>
                ) : (
                  <div className="adm-status-chart">
                    {adocoesPorStatus.map((item) => {
                      const percentual = totalStatus ? Math.round((item.total / totalStatus) * 100) : 0
                      return (
                        <div className="adm-hbar-row" key={item.status}>
                          <div className="adm-hbar-meta">
                            <span>{item.status}</span>
                            <strong>{item.total}</strong>
                          </div>
                          <div className="adm-hbar-track">
                            <div
                              className="adm-hbar-fill"
                              style={{
                                width: `${Math.max(percentual, 4)}%`,
                                background: STATUS_CORES[item.status] || 'var(--adm-red)',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="adm-chart-box">
                <div className="adm-chart-title">Entradas por tipo</div>
                {entradasPorTipo.length === 0 ? (
                  <div className="adm-chart-empty">Sem entradas no diário.</div>
                ) : (
                  <div className="adm-type-chart">
                    {entradasPorTipo.map((item) => {
                      const altura = Math.max(10, Math.round((item.total / maxTipoEntrada) * 100))
                      return (
                        <div className="adm-type-g" key={item.tipo}>
                          <div className="adm-type-val">{item.total}</div>
                          <div className="adm-type-bar" style={{ height: `${altura}%` }} />
                          <div className="adm-type-lbl">{TIPO_LABELS[item.tipo] || item.tipo}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  const renderPlantas = () => {
    return (
      <>
        <div className="adm-page-hd">
          <div><h1>Itens / Produtos</h1><p>Listagem e cadastro do item principal do sistema</p></div>
          <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setSecao('especies')}>
            Editar espécies
          </button>
        </div>

        <div className="adm-actions-panel">
          <h3>Cadastrar novo item</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 10 }}>
            <input className="adm-input" placeholder="Apelido *" value={formPlanta.apelido} onChange={e => setFormPlanta(p => ({ ...p, apelido: e.target.value }))} />
            <select className="adm-input" value={formPlanta.especieId} onChange={e => setFormPlanta(p => ({ ...p, especieId: e.target.value }))}>
              <option value="">Selecione a espécie *</option>
              {especies.map((e) => <option key={e.id} value={e.id}>{e.nomeComum}</option>)}
            </select>
            <select className="adm-input" value={formPlanta.donoId} onChange={e => setFormPlanta(p => ({ ...p, donoId: e.target.value }))}>
              <option value="">Selecione o dono *</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <input className="adm-input" type="date" value={formPlanta.adquiridaEm} onChange={e => setFormPlanta(p => ({ ...p, adquiridaEm: e.target.value }))} />
            <input className="adm-input" placeholder="URL da foto" value={formPlanta.urlFoto} onChange={e => setFormPlanta(p => ({ ...p, urlFoto: e.target.value }))} />
            <label className="adm-checkbox"><input type="checkbox" checked={formPlanta.disponivelParaAdocao} onChange={e => setFormPlanta(p => ({ ...p, disponivelParaAdocao: e.target.checked }))} />Disponível para adoção</label>
          </div>
          <button className="adm-btn adm-btn-primary" onClick={handleCriarPlanta} disabled={savingPlanta}>
            {savingPlanta ? 'Salvando...' : 'Cadastrar item'}
          </button>
        </div>

        <div className="adm-table-wrap">
          <div className="adm-table-hd">
            <h3>Itens cadastrados ({plantasFiltradas.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
              <input
                className="adm-input"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar itens/produtos"
                style={{ minWidth: 210 }}
              />
              <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setBusca('')}>
                Reexibir todos
              </button>
            </div>
          </div>
          {loadingPlantas ? (
            <div className="loading-wrap"><div className="spinner" style={{ borderTopColor: 'var(--adm-blue)' }} /></div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>Item</th><th>Espécie</th><th>Dono</th><th>Aquisição</th><th>Status</th></tr>
              </thead>
              <tbody>
                {plantasFiltradas.map((p) => (
                  <tr key={p.id}>
                    <td>{p.apelido}</td>
                    <td>{p.especie?.nomeComum}</td>
                    <td>{p.dono?.nome}</td>
                    <td>{new Date(p.adquiridaEm).toLocaleDateString('pt-BR')}</td>
                    <td><span className={`badge ${p.disponivelParaAdocao ? 'bg-green' : 'bg-muted'}`}>{p.disponivelParaAdocao ? 'Adoção aberta' : 'Privado'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    )
  }

  const renderEspecies = () => {
    return (
      <>
        <div className="adm-page-hd">
          <div><h1>Espécies</h1><p>Cadastro e edição das espécies exibidas no catálogo</p></div>
        </div>

        <div className="adm-actions-panel">
          <h3>{especieEditando ? 'Editar espécie' : 'Cadastrar nova espécie'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 10 }}>
            <input className="adm-input" placeholder="Nome comum *" value={formEspecie.nomeComum} onChange={e => setFormEspecie(p => ({ ...p, nomeComum: e.target.value }))} />
            <input className="adm-input" placeholder="Nome científico *" value={formEspecie.nomeCientifico} onChange={e => setFormEspecie(p => ({ ...p, nomeCientifico: e.target.value }))} />
            <select className="adm-input" value={formEspecie.dificuldade} onChange={e => setFormEspecie(p => ({ ...p, dificuldade: e.target.value }))}>
              <option value="FACIL">Fácil</option>
              <option value="MEDIO">Médio</option>
              <option value="DIFICIL">Difícil</option>
            </select>
            <input className="adm-input" placeholder="URL da foto" value={formEspecie.urlFoto} onChange={e => setFormEspecie(p => ({ ...p, urlFoto: e.target.value }))} />
            <input className="adm-input" placeholder="Dica de rega *" value={formEspecie.dicaRega} onChange={e => setFormEspecie(p => ({ ...p, dicaRega: e.target.value }))} />
            <input className="adm-input" placeholder="Dica de luz *" value={formEspecie.dicaLuz} onChange={e => setFormEspecie(p => ({ ...p, dicaLuz: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="adm-btn adm-btn-primary" onClick={handleSalvarEspecie} disabled={savingEspecie}>
              {savingEspecie ? 'Salvando...' : especieEditando ? 'Salvar alterações' : 'Cadastrar espécie'}
            </button>
            {especieEditando && (
              <button className="adm-btn adm-btn-ghost" onClick={limparFormEspecie}>Cancelar edição</button>
            )}
          </div>
        </div>

        <div className="adm-table-wrap">
          <div className="adm-table-hd">
            <h3>Espécies cadastradas ({especiesFiltradas.length})</h3>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Espécie</th><th>Foto</th><th>Dificuldade</th><th>Plantas</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {especiesFiltradas.map((e) => (
                <tr key={e.id}>
                  <td>{e.nomeComum}<br /><span style={{ color: 'var(--adm-muted)', fontSize: 12 }}>{e.nomeCientifico}</span></td>
                  <td style={{ maxWidth: 280, color: 'var(--adm-muted)', fontSize: 12, overflowWrap: 'anywhere' }}>{e.urlFoto || 'Sem foto cadastrada'}</td>
                  <td><span className="adm-status active">{e.dificuldade}</span></td>
                  <td>{e._count?.plantas ?? 0}</td>
                  <td>
                    <button className="adm-btn adm-btn-ghost" onClick={() => editarEspecie(e)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const renderInteracoes = () => {
    return (
      <>
        <div className="adm-page-hd">
          <div><h1>Interações de clientes</h1><p>Responder, enviar e-mail, confirmar e excluir</p></div>
        </div>

        <div className="adm-table-wrap">
          <div className="adm-table-hd">
            <h3>Interações ({interacoesFiltradas.length})</h3>
          </div>

          {loadingInteracoes ? (
            <div className="loading-wrap"><div className="spinner" style={{ borderTopColor: 'var(--adm-blue)' }} /></div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>Cliente</th><th>Item</th><th>Status</th><th>Resposta</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {interacoesFiltradas.map((i) => (
                  <tr key={i.id}>
                    <td>{i.cuidador?.nome}<br /><span style={{ color: 'var(--adm-muted)', fontSize: 12 }}>{i.cuidador?.email}</span></td>
                    <td>{i.planta?.apelido}<br /><span style={{ color: 'var(--adm-muted)', fontSize: 12 }}>Dono: {i.planta?.dono?.nome}</span></td>
                    <td><span className={`adm-status ${i.status === 'PENDENTE' ? 'pending' : i.status === 'ATIVA' ? 'active' : 'blocked'}`}>{i.status}</span></td>
                    <td>
                      {i.respostaAdmin ? (
                        <span>{i.respostaAdmin}</span>
                      ) : (
                        <span style={{ color: 'var(--adm-muted)' }}>Sem resposta</span>
                      )}
                    </td>
                    <td>
                      <div className="adm-action-btns">
                        <button className="adm-btn adm-btn-ghost" onClick={() => handleResponder(i.id)} disabled={acaoInteracao === `responder-${i.id}`}>Responder</button>
                        <button className="adm-btn adm-btn-ghost" onClick={() => handleEnviarEmail(i.id)} disabled={acaoInteracao === `email-${i.id}`}>Enviar e-mail</button>
                        <button className="adm-btn adm-btn-primary" onClick={() => handleConfirmar(i.id)} disabled={acaoInteracao === `confirmar-${i.id}`}>Confirmar</button>
                        <button className="adm-btn adm-btn-danger" onClick={() => handleExcluir(i.id)} disabled={acaoInteracao === `excluir-${i.id}`}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    )
  }

  return (
    <div id="page-admin" className="page-enter">
      <div className="adm-shell">
        <header className="adm-topbar">
          <div className="adm-logo-wrap">
            Brotou <span className="adm-badge">Admin</span>
          </div>
          <div style={{ flex: 1, padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-bg3)', border: '1px solid var(--adm-border)', borderRadius: 6, padding: '7px 12px', maxWidth: 360 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--adm-muted)" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--adm-text)', width: '100%' }}
                placeholder="Buscar usuários, itens e interações..."
              />
            </div>
          </div>
          <div className="adm-topbar-right">
            <div className="adm-avatar">{admin?.nome?.charAt(0)?.toUpperCase() || 'A'}</div>
            <div style={{ fontSize: 13, color: 'var(--adm-muted)', paddingRight: 4 }}>Admin</div>
            <div className="adm-exit" onClick={handleLogout}>Sair</div>
          </div>
        </header>

        <aside className="adm-sidebar">
          <div className="adm-sb-section">
            <div className="adm-sb-label">Visão Geral</div>
            <div className={`adm-nav${secao === 'dashboard' ? ' active' : ''}`} onClick={() => setSecao('dashboard')}>Dashboard</div>
            <div className={`adm-nav${secao === 'plantas' ? ' active' : ''}`} onClick={() => setSecao('plantas')}>Itens / Produtos</div>
            <div className={`adm-nav${secao === 'especies' ? ' active' : ''}`} onClick={() => setSecao('especies')}>Espécies</div>
            <div className={`adm-nav${secao === 'interacoes' ? ' active' : ''}`} onClick={() => setSecao('interacoes')}>Interações</div>
          </div>
          <div className="adm-sb-bottom">
            <div className="adm-user-row">
              <div className="adm-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{admin?.nome?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div>
                <div className="adm-user-name">{admin?.nome || 'Administrador'}</div>
                <div className="adm-user-role">{admin?.email}</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="adm-main">
          <div className="adm-inner">
            {secao === 'dashboard' && renderDashboard()}
            {secao === 'plantas' && renderPlantas()}
            {secao === 'especies' && renderEspecies()}
            {secao === 'interacoes' && renderInteracoes()}
          </div>
        </main>
      </div>
    </div>
  )
}

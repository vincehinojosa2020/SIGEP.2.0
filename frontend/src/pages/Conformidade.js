import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FileDown, FileSpreadsheet, Plus, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIPOS_RELATORIO = [
  'Producao Mensal', 'Emissoes Atmosfericas', 'Seguranca Operacional',
  'Integridade de Pocos', 'Monitoramento Ambiental', 'Abandono de Poco',
  'Teste de Producao', 'Relatorio de Incidentes', 'Auditoria de Processos',
  'Desempenho Operacional', 'Royalties e Participacoes', 'Movimentacao de Petroleo'
];

export default function Conformidade() {
  const { token } = useAuth();
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: '', periodo_inicio: '', periodo_fim: '' });
  const [creating, setCreating] = useState(false);

  const fetchRelatorios = () => {
    axios.get(`${API}/conformidade`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setRelatorios(res.data))
      .catch(err => console.log('Erro:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRelatorios(); }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API}/conformidade`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setForm({ tipo: '', periodo_inicio: '', periodo_fim: '' });
      fetchRelatorios();
    } catch (err) {
      alert('Erro ao criar relatorio: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCreating(false);
    }
  };

  const downloadFile = async (id, type) => {
    setDownloading(`${id}-${type}`);
    try {
      const response = await axios.get(`${API}/conformidade/${id}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_anp_${id.slice(0, 8)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao gerar arquivo.');
    } finally {
      setDownloading(null);
    }
  };

  const statusBadge = (status) => {
    const map = { 'Aprovado': 'success', 'Pendente': 'warning', 'Em Revisao': 'info' };
    return <span className={`badge badge-${map[status] || 'default'}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="content-header">
        <h1 data-testid="conformidade-title">Conformidade ANP <small>Relatorios regulatorios</small></h1>
      </div>
      <div className="content">
        <div className="mb-10">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} data-testid="new-report-button">
            <Plus size={12} /> Novo Relatorio
          </button>
        </div>

        {showForm && (
          <div className="panel" data-testid="conformidade-form-panel">
            <div className="panel-heading panel-green">
              <h3 className="panel-title">
                Gerar Novo Relatorio de Conformidade
                <button onClick={() => setShowForm(false)} style={{marginLeft:'auto',background:'none',border:'none',color:'#fff',cursor:'pointer'}}><X size={14} /></button>
              </h3>
            </div>
            <div className="panel-body">
              <form onSubmit={handleCreate} data-testid="conformidade-form">
                <div className="compliance-form">
                  <div className="form-group">
                    <label>Tipo de Relatorio</label>
                    <select className="form-control" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} required data-testid="report-tipo-select">
                      <option value="">Selecione...</option>
                      {TIPOS_RELATORIO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Periodo Inicio</label>
                    <input className="form-control" type="date" value={form.periodo_inicio} onChange={e => setForm({...form, periodo_inicio: e.target.value})} required data-testid="report-inicio-input" />
                  </div>
                  <div className="form-group">
                    <label>Periodo Fim</label>
                    <input className="form-control" type="date" value={form.periodo_fim} onChange={e => setForm({...form, periodo_fim: e.target.value})} required data-testid="report-fim-input" />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={creating} data-testid="report-submit-button">
                      {creating ? 'Gerando...' : 'Gerar Relatorio'}
                    </button>
                    <button type="button" className="btn btn-default" onClick={() => setShowForm(false)}>Cancelar</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="panel" data-testid="conformidade-panel">
          <div className="panel-heading">
            <h3 className="panel-title">Relatorios de Conformidade ({relatorios.length})</h3>
          </div>
          <div className="panel-body">
            {loading ? <p>Carregando...</p> : (
              <div className="table-responsive">
                <table className="table table-striped table-bordered" data-testid="conformidade-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Periodo</th>
                      <th>Data Geracao</th>
                      <th>No. ANP</th>
                      <th>Responsavel</th>
                      <th>Status</th>
                      <th>Exportar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorios.map(rel => (
                      <tr key={rel.id}>
                        <td><strong>{rel.tipo}</strong></td>
                        <td style={{fontSize:'10px'}}>{rel.periodo_inicio} a {rel.periodo_fim}</td>
                        <td>{rel.data_geracao}</td>
                        <td style={{fontSize:'10px',color:'#666'}}>{rel.numero_anp}</td>
                        <td>{rel.responsavel}</td>
                        <td>{statusBadge(rel.status)}</td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => downloadFile(rel.id, 'pdf')}
                              disabled={downloading === `${rel.id}-pdf`}
                              data-testid={`export-pdf-${rel.id.slice(0,8)}`}
                            >
                              <FileDown size={10} /> PDF
                            </button>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => downloadFile(rel.id, 'excel')}
                              disabled={downloading === `${rel.id}-excel`}
                              data-testid={`export-excel-${rel.id.slice(0,8)}`}
                            >
                              <FileSpreadsheet size={10} /> Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="panel-footer">
            Relatorios gerados conforme regulamentacao ANP - Agencia Nacional do Petroleo, Gas Natural e Biocombustiveis
          </div>
        </div>
      </div>
    </Layout>
  );
}

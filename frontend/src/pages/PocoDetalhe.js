import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ArrowLeft } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PocoDetalhe() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [poco, setPoco] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/pocos/${id}`, { headers }),
      axios.get(`${API}/producao/historico/${id}`, { headers })
    ])
      .then(([pocoRes, histRes]) => {
        setPoco(pocoRes.data);
        setHistorico(histRes.data);
      })
      .catch(err => console.log('Erro:', err))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Amostrar dados para chart (1 ponto a cada 7 dias para legibilidade)
  const chartData = historico
    .filter((_, i) => i % 7 === 0)
    .map(r => ({
      data: r.data?.slice(5) || '',
      bpd: Math.round(r.barris_por_dia),
      gas: Math.round(r.gas_m3_dia / 1000),
      agua: r.corte_agua_pct,
      psi: Math.round(r.pressao_psi)
    }));

  const statusBadge = (status) => {
    const map = { 'Ativo': 'success', 'Manutencao': 'warning', 'Inativo': 'danger' };
    return <span className={`badge badge-${map[status] || 'default'}`}>{status}</span>;
  };

  if (loading) return <Layout><div className="content"><p>Carregando dados do poco...</p></div></Layout>;
  if (!poco) return <Layout><div className="content"><p>Poco nao encontrado.</p></div></Layout>;

  return (
    <Layout>
      <div className="content-header">
        <h1 data-testid="poco-detalhe-title">
          <button onClick={() => navigate('/pocos')} className="btn btn-default btn-sm" style={{marginRight: '8px'}} data-testid="back-to-pocos">
            <ArrowLeft size={12} /> Voltar
          </button>
          Poco {poco.nome} <small>{poco.campo} - Bacia de {poco.bacia}</small>
        </h1>
      </div>
      <div className="content">
        <div className="panel" data-testid="poco-info-panel">
          <div className="panel-heading panel-dark">
            <h3 className="panel-title">Informacoes do Poco</h3>
          </div>
          <div className="panel-body">
            <div className="info-grid">
              <div className="info-item"><label>Nome</label><span>{poco.nome}</span></div>
              <div className="info-item"><label>Bacia</label><span>{poco.bacia}</span></div>
              <div className="info-item"><label>Campo</label><span>{poco.campo}</span></div>
              <div className="info-item"><label>Profundidade</label><span>{poco.profundidade?.toLocaleString('pt-BR')} m</span></div>
              <div className="info-item"><label>Status</label>{statusBadge(poco.status)}</div>
              <div className="info-item"><label>Tipo Elevacao</label><span>{poco.tipo_elevacao}</span></div>
              <div className="info-item"><label>Data Inicio</label><span>{poco.data_inicio}</span></div>
              <div className="info-item"><label>Coordenadas</label><span>{poco.coordenadas_lat?.toFixed(4)}, {poco.coordenadas_lon?.toFixed(4)}</span></div>
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <>
            <div className="panel" data-testid="producao-chart-panel">
              <div className="panel-heading">
                <h3 className="panel-title">Historico de Producao - Barris/dia (6 meses)</h3>
              </div>
              <div className="panel-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis dataKey="data" tick={{ fontSize: 9, fontFamily: 'Verdana' }} />
                    <YAxis tick={{ fontSize: 9, fontFamily: 'Verdana' }} />
                    <Tooltip contentStyle={{ fontFamily: 'Verdana', fontSize: '10px', border: '1px solid #999' }} />
                    <Area type="monotone" dataKey="bpd" name="Barris/dia" stroke="#00A859" fill="#00A859" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel" data-testid="gas-chart-panel">
              <div className="panel-heading">
                <h3 className="panel-title">Gas (x1000 m3/dia) e Corte de Agua (%)</h3>
              </div>
              <div className="panel-body">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis dataKey="data" tick={{ fontSize: 9, fontFamily: 'Verdana' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 9, fontFamily: 'Verdana' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontFamily: 'Verdana' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontFamily: 'Verdana', fontSize: '10px', border: '1px solid #999' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'Verdana' }} />
                    <Line yAxisId="left" type="monotone" dataKey="gas" name="Gas (x1000 m3/d)" stroke="#336699" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="agua" name="Corte Agua %" stroke="#cc9900" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        <div className="panel" data-testid="historico-table-panel">
          <div className="panel-heading">
            <h3 className="panel-title">Ultimos 30 Registros de Producao</h3>
          </div>
          <div className="panel-body">
            <div className="table-responsive">
              <table className="table table-striped table-bordered" data-testid="historico-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Barris/dia</th>
                    <th>Gas m3/dia</th>
                    <th>Corte Agua %</th>
                    <th>Pressao PSI</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.slice(-30).reverse().map((r, i) => (
                    <tr key={i}>
                      <td>{r.data}</td>
                      <td>{r.barris_por_dia?.toLocaleString('pt-BR')}</td>
                      <td>{r.gas_m3_dia?.toLocaleString('pt-BR')}</td>
                      <td>{r.corte_agua_pct}%</td>
                      <td>{r.pressao_psi?.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel-footer">
            Total de registros: {historico.length} | Periodo: {historico[0]?.data || '-'} a {historico[historico.length - 1]?.data || '-'}
          </div>
        </div>
      </div>
    </Layout>
  );
}

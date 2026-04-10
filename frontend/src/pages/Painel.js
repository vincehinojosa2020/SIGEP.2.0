import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Droplets, Flame, Gauge, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Painel() {
  const { token } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API}/producao/resumo`, { headers })
      .then(res => setResumo(res.data))
      .catch(err => console.log('Erro ao carregar resumo:', err))
      .finally(() => setLoading(false));
  }, [token]);

  const chartData = resumo?.registros
    ?.filter(r => r.barris_por_dia > 0)
    ?.sort((a, b) => b.barris_por_dia - a.barris_por_dia)
    ?.map(r => ({
      nome: r.poco_nome,
      bpd: Math.round(r.barris_por_dia),
      gas: Math.round(r.gas_m3_dia / 1000),
      agua: r.corte_agua_pct
    })) || [];

  const barColors = ['#00A859', '#336699', '#cc9900', '#339966', '#6699cc', '#996633', '#669933', '#3366cc', '#cc6633', '#33cc66', '#6633cc', '#cc3366', '#33cc99', '#9933cc'];

  return (
    <Layout>
      <div className="content-header">
        <h1 data-testid="painel-title">Painel de Controle <small>Monitoramento em Tempo Real</small></h1>
      </div>
      <div className="content" data-testid="painel-content">
        {loading ? (
          <p>Carregando dados de producao...</p>
        ) : (
          <>
            <div className="stat-boxes" data-testid="stat-boxes">
              <div className="stat-box stat-green" data-testid="stat-barris">
                <div className="stat-icon"><Droplets size={28} /></div>
                <div className="stat-info">
                  <span className="stat-number">{resumo?.total_barris_dia?.toLocaleString('pt-BR') || '0'}</span>
                  <span className="stat-label">Barris/dia</span>
                </div>
              </div>
              <div className="stat-box stat-blue" data-testid="stat-gas">
                <div className="stat-icon"><Flame size={28} /></div>
                <div className="stat-info">
                  <span className="stat-number">{resumo?.total_gas_m3_dia?.toLocaleString('pt-BR') || '0'}</span>
                  <span className="stat-label">Gas m3/dia</span>
                </div>
              </div>
              <div className="stat-box stat-yellow" data-testid="stat-agua">
                <div className="stat-icon"><Gauge size={28} /></div>
                <div className="stat-info">
                  <span className="stat-number">{resumo?.media_corte_agua || '0'}%</span>
                  <span className="stat-label">Corte Agua</span>
                </div>
              </div>
              <div className="stat-box stat-red" data-testid="stat-pressao">
                <div className="stat-icon"><Activity size={28} /></div>
                <div className="stat-info">
                  <span className="stat-number">{resumo?.media_pressao_psi?.toLocaleString('pt-BR') || '0'}</span>
                  <span className="stat-label">Pressao PSI</span>
                </div>
              </div>
            </div>

            <div className="panel" data-testid="chart-panel">
              <div className="panel-heading panel-dark">
                <h3 className="panel-title">Producao por Poco (barris/dia)</h3>
              </div>
              <div className="panel-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis dataKey="nome" tick={{ fontSize: 9, fontFamily: 'Verdana' }} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 9, fontFamily: 'Verdana' }} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'Verdana', fontSize: '10px', border: '1px solid #999' }}
                      formatter={(val, name) => [val.toLocaleString('pt-BR'), name === 'bpd' ? 'Barris/dia' : name]}
                    />
                    <Bar dataKey="bpd" name="Barris/dia">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={barColors[i % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel" data-testid="producao-panel">
              <div className="panel-heading">
                <h3 className="panel-title">Producao por Poco - Ultimo Registro</h3>
              </div>
              <div className="panel-body">
                <div className="table-responsive">
                  <table className="table table-striped table-bordered" data-testid="producao-table">
                    <thead>
                      <tr>
                        <th>Poco</th>
                        <th>Bacia</th>
                        <th>Status</th>
                        <th>Barris/dia</th>
                        <th>Gas m3/dia</th>
                        <th>Agua %</th>
                        <th>PSI</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumo?.registros?.sort((a, b) => b.barris_por_dia - a.barris_por_dia).map((reg, i) => (
                        <tr key={i}>
                          <td><strong>{reg.poco_nome}</strong></td>
                          <td>{reg.bacia}</td>
                          <td>
                            <span className={`badge badge-${reg.poco_status === 'Ativo' ? 'success' : reg.poco_status === 'Manutencao' ? 'warning' : 'danger'}`}>
                              {reg.poco_status}
                            </span>
                          </td>
                          <td>{reg.barris_por_dia?.toLocaleString('pt-BR')}</td>
                          <td>{reg.gas_m3_dia?.toLocaleString('pt-BR')}</td>
                          <td>{reg.corte_agua_pct}%</td>
                          <td>{reg.pressao_psi?.toLocaleString('pt-BR')}</td>
                          <td>{reg.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="panel-footer">
                {resumo?.total_pocos_ativos || 0} pocos ativos | Dados atualizados automaticamente
              </div>
            </div>

            <div className="system-status-bar">
              <span>SIGEP v2.4.1 | PetroNac S.A. | Servidor: APP-SIGEP-01</span>
              <span>Ultimo refresh: {new Date().toLocaleString('pt-BR')} | Uptime: 847d 14h 23m</span>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

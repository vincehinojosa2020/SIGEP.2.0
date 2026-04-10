import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Pocos() {
  const { token } = useAuth();
  const [pocos, setPocos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/pocos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPocos(res.data))
      .catch(err => console.log('Erro:', err))
      .finally(() => setLoading(false));
  }, [token]);

  const statusBadge = (status) => {
    const map = { 'Ativo': 'success', 'Manutencao': 'warning', 'Inativo': 'danger' };
    return <span className={`badge badge-${map[status] || 'default'}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="content-header">
        <h1 data-testid="pocos-title">Inventario de Pocos <small>Cadastro de pocos offshore</small></h1>
      </div>
      <div className="content">
        <div className="panel" data-testid="pocos-panel">
          <div className="panel-heading">
            <h3 className="panel-title">Pocos Cadastrados ({pocos.length})</h3>
          </div>
          <div className="panel-body">
            {loading ? <p>Carregando...</p> : (
              <div className="table-responsive">
                <table className="table table-striped table-bordered" data-testid="pocos-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Bacia</th>
                      <th>Campo</th>
                      <th>Prof. (m)</th>
                      <th>Status</th>
                      <th>Elevacao</th>
                      <th>Inicio</th>
                      <th>Coordenadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pocos.map(poco => (
                      <tr key={poco.id} data-testid={`poco-row-${poco.nome}`}>
                        <td><a href="#" onClick={(e) => { e.preventDefault(); navigate(`/pocos/${poco.id}`); }} style={{color:'#003366',fontWeight:'bold',textDecoration:'underline',cursor:'pointer'}} data-testid={`poco-link-${poco.nome}`}>{poco.nome}</a></td>
                        <td>{poco.bacia}</td>
                        <td>{poco.campo}</td>
                        <td>{poco.profundidade?.toLocaleString('pt-BR')}</td>
                        <td>{statusBadge(poco.status)}</td>
                        <td>{poco.tipo_elevacao}</td>
                        <td>{poco.data_inicio}</td>
                        <td className="text-muted" style={{fontSize: '11px'}}>
                          {poco.coordenadas_lat?.toFixed(4)}, {poco.coordenadas_lon?.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="panel-footer">
            Total: {pocos.length} pocos | Ativos: {pocos.filter(p => p.status === 'Ativo').length} | Manutencao: {pocos.filter(p => p.status === 'Manutencao').length}
          </div>
        </div>
      </div>
    </Layout>
  );
}

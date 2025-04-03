import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../../services/api';
import '../../css/Admin/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Administrador');
  const [pendingIncidents, setPendingIncidents] = useState(0);

  useEffect(() => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      const parsedInfo = JSON.parse(userInfo);
      setAdminName(parsedInfo.nombre || 'Administrador');
    }
    checkPendingIncidents();
  }, []);

  const checkPendingIncidents = async () => {
    try {
      const response = await api.get('/admin/incidencias');
      const pendingCount = response.data.filter(inc => inc.estado === 'pendiente').length;
      setPendingIncidents(pendingCount);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userInfo', { path: '/' });
    
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    window.location.href = '/';
  };

  return (
    <div className="admin-dashboard">
      <h1 className="welcome-title">
        Bienvenid@ {adminName}
      </h1>
      <h2 className="dashboard-subtitle">
        Seleccione una opción para gestionar
      </h2>

      <div className="dashboard-options">
        <div 
          className="dashboard-option" 
          onClick={() => navigate('/admin/usuarios')}
        >
          <i className="dashboard-icon">👥</i>
          <h3>Gestión de Usuarios</h3>
          <p>
            Administre usuarios, conductores y pasajeros
          </p>
        </div>
        
        <div 
          className="dashboard-option" 
          onClick={() => navigate('/admin/camiones')}
        >
          <i className="dashboard-icon">🚌</i>
          <h3>Gestión de Camiones</h3>
          <p>
            Registre y administre la flota de camiones
          </p>
        </div>

        <div 
          className="dashboard-option" 
          onClick={() => navigate('/admin/asignaciones')}
        >
          <i className="dashboard-icon">📅</i>
          <h3>Asignación de Conductores</h3>
          <p>
            Asigne conductores, horarios y rutas a los camiones
          </p>
        </div>

        <div 
          className="dashboard-option" 
          onClick={() => navigate('/admin/incidencias')}
        >
          <div className="icon-with-badge">
            <i className="dashboard-icon">⚠️</i>
            {pendingIncidents > 0 && (
              <span className="badge">{pendingIncidents}</span>
            )}
          </div>
          <h3>Incidencias</h3>
          <p>
            Gestione las incidencias reportadas
            {pendingIncidents > 0 && (
              <span className="pending-count">
                ({pendingIncidents} pendiente{pendingIncidents !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
      </div>

      <button 
        className="logout-button"
        onClick={handleLogout}
      >
        <i className="logout-icon">🚪</i>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default AdminDashboard;
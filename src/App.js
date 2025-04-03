import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import Login from './components/Login/Login.jsx';
import RecuperarPassword from './components/PasswordRecovery/RecuperarPassword';
import Pasajero from './components/Pasajero/DashboardPasajero';
import Conductor from './components/Conductor/DashboardConductor';
import AdminDashboard from './components/Admin/AdminDashboard';
import GestionUsuarios from './components/Admin/GestionUsuarios';
import GestionCamiones from './components/Admin/GestionCamiones';
import AsignacionConductores from './components/Admin/AsignacionConductores';
import GestionIncidencias from './components/Admin/GestionIncidencias';
import './App.css';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = Cookies.get('token');
  const userInfo = Cookies.get('userInfo');

  useEffect(() => {
    console.log('Protected Route Check:', { token, userInfo, allowedRole });
    
    // Validate token format
    if (token && (!token.startsWith('eyJ') || token.split('.').length !== 3)) {
      console.log('Invalid token format, clearing cookies');
      Cookies.remove('token', { path: '/' });
      Cookies.remove('userInfo', { path: '/' });
      window.location.href = '/';
      return;
    }
  }, [token, userInfo, allowedRole]);

  if (!token || !userInfo) {
    console.log('No token or userInfo found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userInfo);
    console.log('User role:', user.rol, 'Required role:', allowedRole);
    
    if (allowedRole && user.rol !== allowedRole) {
      console.log('Role mismatch, redirecting to login');
      Cookies.remove('token', { path: '/' });
      Cookies.remove('userInfo', { path: '/' });
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    console.error('Error parsing user info:', error);
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userInfo', { path: '/' });
    return <Navigate to="/" replace />;
  }
};

const App = () => {
  useEffect(() => {
    const token = Cookies.get('token');
    const userInfo = Cookies.get('userInfo');
    console.log('App Initial State:', { 
      hasToken: !!token, 
      hasUserInfo: !!userInfo 
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        
        {/* Rutas del Administrador */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRole="admin">
              <GestionUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/camiones"
          element={
            <ProtectedRoute allowedRole="admin">
              <GestionCamiones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/asignaciones"
          element={
            <ProtectedRoute allowedRole="admin">
              <AsignacionConductores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/incidencias"
          element={
            <ProtectedRoute allowedRole="admin">
              <GestionIncidencias />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Conductor y Pasajero */}
        <Route
          path="/conductor/*"
          element={
            <ProtectedRoute allowedRole="conductor">
              <Conductor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pasajero/*"
          element={
            <ProtectedRoute allowedRole="pasajero">
              <Pasajero />
            </ProtectedRoute>
          }
        />
        
        {/* Ruta para manejar páginas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
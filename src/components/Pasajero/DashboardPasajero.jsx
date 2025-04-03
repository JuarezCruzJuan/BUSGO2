import React, { useState, useEffect } from 'react';
import '../../css/Pasajero/DashboardPasajero.css';
import { Dialog, DialogContent, Button } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { Logout } from '@mui/icons-material';
import Cookies from 'js-cookie';
import api from '../../services/api';

const DashboardPasajero = () => {
  const [camiones, setCamiones] = useState([]);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [openMap, setOpenMap] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    cargarCamiones();
    // Actualizar ubicaciones cada 2 minutos
    const interval = setInterval(cargarCamiones, 120000);
    return () => clearInterval(interval);
  }, []);

  const cargarCamiones = async () => {
    try {
      const response = await api.get('/camiones');
      const camionesActivos = response.data
        .filter(camion => camion.estado === 'activo' && camion.ubicacion)
        .map(camion => ({
          ...camion,
          ubicacion: camion.ubicacion ? {
            ...camion.ubicacion,
            lat: Number(camion.ubicacion.lat),
            lng: Number(camion.ubicacion.lng)
          } : null
        }));
      setCamiones(camionesActivos);
    } catch (error) {
      console.error('Error al cargar camiones:', error);
      setError('Error al cargar la información de los camiones');
    }
  };

  const camionesFiltrados = camiones.filter(camion => 
    camion.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
    camion.ruta.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleOpenMap = (camion) => {
    setSelectedCamion(camion);
    setOpenMap(true);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const handleLogout = () => {
    // Remove cookies with path
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userInfo', { path: '/' });
    
    // Force clear any remaining cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Force page refresh and navigation
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container">
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleLogout}
        startIcon={<Logout />}
        sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20 
        }}
      >
        Cerrar Sesión
      </Button>
    <h1 className="dashboard-header">
      Rutas Disponibles
    </h1>

    <div className="search-container">
      <input
        className="search-input"
        placeholder="Buscar por placa o ruta..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
    </div>

    <div className="bus-grid">
      {camionesFiltrados.map((camion) => (
        <div className="bus-card" key={camion._id}>
          <div className="bus-card-header">
            <span className="bus-icon">🚌</span>
            Ruta: {camion.ruta}
          </div>
          <div className="bus-card-content">
            <ul className="info-list">
              <li className="info-item">
                <div className="info-label">Placa</div>
                <div className="info-value">{camion.placa}</div>
              </li>
              <li className="info-item">
                <div className="info-label">Horario</div>
                <div className="info-value">{`${camion.horarioInicio} - ${camion.horarioFin}`}</div>
              </li>
              <li className="info-item">
                <div className="info-label">Última ubicación</div>
                <div className="info-value">
                  {camion.ubicacion ? 
                    `Lat: ${Number(camion.ubicacion.lat).toFixed(6)}, Lng: ${Number(camion.ubicacion.lng).toFixed(6)}` :
                    'No disponible'
                  }
                </div>
                {camion.ubicacion && (
                  <button
                    className="map-button"
                    onClick={() => handleOpenMap(camion)}
                  >
                    🗺️ Ver en Mapa
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      ))}
    </div>

      <Dialog
        open={openMap}
        onClose={() => setOpenMap(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedCamion && (
            <LoadScript googleMapsApiKey="AIzaSyCSQgD0WIKsinTPjJCagpvZ2SnQrHOdz1o">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{
                  lat: selectedCamion.ubicacion.lat,
                  lng: selectedCamion.ubicacion.lng
                }}
                zoom={15}
              >
                <Marker
                  position={{
                    lat: selectedCamion.ubicacion.lat,
                    lng: selectedCamion.ubicacion.lng
                  }}
                  title={`${selectedCamion.placa} - ${selectedCamion.ruta}`}
                />
              </GoogleMap>
            </LoadScript>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPasajero;
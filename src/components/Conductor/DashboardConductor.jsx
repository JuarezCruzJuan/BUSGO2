import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Container,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  CircularProgress
} from '@mui/material';
import { DirectionsBus, Warning, LocationOn, Error, Logout, Image } from '@mui/icons-material';
import api from '../../services/api';
import '../../css/Conductor/DashboardConductor.css';

const DashboardConductor = () => {
  const navigate = useNavigate();
  const [conductor, setConductor] = useState(null);
  const [camionAsignado, setCamionAsignado] = useState(null);
  const [openIncidencia, setOpenIncidencia] = useState(false);
  const [incidencia, setIncidencia] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [ubicacion, setUbicacion] = useState({ lat: '', lng: '' });
  const [incidenciasPendientes, setIncidenciasPendientes] = useState([]);
  const [imagenIncidencia, setImagenIncidencia] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [imagenDialog, setImagenDialog] = useState({ open: false, url: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await cargarDatosConductor();
      await cargarIncidenciasPendientes();
      setIsLoading(false);
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!camionAsignado) return;
    
    const locationInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        actualizarUbicacion(false);
      }
    }, 120000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        actualizarUbicacion(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(locationInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [camionAsignado?._id]);

  const actualizarUbicacion = async (showNotification = true) => {
    if (!camionAsignado || isLoading) return;
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const nuevaUbicacion = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          await api.put('/conductor/ubicacion', {
            ubicacion: nuevaUbicacion,
            camionId: camionAsignado._id
          });
          setUbicacion(nuevaUbicacion);
          
          if (showNotification) {
            setSnackbar({
              open: true,
              message: 'Ubicación actualizada correctamente',
              severity: 'success'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
      if (showNotification) {
        setSnackbar({
          open: true,
          message: 'Error al actualizar la ubicación',
          severity: 'error'
        });
      }
    }
  };

  const cargarIncidenciasPendientes = async () => {
    if (isLoading) return;
    
    try {
      const response = await api.get('/conductor/incidencias-pendientes');
      setIncidenciasPendientes(response.data);
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
    }
  };

  const cargarDatosConductor = async () => {
    if (isLoading) return;
    
    try {
      const token = Cookies.get('token');
      const response = await api.get('/conductor/info');
      
      if (!response.data.conductor || response.data.conductor.rol !== 'conductor') {
        setSnackbar({
          open: true,
          message: 'No tienes permisos de conductor',
          severity: 'error'
        });
        return;
      }

      setConductor(response.data.conductor);
      setCamionAsignado(response.data.camionAsignado);
      setIncidenciasPendientes(response.data.incidenciasPendientes || []);
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al cargar los datos',
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    Cookies.remove('token', { secure: true, sameSite: 'strict' });
    Cookies.remove('userInfo', { secure: true, sameSite: 'strict' });
    navigate('/');
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const reportarIncidencia = async () => {
    try {
      let imagenBase64 = null;
      
      if (imagenIncidencia) {
        imagenBase64 = await fileToBase64(imagenIncidencia);
      }

      await api.post('/conductor/incidencias', {
        descripcion: incidencia,
        camionId: camionAsignado._id,
        imagen: imagenBase64
      });

      setSnackbar({
        open: true,
        message: 'Incidencia reportada correctamente',
        severity: 'success'
      });
      setOpenIncidencia(false);
      setIncidencia('');
      setImagenIncidencia(null);
      setPreviewImagen(null);
      cargarIncidenciasPendientes();
    } catch (error) {
      console.error('Error al reportar incidencia:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al reportar la incidencia',
        severity: 'error'
      });
    }
  };

  const handleImagenChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImagenIncidencia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagen(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Container className="dashboard-container fade-in">
      <Button 
        variant="contained" 
        color="error" 
        onClick={handleLogout}
        startIcon={<Logout />}
        className="logout-button"
      >
        Cerrar Sesión
      </Button>

      <div className="dashboard-header">
        <Typography variant="h4" gutterBottom>
          Dashboard del Conductor
        </Typography>
      </div>

      {incidenciasPendientes.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<Error />}
          className="dashboard-alert"
        >
          Tienes {incidenciasPendientes.length} incidencia(s) pendiente(s) de resolución
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-header">
                <DirectionsBus />
                <Typography variant="h6">
                  Información del Camión Asignado
                </Typography>
              </div>
              {camionAsignado ? (
                <List className="info-list">
                  <ListItem>
                    <ListItemText 
                      primary="Placa" 
                      secondary={camionAsignado.placa || 'No disponible'} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Ruta" 
                      secondary={camionAsignado.ruta || 'No disponible'} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Horario" 
                      secondary={
                        camionAsignado.horarioInicio && camionAsignado.horarioFin 
                          ? `${camionAsignado.horarioInicio} - ${camionAsignado.horarioFin}`
                          : 'No disponible'
                      } 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Días de trabajo" 
                      secondary={
                        camionAsignado.diasTrabajo && camionAsignado.diasTrabajo.length > 0
                          ? camionAsignado.diasTrabajo.join(', ')
                          : 'No disponible'
                      } 
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography className="no-data">No hay camión asignado</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-header">
                <Typography variant="h6">Acciones</Typography>
              </div>
              <Box className="action-buttons">
                <Button 
                  className="action-button location-button"
                  startIcon={<LocationOn />}
                  onClick={() => actualizarUbicacion(true)}
                  disabled={!camionAsignado}
                >
                  Actualizar Ubicación
                </Button>
                <Button 
                  className="action-button incident-button"
                  startIcon={<Warning />}
                  onClick={() => setOpenIncidencia(true)}
                  disabled={!camionAsignado}
                >
                  Reportar Incidencia
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="dashboard-card">
            <CardContent>
              <div className="card-header">
                <Warning />
                <Typography variant="h6">
                  Incidencias Pendientes
                </Typography>
              </div>
              {incidenciasPendientes.length > 0 ? (
                <List className="incident-list">
                  {incidenciasPendientes.map((inc) => (
                    <ListItem key={inc._id} className="incident-item">
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                          <Typography variant="subtitle1" className="incident-title">
                            Descripción:
                          </Typography>
                          <Typography className="incident-description">
                            {inc.descripcion}
                          </Typography>
                          <Typography variant="caption" className="incident-date">
                            Reportada el: {new Date(inc.fecha).toLocaleDateString()} {new Date(inc.fecha).toLocaleTimeString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          {inc.imagen && (
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<Image />}
                              className="view-image-button"
                              onClick={() => {
                                const imageUrl = inc.imagen.startsWith('data:image') 
                                  ? inc.imagen 
                                  : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${inc.imagen}`;
                                setImagenDialog({ open: true, url: imageUrl });
                              }}
                            >
                              Ver imagen
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography className="no-data">No hay incidencias pendientes</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={openIncidencia} 
        onClose={() => setOpenIncidencia(false)} 
        maxWidth="sm" 
        fullWidth
        className="incident-dialog"
      >
        <DialogTitle className="dialog-title">
          Reportar Incidencia
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descripción de la incidencia"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={incidencia}
            onChange={(e) => setIncidencia(e.target.value)}
            variant="outlined"
            className="incident-input"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<Image />}
            className="upload-button"
          >
            Adjuntar Imagen
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImagenChange}
            />
          </Button>
          {previewImagen && (
            <Box className="image-preview-container">
              <img 
                src={previewImagen} 
                alt="Vista previa" 
                className="image-preview"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setOpenIncidencia(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={reportarIncidencia} 
            variant="contained" 
            color="primary"
            disabled={!incidencia.trim()}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={imagenDialog.open} 
        onClose={() => setImagenDialog({ open: false, url: '' })}
        maxWidth="lg"
        className="image-dialog"
      >
        <DialogContent>
          {imagenDialog.url && (
            <img 
              src={imagenDialog.url} 
              alt="Imagen de incidencia" 
              className="full-image"
              onError={(e) => {
                console.error('Error loading image:', e);
                e.target.src = 'https://via.placeholder.com/400x300?text=Error+al+cargar+imagen';
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagenDialog({ open: false, url: '' })}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          className="snackbar-alert"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {isLoading && (
        <div className="loading-overlay">
          <CircularProgress />
        </div>
      )}
    </Container>
  );
};

export default DashboardConductor;
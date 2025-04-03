import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  List,
  ListItem,
  Paper,
  Grid,
  Snackbar,
  Alert,
  Pagination,
  Box,
  Chip,
} from '@mui/material';
import { Search, Image } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../../css/Admin/GestionIncidencias.css';
import { Dialog, DialogContent, DialogActions } from '@mui/material';

const GestionIncidencias = () => {
  const navigate = useNavigate();
  const [incidencias, setIncidencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;
  const [imagenDialog, setImagenDialog] = useState({ open: false, url: '' });

  useEffect(() => {
    cargarIncidencias();
    // Add cargarIncidencias to the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para ordenar incidencias por el número de ruta del camión (de menor a mayor)
  const ordenarIncidenciasPorRuta = (incidenciasArray) => {
    return [...incidenciasArray].sort((a, b) => {
      // Si alguno no tiene camión o ruta, ponerlo al final
      if (!a.camionId?.ruta) return 1;
      if (!b.camionId?.ruta) return -1;
      
      // Extraer la parte numérica de la ruta si existe
      const numA = a.camionId.ruta.match(/(\d+)/)?.[1] || '0';
      const numB = b.camionId.ruta.match(/(\d+)/)?.[1] || '0';
      
      // Convertir a números enteros y comparar (orden ascendente)
      return parseInt(numA, 10) - parseInt(numB, 10);
    });
  };

  const cargarIncidencias = async () => {
    try {
      const response = await api.get('/admin/incidencias');
      // Ordenar las incidencias por ruta antes de establecerlas en el estado
      const incidenciasOrdenadas = ordenarIncidenciasPorRuta(response.data);
      setIncidencias(incidenciasOrdenadas);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cargar incidencias',
        severity: 'error'
      });
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const actualizarEstadoIncidencia = async (id, nuevoEstado) => {
    try {
      console.log(`Updating incidencia ${id} to status: ${nuevoEstado}`);
      await api.put(`/admin/incidencias/${id}`, { estado: nuevoEstado });
      cargarIncidencias();
      setSnackbar({
        open: true,
        message: 'Estado actualizado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating incidencia:', error.response || error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el estado',
        severity: 'error'
      });
    }
  };

  const incidenciasFiltradas = incidencias.filter(incidencia => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || incidencia.estado === filtroEstado;
    const cumpleBusqueda = 
      (incidencia.descripcion?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (incidencia.conductorId?.nombre?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (incidencia.camionId?.placa?.toLowerCase() || '').includes(busqueda.toLowerCase()) ||
      (incidencia.camionId?.ruta?.toLowerCase() || '').includes(busqueda.toLowerCase());
    
    return cumpleFiltroEstado && cumpleBusqueda;
  });

  const incidenciasPaginadas = incidenciasFiltradas.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  return (
    <Container className="admin-container">
      <Button 
        variant="contained" 
        onClick={() => navigate('/admin')} 
        className="back-button"
        style={{ marginBottom: '20px' }}
      >
        Volver al Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        Gestión de Incidencias
      </Typography>

      <Paper elevation={3} className="paper-style">
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Buscar por descripción, conductor, placa o ruta"
              variant="outlined"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Select
              fullWidth
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="todos">Todos los estados</MenuItem>
              <MenuItem value="pendiente">Pendientes</MenuItem>
              <MenuItem value="en_proceso">En Proceso</MenuItem>
              <MenuItem value="resuelta">Resueltas</MenuItem>
            </Select>
          </Grid>
        </Grid>

        <List>
          {incidenciasPaginadas.map((incidencia) => (
            <ListItem
              key={incidencia._id}
              divider
              data-estado={incidencia.estado}
              sx={{
                backgroundColor: 
                  incidencia.estado === 'pendiente' ? '#fff3e0' :
                  incidencia.estado === 'en_proceso' ? '#e3f2fd' :
                  incidencia.estado === 'resuelta' ? '#e8f5e9' : 'inherit'
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Descripción:
                  </Typography>
                  <Typography>{incidencia.descripcion}</Typography>
                  {incidencia.imagen && (
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<Image />}
                      onClick={() => {
                        // Check if the image is already a base64 string
                        const imageUrl = incidencia.imagen.startsWith('data:image') 
                          ? incidencia.imagen 
                          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${incidencia.imagen}`;
                        
                        console.log('Opening image:', imageUrl.substring(0, 50) + '...'); // Log just the beginning for debugging
                        
                        setImagenDialog({ 
                          open: true, 
                          url: imageUrl
                        });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Ver imagen
                    </Button>
                  )}
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Conductor:
                  </Typography>
                  <Typography>
                    {incidencia.conductorId?.nombre || 'No disponible'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Camión:
                  </Typography>
                  <Typography>
                    {incidencia.camionId ? (
                      <>
                        <strong>Placa:</strong> {typeof incidencia.camionId.placa === 'string' ? incidencia.camionId.placa : 'N/A'}<br />
                        <strong>Ruta:</strong> {typeof incidencia.camionId.ruta === 'string' ? incidencia.camionId.ruta : 'N/A'}
                      </>
                    ) : (
                      'Información no disponible'
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Estado actual: <strong>{incidencia.estado}</strong>
                    </Typography>
                    {incidencia.estado === 'pendiente' && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => actualizarEstadoIncidencia(incidencia._id, 'en_proceso')}
                        title="Indica que se está trabajando en resolver la incidencia"
                      >
                        Iniciar Atención
                      </Button>
                    )}
                    {incidencia.estado === 'en_proceso' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => actualizarEstadoIncidencia(incidencia._id, 'resuelta')}
                          title="La incidencia ha sido solucionada"
                        >
                          Marcar Resuelta
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() => actualizarEstadoIncidencia(incidencia._id, 'pendiente')}
                          title="Volver a estado pendiente si se requiere más atención"
                        >
                          Volver a Pendiente
                        </Button>
                      </>
                    )}
                    {incidencia.estado === 'resuelta' && (
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => actualizarEstadoIncidencia(incidencia._id, 'pendiente')}
                        title="Reabrir la incidencia si el problema persiste"
                      >
                        Reabrir Incidencia
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Chip 
                    label={`Reportada el: ${new Date(incidencia.fecha).toLocaleDateString()} ${new Date(incidencia.fecha).toLocaleTimeString()}`}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={Math.ceil(incidenciasFiltradas.length / elementosPorPagina)}
            page={paginaActual}
            onChange={(e, pagina) => setPaginaActual(pagina)}
          />
        </Box>
      </Paper>

      {/* Diálogo para ver imagen completa */}
      <Dialog 
  open={imagenDialog.open} 
  onClose={() => setImagenDialog({ open: false, url: '' })}
  maxWidth="lg"
>
  <DialogContent>
    {imagenDialog.url && (
      <img 
        src={imagenDialog.url} 
        alt="Imagen de incidencia" 
        style={{ width: '100%', maxHeight: '80vh' }} 
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
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionIncidencias;

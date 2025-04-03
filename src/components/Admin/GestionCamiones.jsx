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
  ListItemText,
  Paper,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Box
} from '@mui/material';
import { Edit, Delete, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../../css/Admin/GestionCamiones.css';

const GestionCamiones = () => {
  const navigate = useNavigate();
  const [camiones, setCamiones] = useState([]);
  const [nuevoCamion, setNuevoCamion] = useState({ 
    placa: '', 
    ruta: '', 
    estado: 'activo',
    horarioInicio: '05:00',
    horarioFin: '22:00',
    diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
  });
  const [busquedaCamiones, setBusquedaCamiones] = useState('');
  const [camionEditando, setCamionEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoEliminar, setDialogoEliminar] = useState({ open: false, tipo: '', id: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paginaCamiones, setPaginaCamiones] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // Nuevo estado para filtrar por estado
  const elementosPorPagina = 5;

  // Move ordenarCamiones and fetchData before useEffect
  const ordenarCamiones = (camionesArray) => {
    return [...camionesArray].sort((a, b) => {
      const numA = a.ruta.match(/(\d+)/)?.[1] || '0';
      const numB = b.ruta.match(/(\d+)/)?.[1] || '0';
      return parseInt(numA, 10) - parseInt(numB, 10);
    });
  };

  const fetchData = async () => {
    try {
      const camionesResponse = await api.get('/camiones');
      const camionesFormateados = camionesResponse.data.map(camion => ({
        ...camion,
        placa: camion.placa || 'Sin placa',
        ruta: camion.ruta || 'Sin ruta'
      }));
      const camionesSorted = ordenarCamiones(camionesFormateados);
      setCamiones(camionesSorted);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al cargar datos',
        severity: 'error'
      });
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Remove fetchData from dependency array

  const validarCamion = () => {
    const nuevosErrores = {};
    if (!nuevoCamion.placa.trim()) nuevosErrores.placa = 'La placa es requerida';
    if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(nuevoCamion.placa)) nuevosErrores.placa = 'Formato de placa no válido (ej: ABP468B)';
    if (!nuevoCamion.ruta.trim()) nuevosErrores.ruta = 'La ruta es requerida';
    if (nuevoCamion.ruta.length < 2) nuevosErrores.ruta = 'La ruta debe tener al menos 2 caracteres';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarCamion = async () => {
    try {
      // Make sure placa follows the format: 3 uppercase letters + 3 digits + 1 uppercase letter
      if (!/^[A-Z]{3}\d{3}[A-Z]$/.test(nuevoCamion.placa)) {
        setSnackbar({
          open: true,
          message: 'Formato de placa no válido (ej: ABC123D)',
          severity: 'error'
        });
        return;
      }
  
      // Make sure ruta is not empty
      if (!nuevoCamion.ruta || !nuevoCamion.ruta.trim()) {
        setSnackbar({
          open: true,
          message: 'La ruta es requerida',
          severity: 'error'
        });
        return;
      }
  
      // Make sure estado is valid
      if (!['activo', 'inactivo'].includes(nuevoCamion.estado)) {
        setSnackbar({
          open: true,
          message: 'Estado no válido',
          severity: 'error'
        });
        return;
      }
  
      // Make sure horarioInicio and horarioFin are in the correct format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(nuevoCamion.horarioInicio)) {
        setSnackbar({
          open: true,
          message: 'Formato de hora inicio no válido (HH:mm)',
          severity: 'error'
        });
        return;
      }
      if (!timeRegex.test(nuevoCamion.horarioFin)) {
        setSnackbar({
          open: true,
          message: 'Formato de hora fin no válido (HH:mm)',
          severity: 'error'
        });
        return;
      }
  
      // Make sure diasTrabajo is an array of valid days
      const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      if (!Array.isArray(nuevoCamion.diasTrabajo) || 
          !nuevoCamion.diasTrabajo.every(dia => diasValidos.includes(dia))) {
        setSnackbar({
          open: true,
          message: 'Días de trabajo no válidos',
          severity: 'error'
        });
        return;
      }
  
      // If all validations pass, send the request
      const response = await api.post('/camiones', nuevoCamion);
      
      // Ensure we're using the decrypted values from the response
      const camionAgregado = {
        ...response.data,
        placa: response.data.placa || 'Sin placa',
        ruta: response.data.ruta || 'Sin ruta'
      };
      
      // Add the new truck and sort the list
      const camionesSorted = ordenarCamiones([...camiones, camionAgregado]);
      setCamiones(camionesSorted);
      
      // Reset form and show success message
      setNuevoCamion({
        placa: '',
        ruta: '',
        estado: 'activo',
        conductor: null,
        horarioInicio: '05:00',
        horarioFin: '22:00',
        diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
      });
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Camión agregado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error completo:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al agregar camión',
        severity: 'error'
      });
    }
  };

  const actualizarCamion = async (id, datosActualizados) => {
    try {
      if (!datosActualizados.placa?.trim() || !datosActualizados.ruta?.trim()) {
        throw new Error('La placa y la ruta son campos requeridos');
      }

      const datosFiltrados = {
        placa: datosActualizados.placa.trim().toUpperCase(),
        ruta: datosActualizados.ruta.trim().toUpperCase(),
        estado: datosActualizados.estado || 'activo',
      };

      const response = await api.put(`/camiones/${id}`, datosFiltrados);
      
      setCamiones(prevCamiones => 
        prevCamiones.map(camion => camion._id === id ? response.data : camion)
      );
      
      setSnackbar({
        open: true,
        message: 'Camión actualizado correctamente',
        severity: 'success'
      });
      
      setCamionEditando(null);
      await fetchData();
    } catch (error) {
      console.error('Error completo:', error);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.message || 'Error al actualizar camión',
        severity: 'error'
      });
    }
  };

  const confirmarEliminacion = (id) => {
    setDialogoEliminar({ open: true, tipo: 'camion', id });
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar({ open: false, tipo: '', id: '' });
  };

  const ejecutarEliminacion = async () => {
    try {
      await api.delete(`/camiones/${dialogoEliminar.id}`);
      setCamiones(camiones.filter(camion => camion._id !== dialogoEliminar.id));
      setSnackbar({
        open: true,
        message: 'Camión eliminado correctamente',
        severity: 'success'
      });
      cerrarDialogoEliminar();
      fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al eliminar el camión',
        severity: 'error'
      });
    }
  };

  // Modificar la función de filtrado para incluir el filtro por estado
  const camionesFiltrados = camiones.filter(camion => {
    // Filtrar por texto de búsqueda (placa o ruta)
    const coincideTexto = 
      camion.placa.toLowerCase().includes(busquedaCamiones.toLowerCase()) ||
      camion.ruta.toLowerCase().includes(busquedaCamiones.toLowerCase());
    
    // Filtrar por estado (activo, inactivo o todos)
    const coincideEstado = 
      filtroEstado === 'todos' || 
      camion.estado === filtroEstado;
    
    // Debe cumplir ambas condiciones
    return coincideTexto && coincideEstado;
  });

  const camionesPaginados = camionesFiltrados.slice(
    (paginaCamiones - 1) * elementosPorPagina,
    paginaCamiones * elementosPorPagina
  );

  // Función para manejar el cambio de filtro de estado
  const handleFiltroEstadoChange = (event) => {
    setFiltroEstado(event.target.value);
    setPaginaCamiones(1); // Resetear a la primera página al cambiar el filtro
  };

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
        Gestión de Camiones
      </Typography>
  
      <Paper elevation={3} className="paper-style">
        <Grid container spacing={2} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Buscar por placa o ruta"
              variant="outlined"
              fullWidth
              value={busquedaCamiones}
              onChange={(e) => setBusquedaCamiones(e.target.value)}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={filtroEstado}
                onChange={handleFiltroEstadoChange}
                label="Filtrar por estado"
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="inactivo">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom className="form-section-title">
          Formulario para Agregar Nuevo Camión
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Placa"
              variant="outlined"
              fullWidth
              value={nuevoCamion.placa}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, placa: e.target.value })}
              error={!!errores.placa}
              helperText={errores.placa}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ruta"
              variant="outlined"
              fullWidth
              value={nuevoCamion.ruta}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, ruta: e.target.value })}
              error={!!errores.ruta}
              helperText={errores.ruta}
              className="text-field"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Select
              value={nuevoCamion.estado}
              onChange={(e) => setNuevoCamion({ ...nuevoCamion, estado: e.target.value })}
              fullWidth
              variant="outlined"
              error={!!errores.estado}
              className="text-field"
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" className="button-primary" onClick={agregarCamion} fullWidth>
              Agregar
            </Button>
          </Grid>
        </Grid>
        <List>
          {camionesPaginados.length > 0 ? (
            camionesPaginados.map(camion => (
              <ListItem key={camion._id} divider>
                <ListItemText
                  primary={`${camion.placa} - ${camion.ruta}`}
                  secondary={`Estado: ${camion.estado === 'activo' ? 'Activo' : 'Inactivo'}`}
                />
                <IconButton className="icon-button" onClick={() => setCamionEditando(camion)}>
                  <Edit />
                </IconButton>
                <IconButton className="icon-button" onClick={() => confirmarEliminacion(camion._id)}>
                  <Delete />
                </IconButton>
              </ListItem>
            ))
          ) : (
            <Box p={2} textAlign="center">
              <Typography variant="body1" color="textSecondary">
                No se encontraron camiones con los filtros aplicados
              </Typography>
            </Box>
          )}
        </List>
        {camionesFiltrados.length > elementosPorPagina && (
          <Pagination
            count={Math.ceil(camionesFiltrados.length / elementosPorPagina)}
            page={paginaCamiones}
            onChange={(e, value) => setPaginaCamiones(value)}
            className="pagination"
          />
        )}
      </Paper>

      {/* Diálogo para editar camión */}
      <Dialog open={!!camionEditando} onClose={() => setCamionEditando(null)}>
        <DialogTitle>Editar Camión</DialogTitle>
        <DialogContent>
          {camionEditando && (
            <Grid container spacing={2} style={{ marginTop: '8px' }}>
              <Grid item xs={12}>
                <TextField
                  label="Placa"
                  fullWidth
                  value={camionEditando.placa}
                  onChange={(e) => setCamionEditando({...camionEditando, placa: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ruta"
                  fullWidth
                  value={camionEditando.ruta}
                  onChange={(e) => setCamionEditando({...camionEditando, ruta: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <Select
                  value={camionEditando.estado}
                  onChange={(e) => setCamionEditando({...camionEditando, estado: e.target.value})}
                  fullWidth
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCamionEditando(null)}>Cancelar</Button>
          <Button 
            onClick={() => actualizarCamion(camionEditando._id, camionEditando)}
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <Dialog open={dialogoEliminar.open} onClose={cerrarDialogoEliminar}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar este camión? Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoEliminar}>Cancelar</Button>
          <Button onClick={ejecutarEliminacion} color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionCamiones;
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
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { Edit, Save, DirectionsBus, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// Change this line
import '../../css/Admin/GestionCamiones.css';
// To this
import '../../css/Admin/AsignacionConductores.css';

const AsignacionConductores = () => {
  const navigate = useNavigate();
  const [camiones, setCamiones] = useState([]);
  const [conductoresDisponibles, setConductoresDisponibles] = useState([]);
  const [busquedaCamiones, setBusquedaCamiones] = useState('');
  const [camionEditando, setCamionEditando] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paginaCamiones, setPaginaCamiones] = useState(1);
  const [tabActiva, setTabActiva] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // Nuevo estado para filtrar por estado
  const elementosPorPagina = 5;

  // Move ordenarCamiones before fetchData
  const ordenarCamiones = (camionesArray) => {
    return [...camionesArray].sort((a, b) => {
      const numA = a.ruta.match(/(\d+)/)?.[1] || '0';
      const numB = b.ruta.match(/(\d+)/)?.[1] || '0';
      return parseInt(numA, 10) - parseInt(numB, 10);
    });
  };

  // Define fetchData using useCallback
  const fetchData = React.useCallback(async () => {
    try {
      const [camionesResponse, conductoresResponse] = await Promise.all([
        api.get('/camiones'),
        api.get('/conductores-disponibles')
      ]);

      const camionesFormateados = camionesResponse.data.map(camion => ({
        ...camion,
        placa: camion.placa || 'Sin placa',
        ruta: camion.ruta || 'Sin ruta'
      }));

      const camionesSorted = ordenarCamiones(camionesFormateados);
      setCamiones(camionesSorted);
      setConductoresDisponibles(conductoresResponse.data);
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
  }, [navigate]); // Add navigate as dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actualizarAsignacion = async (id, datosActualizados) => {
    try {
      // Preparar datos para actualización
      const datosFiltrados = {
        conductor: datosActualizados.conductor?._id || datosActualizados.conductor || null,
        horarioInicio: datosActualizados.horarioInicio || '05:00',
        horarioFin: datosActualizados.horarioFin || '22:00',
        diasTrabajo: Array.isArray(datosActualizados.diasTrabajo) ? 
          datosActualizados.diasTrabajo : 
          ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
      };
  
      // Fix: Add the /api prefix to the URL
      const response = await api.put(`/api/camiones/asignacion/${id}`, datosFiltrados);
      
      setCamiones(prevCamiones => 
        prevCamiones.map(camion => camion._id === id ? response.data : camion)
      );
      
      setSnackbar({
        open: true,
        message: 'Asignación actualizada correctamente',
        severity: 'success'
      });
      
      setCamionEditando(null);
      await fetchData();
    } catch (error) {
      console.error('Error completo:', error);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.message || 'Error al actualizar asignación',
        severity: 'error'
      });
    }
  };

  // Filtrar camiones asignados y sin asignar
  const camionesAsignados = camiones.filter(camion => camion.conductor);
  const camionesSinAsignar = camiones.filter(camion => !camion.conductor);

  // Aplicar filtro de búsqueda y estado según la pestaña activa
  const camionesAsignadosFiltrados = camionesAsignados.filter(camion => {
    // Filtrar por texto de búsqueda
    const coincideTexto = 
      camion.placa.toLowerCase().includes(busquedaCamiones.toLowerCase()) ||
      camion.ruta.toLowerCase().includes(busquedaCamiones.toLowerCase()) ||
      (camion.conductor && camion.conductor.nombre && 
       camion.conductor.nombre.toLowerCase().includes(busquedaCamiones.toLowerCase()));
    
    // Filtrar por estado (activo, inactivo o todos)
    const coincideEstado = 
      filtroEstado === 'todos' || 
      camion.estado === filtroEstado;
    
    // Debe cumplir ambas condiciones
    return coincideTexto && coincideEstado;
  });

  const camionesSinAsignarFiltrados = camionesSinAsignar.filter(camion => {
    // Filtrar por texto de búsqueda
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

  // Obtener los camiones según la pestaña activa
  const camionesFiltrados = tabActiva === 0 ? camionesSinAsignarFiltrados : camionesAsignadosFiltrados;

  const camionesPaginados = camionesFiltrados.slice(
    (paginaCamiones - 1) * elementosPorPagina,
    paginaCamiones * elementosPorPagina
  );

  const handleTabChange = (event, newValue) => {
    setTabActiva(newValue);
    setPaginaCamiones(1); // Resetear paginación al cambiar de tab
  };

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
        Asignación de Conductores a Camiones
      </Typography>
  
      <Paper elevation={3} className="paper-style">
        <Grid container spacing={2} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Buscar por placa, ruta o conductor"
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
        
        <Tabs 
          value={tabActiva} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          style={{ marginBottom: '20px' }}
        >
          <Tab 
            icon={<DirectionsBus />} 
            label={`Camiones Sin Asignar (${camionesSinAsignarFiltrados.length})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<Person />} 
            label={`Camiones Asignados (${camionesAsignadosFiltrados.length})`} 
            iconPosition="start"
          />
        </Tabs>
        
        <Typography variant="h6" gutterBottom className="form-section-title">
          {tabActiva === 0 ? 'Camiones Disponibles para Asignación' : 'Camiones con Conductor Asignado'}
        </Typography>
        
        {camionesPaginados.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="textSecondary">
              {tabActiva === 0 
                ? 'No hay camiones sin asignar disponibles con los filtros aplicados' 
                : 'No hay camiones con conductor asignado con los filtros aplicados'}
            </Typography>
          </Box>
        ) : (
          <List>
            {camionesPaginados.map(camion => (
              <ListItem key={camion._id} divider>
                <ListItemText
                  primary={`${camion.placa} - ${camion.ruta}`}
                  secondary={
                    <>
                      {`Estado: ${camion.estado === 'activo' ? 'Activo' : 'Inactivo'} - Conductor: ${camion.conductor ? camion.conductor.nombre : 'Sin conductor'}`}
                      <br />
                      {`Horario: ${camion.horarioInicio || '05:00'} - ${camion.horarioFin || '22:00'}`}
                      <br />
                      {`Días: ${camion.diasTrabajo ? camion.diasTrabajo.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ') : 'No especificados'}`}
                    </>
                  }
                />
                <IconButton className="icon-button" onClick={() => setCamionEditando(camion)}>
                  <Edit />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
        
        {camionesFiltrados.length > elementosPorPagina && (
          <Pagination
            count={Math.ceil(camionesFiltrados.length / elementosPorPagina)}
            page={paginaCamiones}
            onChange={(e, value) => setPaginaCamiones(value)}
            className="pagination"
          />
        )}
      </Paper>

      {/* Diálogo para editar asignación */}
      <Dialog open={!!camionEditando} onClose={() => setCamionEditando(null)} maxWidth="md">
        <DialogTitle>Asignar Conductor y Horario</DialogTitle>
        <DialogContent>
          {camionEditando && (
            <Grid container spacing={2} style={{ marginTop: '8px' }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Camión: {camionEditando.placa} - Ruta: {camionEditando.ruta}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Conductor</InputLabel>
                  <Select
                    value={camionEditando.conductor?._id || camionEditando.conductor || ''}
                    onChange={(e) => setCamionEditando({
                      ...camionEditando, 
                      conductor: e.target.value
                    })}
                    displayEmpty
                  >
                    <MenuItem value="">Sin conductor asignado</MenuItem>
                    {/* Incluir el conductor actual si existe */}
                    {camionEditando.conductor && 
                      !conductoresDisponibles.some(c => c._id === (camionEditando.conductor._id || camionEditando.conductor)) && (
                      <MenuItem value={camionEditando.conductor._id || camionEditando.conductor}>
                        {camionEditando.conductor.nombre || "Conductor actual"} {camionEditando.conductor.email ? `- ${camionEditando.conductor.email}` : ''}
                      </MenuItem>
                    )}
                    {conductoresDisponibles.map(conductor => (
                      <MenuItem key={conductor._id} value={conductor._id}>
                        {conductor.nombre} - {conductor.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora inicio"
                  type="time"
                  fullWidth
                  value={camionEditando.horarioInicio || '05:00'}
                  onChange={(e) => setCamionEditando({
                    ...camionEditando, 
                    horarioInicio: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora fin"
                  type="time"
                  fullWidth
                  value={camionEditando.horarioFin || '22:00'}
                  onChange={(e) => setCamionEditando({
                    ...camionEditando, 
                    horarioFin: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Días de trabajo</InputLabel>
                  <Select
                    multiple
                    value={camionEditando.diasTrabajo || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']}
                    onChange={(e) => setCamionEditando({
                      ...camionEditando, 
                      diasTrabajo: e.target.value
                    })}
                    renderValue={(selected) => selected.map(dia => dia.charAt(0).toUpperCase() + dia.slice(1)).join(', ')}
                  >
                    <MenuItem value="lunes">Lunes</MenuItem>
                    <MenuItem value="martes">Martes</MenuItem>
                    <MenuItem value="miercoles">Miércoles</MenuItem>
                    <MenuItem value="jueves">Jueves</MenuItem>
                    <MenuItem value="viernes">Viernes</MenuItem>
                    <MenuItem value="sabado">Sábado</MenuItem>
                    <MenuItem value="domingo">Domingo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCamionEditando(null)}>Cancelar</Button>
          <Button 
            onClick={() => actualizarAsignacion(camionEditando._id, camionEditando)}
            color="primary"
            startIcon={<Save />}
          >
            Guardar Asignación
          </Button>
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

export default AsignacionConductores;
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../css/Admin/GestionUsuarios.css';

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password: '', rol: '' });
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [errores, setErrores] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogoEliminar, setDialogoEliminar] = useState({ open: false, tipo: '', id: '' });
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const elementosPorPagina = 5;
  const [filtroRol, setFiltroRol] = useState('todos');

  // Move fetchUsuarios before useEffect
  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cargar usuarios',
        severity: 'error'
      });
      if (error.response?.status === 401) {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []); // Remove fetchUsuarios from dependency array

  const validarUsuario = (usuario) => {
    const nuevosErrores = {};
    if (!usuario.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!usuario.email.trim()) nuevosErrores.email = 'El correo es requerido';
    if (!/\S+@\S+\.\S+/.test(usuario.email)) nuevosErrores.email = 'Correo no válido';
    if (!usuario.password?.trim() && !usuarioEditando) nuevosErrores.password = 'La contraseña es requerida';
    if (usuario.password && usuario.password.length < 6) nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!usuario.rol) nuevosErrores.rol = 'Selecciona un rol';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarUsuario = async () => {
    if (!validarUsuario(nuevoUsuario)) return;
    try {
      const response = await api.post('/usuarios', nuevoUsuario);
      setUsuarios([...usuarios, response.data]);
      setNuevoUsuario({ nombre: '', email: '', password: '', rol: '' });
      setSnackbar({ open: true, message: 'Usuario agregado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al agregar usuario', 
        severity: 'error' 
      });
    }
  };

  const actualizarUsuario = async (id, datosActualizados) => {
    if (!validarUsuario(datosActualizados)) return;
    try {
      const response = await api.put(`/usuarios/${id}`, datosActualizados);
      setUsuarios(usuarios.map(usuario => 
        usuario._id === id ? response.data : usuario
      ));
      setUsuarioEditando(null);
      setSnackbar({ 
        open: true, 
        message: 'Usuario actualizado correctamente', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al actualizar usuario', 
        severity: 'error' 
      });
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(usuario => usuario._id !== id));
      setSnackbar({ open: true, message: 'Usuario eliminado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Error al eliminar usuario', 
        severity: 'error' 
      });
    }
  };

  const confirmarEliminacion = (id) => {
    setDialogoEliminar({ open: true, tipo: 'usuario', id });
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar({ open: false, tipo: '', id: '' });
  };

  const ejecutarEliminacion = () => {
    eliminarUsuario(dialogoEliminar.id);
    cerrarDialogoEliminar();
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    (filtroRol === 'todos' || usuario.rol === filtroRol) &&
    (usuario.nombre.toLowerCase().includes(busquedaUsuarios.toLowerCase()) ||
     usuario.email.toLowerCase().includes(busquedaUsuarios.toLowerCase()))
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaUsuarios - 1) * elementosPorPagina,
    paginaUsuarios * elementosPorPagina
  );

  return (
    <div className="admin-container">
      <button 
        className="back-button"
        onClick={() => navigate('/admin')} 
      >
        Volver al Dashboard
      </button>

      <h1 className="title">Gestión de Usuarios</h1>

      <div className="paper-style">
        <div className="search-container">
          <div className="search-input">
            <input
              type="text"
              placeholder="Buscar por nombre o correo"
              value={busquedaUsuarios}
              onChange={(e) => setBusquedaUsuarios(e.target.value)}
              className="text-field"
            />
          </div>
          <div className="filter-select">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="text-field"
            >
              <option value="todos">Filtrar Por Roles</option>
              <option value="pasajero">Pasajeros</option>
              <option value="conductor">Conductores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>

        <h2 className="form-section-title">
          Formulario para Agregar Nuevo Usuario
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <input
              type="text"
              placeholder="Nombre"
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
              className={`text-field ${errores.nombre ? 'error' : ''}`}
            />
            {errores.nombre && <span className="error-text">{errores.nombre}</span>}
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
              className={`text-field ${errores.email ? 'error' : ''}`}
            />
            {errores.email && <span className="error-text">{errores.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={nuevoUsuario.password}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
              className={`text-field ${errores.password ? 'error' : ''}`}
            />
            {errores.password && <span className="error-text">{errores.password}</span>}
          </div>

          <div className="form-group">
            <select
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
              className={`text-field ${errores.rol ? 'error' : ''}`}
            >
              <option value="">Selecciona un rol</option>
              <option value="pasajero">Pasajero</option>
              <option value="conductor">Conductor</option>
              <option value="admin">Administrador</option>
            </select>
            {errores.rol && <span className="error-text">{errores.rol}</span>}
          </div>

          <div className="form-group">
            <button 
              className="button-primary" 
              onClick={agregarUsuario}
            >
              Agregar
            </button>
          </div>
        </div>

        <ul className="user-list">
          {usuariosPaginados.map(usuario => (
            <li key={usuario._id} className="user-item">
              {usuarioEditando?._id === usuario._id ? (
                <div className="edit-form-grid">
                  <input
                    type="text"
                    value={usuarioEditando.nombre}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      nombre: e.target.value
                    })}
                    placeholder="Nombre"
                    className={`text-field ${errores.nombre ? 'error' : ''}`}
                  />
                  
                  <input
                    type="email"
                    value={usuarioEditando.email}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      email: e.target.value
                    })}
                    placeholder="Email"
                    className={`text-field ${errores.email ? 'error' : ''}`}
                  />
                  
                  <input
                    type="password"
                    value={usuarioEditando.password || ''}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      password: e.target.value
                    })}
                    placeholder="Nueva contraseña (opcional)"
                    className={`text-field ${errores.password ? 'error' : ''}`}
                  />
                  
                  <select
                    value={usuarioEditando.rol}
                    onChange={(e) => setUsuarioEditando({
                      ...usuarioEditando,
                      rol: e.target.value
                    })}
                    className={`text-field ${errores.rol ? 'error' : ''}`}
                  >
                    <option value="pasajero">Pasajero</option>
                    <option value="conductor">Conductor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  
                  <div className="button-group">
                    <button
                      onClick={() => actualizarUsuario(usuario._id, usuarioEditando)}
                      className="button-primary"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setUsuarioEditando(null);
                        setErrores({});
                      }}
                      className="button-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="user-info">
                    <span className="user-name">{usuario.nombre}</span>
                    <span className="user-details">{`${usuario.email} - ${usuario.rol}`}</span>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="icon-button edit"
                      onClick={() => setUsuarioEditando({ ...usuario })}
                    >
                      ✏️
                    </button>
                    <button 
                      className="icon-button delete"
                      onClick={() => confirmarEliminacion(usuario._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <div className="pagination-container">
          <button
            className="pagination-button"
            disabled={paginaUsuarios === 1}
            onClick={() => setPaginaUsuarios(prev => prev - 1)}
          >
            Anterior
          </button>
          <span className="pagination-info">
            Página {paginaUsuarios} de {Math.ceil(usuariosFiltrados.length / elementosPorPagina)}
          </span>
          <button
            className="pagination-button"
            disabled={paginaUsuarios >= Math.ceil(usuariosFiltrados.length / elementosPorPagina)}
            onClick={() => setPaginaUsuarios(prev => prev + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {dialogoEliminar.open && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar este usuario?</p>
            <div className="modal-actions">
              <button onClick={cerrarDialogoEliminar} className="button-secondary">
                Cancelar
              </button>
              <button onClick={ejecutarEliminacion} className="button-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className={`snackbar ${snackbar.severity}`}>
          {snackbar.message}
          <button 
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            className="snackbar-close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default GestionUsuarios;
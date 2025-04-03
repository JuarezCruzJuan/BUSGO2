import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import '../../css/Login/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.email || !credentials.password) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/login', credentials);
      const data = response.data;

      if (!data.token || !data.usuario) {
        setError('Respuesta del servidor inválida');
        return;
      }

      // Store in secure cookies
      Cookies.set('token', data.token, {
        secure: true,
        sameSite: 'strict',
        expires: 1
      });

      Cookies.set('userInfo', JSON.stringify({
        id: data.usuario._id,
        nombre: data.usuario.nombre,
        rol: data.usuario.rol
      }), {
        secure: true,
        sameSite: 'strict',
        expires: 1
      });

      // Redirect based on role
      const userRole = data.usuario.rol;
      navigate(`/${userRole}`);

    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.error;
        
        if (statusCode === 401) {
          setError(errorMessage || 'Credenciales inválidas');
        } else {
          setError('Error en el servidor');
        }
      } else {
        setError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-paper">
        <div className="login-box">
          <i className="login-icon">🔐</i>
          <h1>Iniciar Sesión</h1>
          
          {error && (
            <div className="login-alert error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                autoFocus
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className={error ? 'error' : ''}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className={error ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            
            <div className="forgot-password">
              <button
                type="button"
                className="forgot-password-button"
                onClick={() => navigate('/recuperar-password')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>  
  );
};

export default Login;
import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../css/Login/Login.css';

const RecuperarPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('username');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyUsername = async () => {
    if (!formData.username) {
      setError('Por favor ingrese su nombre de usuario');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/verificar-usuario', { username: formData.username });
      
      if (response.data.exists) {
        setStep('email');
        setError('');
      } else {
        setError('Usuario no encontrado. Verifique e intente nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo verificar el usuario. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!formData.email) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }
    
    setLoading(true);
    
    try {
      // Ya no verificamos si el correo coincide con el de la BD
      // Enviamos directamente el código de recuperación
      await api.post('/api/recuperar-password', { 
        username: formData.username,
        recoveryEmail: formData.email // Usamos recoveryEmail para indicar que es el correo para recuperación
      });
      
      // En lugar de mostrar solo un mensaje de éxito, cambiamos al paso de verificación
      setStep('verification');
      setSuccess('Se ha enviado un código de verificación a su correo electrónico');
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo enviar el correo de recuperación. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    // Validate code
    if (!formData.code) {
      setError('Por favor ingrese el código de verificación');
      return;
    }
    
    // Validate new password
    if (!formData.newPassword) {
      setError('Por favor ingrese la nueva contraseña');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Validate password confirmation
    if (!formData.confirmPassword) {
      setError('Por favor confirme su nueva contraseña');
      return;
    }
    
    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifique e intente nuevamente.');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.post('/api/verificar-codigo-recuperacion', {
        username: formData.username,
        code: formData.code,
        newPassword: formData.newPassword
      });
      
      setSuccess('¡Contraseña actualizada correctamente! Redirigiendo al inicio de sesión...');
      setError('');
      
      // Redirigir al inicio de sesión después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      
      // Handle specific error messages
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.customMessage) {
        setError(error.customMessage);
      } else {
        setError('No se pudo actualizar la contraseña. Verifique el código e intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 'username') {
      verifyUsername();
    } else if (step === 'email') {
      verifyEmail();
    } else if (step === 'verification') {
      resetPassword();
    }
  };

  return (
    <div className="login-container">
      <div className="login-paper">
        <div className="login-box">
          
          
          <h1>Recuperar Contraseña</h1>
          
          {error && (
            <div className="login-alert error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="login-alert success">
              {success}
            </div>
          )}

          {(!success || step === 'verification') && (
            <form onSubmit={handleSubmit} className="login-form">
              {step === 'username' && (
                <>
                  <p className="form-description">
                    Ingrese su nombre de usuario para comenzar el proceso de recuperación.
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="username">Nombre de Usuario</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      required
                      autoComplete="username"
                      autoFocus
                      value={formData.username}
                      onChange={handleChange}
                      className={error && error.toLowerCase().includes('usuario') ? 'error' : ''}
                      placeholder="Su nombre de usuario"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Continuar'}
                  </button>
                </>
              )}
              
              {step === 'email' && (
                <>
                  <p className="form-description">
                    Usuario "{formData.username}" verificado. Ingrese su correo electrónico para recibir instrucciones.
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={formData.email}
                      onChange={handleChange}
                      className={error && error.toLowerCase().includes('correo') ? 'error' : ''}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                  </button>
                </>
              )}
              
              {step === 'verification' && (
                <>
                  <p className="form-description">
                    Ingrese el código de verificación enviado a su correo electrónico y establezca una nueva contraseña.
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="code">Código de Verificación</label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      required
                      autoFocus
                      value={formData.code}
                      onChange={handleChange}
                      className={error && error.toLowerCase().includes('código') ? 'error' : ''}
                      placeholder="Ingrese el código de 6 dígitos"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">Nueva Contraseña</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={error && error.toLowerCase().includes('contraseña') ? 'error' : ''}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={error && error.toLowerCase().includes('coinciden') ? 'error' : ''}
                      placeholder="Repita la nueva contraseña"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </>
              )}
              
              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-password-button"
                  onClick={() => navigate('/')}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
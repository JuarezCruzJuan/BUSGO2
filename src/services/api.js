import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token found:', token); // Debug log
    } else {
      console.log('No token found'); // Debug log
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log the error but don't redirect
    console.error('API Error:', error);
    
    // Mejorar los mensajes de error para contraseñas y validación
    if (error.response) {
      const { status, data } = error.response;
      
      // Errores de autenticación
      if (status === 401) {
        if (data.error && data.error.toLowerCase().includes('contraseña')) {
          error.customMessage = 'La contraseña es incorrecta';
        } else if (data.error && (data.error.toLowerCase().includes('correo') || 
                                  data.error.toLowerCase().includes('email'))) {
          error.customMessage = 'El correo electrónico no está registrado';
        }
      }
      
      // Errores de validación
      if (status === 400) {
        if (data.error && data.error.toLowerCase().includes('contraseña')) {
          if (data.error.toLowerCase().includes('6 caracteres')) {
            error.customMessage = 'La contraseña debe tener al menos 6 caracteres';
          } else {
            error.customMessage = 'La contraseña no cumple con los requisitos de seguridad';
          }
        }
        
        // Otros errores de validación comunes
        if (data.error && data.error.toLowerCase().includes('formato')) {
          error.customMessage = 'El formato de los datos es incorrecto';
        }
      }
    }
    
    return Promise.reject(error);
  }
);



export default api;

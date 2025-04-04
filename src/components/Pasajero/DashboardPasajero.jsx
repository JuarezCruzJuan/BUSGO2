import React, { useState, useEffect, useRef } from 'react';
import '../../css/Pasajero/DashboardPasajero.css';
import { Dialog, DialogContent, Button, Fab } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { Logout, Chat, Send, Close } from '@mui/icons-material';
import Cookies from 'js-cookie';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import api from '../../services/api';

const DashboardPasajero = () => {
  const [camiones, setCamiones] = useState([]);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [selectedCamion, setSelectedCamion] = useState(null);
  const [openMap, setOpenMap] = useState(false);
  const navigate = useNavigate();
  
  // Add incidentDetails state
  const [incidentDetails, setIncidentDetails] = useState({
    tipo: 'General',
    placa: '',
    descripcion: '',
    fecha: new Date().toISOString()
  });
  
  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy tu asistente para reportar incidencias. ¿En qué puedo ayudarte hoy?", sender: "bot" }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  // Agregar estado para seguir el flujo de la conversación
  const [chatState, setChatState] = useState('inicio');
  
  // Add EmailJS initialization
  useEffect(() => {
    // Initialize EmailJS
    emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
  }, []);

  useEffect(() => {
    cargarCamiones();
    // Actualizar ubicaciones cada 2 minutos
    const interval = setInterval(cargarCamiones, 120000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  // Chatbot functions
  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const generatePDF = (details) => {
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(16);
    doc.text('Reporte de Incidencia', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Número de Incidencia: #INC-${Math.floor(1000 + Math.random() * 9000)}`, 20, 40);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 20, 50);
    doc.text(`Tipo de Incidencia: ${details.tipo}`, 20, 60);
    doc.text(`Placa del Bus: ${details.placa}`, 20, 70);
    doc.text('Descripción:', 20, 90);
    
    // Handle long description text
    const splitDescription = doc.splitTextToSize(details.descripcion, 170);
    doc.text(splitDescription, 20, 100);

    return doc.output('datauristring');
  };

  const sendIncidentEmail = async (details) => {
    const pdfContent = generatePDF(details);
    
    const templateParams = {
      to_email: 'busgo45@gmail.com',
      incident_number: `#INC-${Math.floor(1000 + Math.random() * 9000)}`,
      incident_type: details.tipo,
      bus_plate: details.placa,
      description: details.descripcion,
      pdf_content: pdfContent
    };

    try {
      console.log('EmailJS params:', {
        serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
        templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      });
      
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams
      );
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const userMessage = { text: newMessage, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    setTimeout(async () => {
      try {
        let botResponse = "";
        
        // Lógica basada en el estado actual de la conversación
        switch(chatState) {
          case 'inicio':
            if (newMessage.toLowerCase().includes('incidencia') || 
                newMessage.toLowerCase().includes('problema') || 
                newMessage.toLowerCase().includes('reportar')) {
              botResponse = "Por favor, indícame qué tipo de incidencia quieres reportar: ¿Problema con Bus, Problema con Conductor o Problema de Horario?";
              setChatState('esperando_tipo');
            } else {
              botResponse = "Puedo ayudarte a reportar incidencias con los buses. ¿Qué tipo de problema quieres reportar?";
            }
            break;
            
          case 'esperando_tipo':
            if (newMessage.toLowerCase().includes('bus')) {
              setIncidentDetails(prev => ({...prev, tipo: 'Problema con Bus'}));
              botResponse = "Entendido. ¿Podrías indicarme la placa del bus? (Formato: ABC-123)";
              setChatState('esperando_placa');
            } else if (newMessage.toLowerCase().includes('conductor')) {
              setIncidentDetails(prev => ({...prev, tipo: 'Problema con Conductor'}));
              botResponse = "Entendido. ¿Podrías indicarme la placa del bus del conductor? (Formato: ABC-123)";
              setChatState('esperando_placa');
            } else if (newMessage.toLowerCase().includes('horario')) {
              setIncidentDetails(prev => ({...prev, tipo: 'Problema de Horario'}));
              botResponse = "Entendido. ¿Podrías indicarme la placa del bus con el problema de horario? (Formato: ABC-123)";
              setChatState('esperando_placa');
            } else {
              botResponse = "No he entendido el tipo de incidencia. Por favor, especifica si es un Problema con Bus, Problema con Conductor o Problema de Horario.";
            }
            break;
            
          case 'esperando_placa':
            // Verificar si el mensaje contiene una placa (formato simple)
            const placaRegex = /([A-Za-z0-9]{3,7}[-]?[0-9]{2,3})/;
            const placaMatch = newMessage.match(placaRegex);
            
            if (placaMatch) {
              setIncidentDetails(prev => ({...prev, placa: placaMatch[0]}));
              botResponse = "Gracias. Ahora, por favor describe detalladamente la incidencia que quieres reportar.";
              setChatState('esperando_descripcion');
            } else {
              botResponse = "No he podido identificar la placa. Por favor, ingresa la placa del bus en formato ABC-123.";
            }
            break;
            
          case 'esperando_descripcion':
            if (newMessage.length > 10) {
              setIncidentDetails(prev => ({
                ...prev, 
                descripcion: newMessage,
                fecha: new Date().toISOString()
              }));
              
              botResponse = "Gracias por la información. Estoy preparando tu reporte. ¿Deseas enviarlo ahora? (Sí/No)";
              setChatState('confirmacion');
            } else {
              botResponse = "Por favor, proporciona una descripción más detallada de la incidencia.";
            }
            break;
            
          case 'confirmacion':
            if (newMessage.toLowerCase().includes('si') || 
                newMessage.toLowerCase().includes('sí') || 
                newMessage.toLowerCase().includes('enviar')) {
              
              botResponse = "Enviando tu reporte...";
              setMessages(prev => [...prev, { text: botResponse, sender: "bot" }]);
              
              // Enviar el email con la incidencia
              const emailSent = await sendIncidentEmail(incidentDetails);
              
              botResponse = emailSent 
                ? "✅ Tu reporte de incidencia ha sido registrado y enviado por correo electrónico. Un administrador lo revisará pronto. ¿Hay algo más en lo que pueda ayudarte?"
                : "❌ Hubo un problema al enviar el correo. Por favor, intenta nuevamente más tarde.";
              
              // Reiniciar el estado para una nueva conversación
              setChatState('inicio');
              setIncidentDetails({
                tipo: 'General',
                placa: '',
                descripcion: '',
                fecha: new Date().toISOString()
              });
            } else {
              botResponse = "He cancelado el envío del reporte. ¿Deseas modificar algún dato?";
              setChatState('inicio');
            }
            break;
            
          default:
            botResponse = "Lo siento, no entendí. ¿Puedes ser más específico?";
            setChatState('inicio');
        }

        setMessages(prev => [...prev, { text: botResponse, sender: "bot" }]);
      } catch (error) {
        console.error('Error in chatbot response:', error);
        setMessages(prev => [...prev, { 
          text: "Lo siento, tuve un problema al procesar tu reporte. Por favor, intenta de nuevo.", 
          sender: "bot" 
        }]);
        setChatState('inicio');
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="dashboard-container">
      <Button 
        className="logout-button"
        variant="contained" 
        color="error" 
        onClick={handleLogout}
        startIcon={<Logout />}
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

      {/* Chatbot Fab Button */}
      <Fab 
        className="chat-fab"
        color="primary" 
        aria-label="chat"
        onClick={toggleChat}
      >
        {chatOpen ? <Close /> : <Chat />}
      </Fab>

      {/* Chatbot Dialog */}
      <div className={`chatbot-container ${chatOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <h3>Reporte de Incidencias</h3>
          <button className="close-button" onClick={toggleChat}>
            <Close />
          </button>
        </div>
        
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chatbot-input">
          <input
            type="text"
            placeholder="Describe la incidencia..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleSendMessage}>
            <Send />
          </button>
        </div>
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
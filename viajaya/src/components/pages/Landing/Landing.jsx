import { useEffect } from 'react';
import { useAppDispatch } from '../../../redux/hooks/hooks';
import { usePopups } from '../../../redux/hooks/hooks';
// ✅ Usar tu acción actual (fetchPopup en lugar de fetchPopups)
import { fetchPopup } from '../../../redux/slices/popupSlice';
import { config } from '../../../utils/env';

import Popup from '../../../components/popups/Popup'
import NavBar from "../../layout/NavBar/NavBar"
import Footer from "../../layout/Footer/Footer"
import Home from "../Home/Home"
import Destinos from "../Destinos/Destinos"
import Clients from "../Clients/Clients"
import Contact from "../Contact/Contact"
import YapayaCard from "../../YapayaCard"
import WhatssapButton from './WhatssapButton'
import PackCard from '../../../components/PackCard'
import Convenios from '../Clients/Convenios';
import VideoCarousel from '../VideoCarousel';
import QuotePopup from '../../popups/QuotePopup';

// eslint-disable-next-line react/prop-types
const Landing = ({ ruta }) => {
  const dispatch = useAppDispatch();
  // ✅ Usar la estructura de tu popupSlice actual
  const { currentPopup, loading, error } = usePopups();

  useEffect(() => {
    // ✅ Usar tu acción actual (fetchPopup)
    dispatch(fetchPopup());
  }, [dispatch]);

  // ✅ Mejor manejo de loading con fallback
  if (loading) {
    return (
      <div className="landing-loading">
        <NavBar ruta={ruta} />
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando {config?.appName || 'ViajaYa'}...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ✅ Manejo de errores mejorado
  if (error) {
    console.error('Error cargando popup:', error);
    // ✅ En desarrollo, mostrar el error; en producción, continuar sin popup
    if (config?.isDevelopment) {
      console.warn('🚨 Error en Landing - Popup:', error);
    }
  }

  return (
    <>
      <NavBar ruta={ruta} />
      <Home />
      <YapayaCard /> 
      <PackCard />
      <Destinos />
      <VideoCarousel />
      <Clients />
      <Contact />
      <Convenios />
      <Footer />
      <QuotePopup />
      <WhatssapButton />
      
      {/* ✅ Popup con mejor validación */}
      {currentPopup && 
       currentPopup.isActive && 
       currentPopup.content && 
       !error && (
        <Popup 
          content={currentPopup.content}
          onClose={() => {
            // ✅ Opcional: agregar lógica de cierre si tu Popup lo soporta
            console.log('Popup cerrado por usuario');
          }}
        />
      )}
      
      {/* ✅ Debug info solo en desarrollo */}
      {config?.isDevelopment && error && (
        <div 
          className="error-debug"
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px',
          }}
        >
          <strong>Debug - Error Popup:</strong><br />
          {error}
        </div>
      )}
    </>
  );
};

export default Landing;
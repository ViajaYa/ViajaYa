import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faTimes, 
  faFileAlt, 
  faFileUpload,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import {
  checkDocumentationStatus,
  getUserDocuments,
  selectDocumentationStatus,
  selectStatusLoading,
  selectDocumentError,
  REQUIRED_DOCUMENTS_BY_ROLE
} from '../redux/slices/documentSlice';

const DocumentationAlert = ({ user, onOpenDocuments, className = "" }) => {
  const dispatch = useDispatch();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Selectores del Redux store
  const documentationStatus = useSelector(selectDocumentationStatus);
  const statusLoading = useSelector(selectStatusLoading);
  const error = useSelector(selectDocumentError);
  
  // Solo mostrar para roles 2, 3, 4 (Asesor, Líder, Gerente)
  const requiresDocumentation = [2, 3, 4].includes(user?.role);
  
  // Obtener documentos requeridos para el rol del usuario
  const requiredDocuments = REQUIRED_DOCUMENTS_BY_ROLE[user?.role] || [];

  // Verificar si la alerta fue previamente cerrada (localStorage)
  useEffect(() => {
    if (!user?.id) return;
    
    const dismissedKey = `docAlert_${user.id}_dismissed`;
    const dismissedTime = localStorage.getItem(dismissedKey);
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(dismissedKey);
      }
    }
  }, [user?.id]);

  // Cargar datos del backend cuando el componente se monta
  useEffect(() => {
    if (requiresDocumentation && user?.id && !isDismissed) {
      dispatch(getUserDocuments(user.id));
      dispatch(checkDocumentationStatus(user.id));
    }
  }, [dispatch, user?.id, requiresDocumentation, isDismissed]);

  // Mostrar toast si hay error
  useEffect(() => {
    if (error) {
      toast.error(`Error al verificar documentación: ${error}`);
    }
  }, [error]);

  // No mostrar si no requiere documentación, fue dismissada, o está cargando
  if (!requiresDocumentation || isDismissed || statusLoading) {
    return null;
  }

  // No mostrar si hay error o no hay datos aún
  if (error && !documentationStatus) {
    return null;
  }

  // No mostrar si la documentación está completa
  if (documentationStatus?.isComplete) {
    return null;
  }

  // No mostrar si aún no tenemos datos del status
  if (!documentationStatus && !statusLoading) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    // Guardar en localStorage para que no aparezca por 24 horas
    const dismissedKey = `docAlert_${user.id}_dismissed`;
    localStorage.setItem(dismissedKey, Date.now().toString());
  };

  const getRoleText = (role) => {
    const roleMap = {
      2: 'Asesor',
      3: 'Líder',
      4: 'Gerente'
    };
    return roleMap[role] || 'Empleado';
  };

  return (
    <div className={`bg-orange-600 text-white p-6 rounded-lg shadow-lg mb-6 relative `}>
      {/* Botón para cerrar */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white hover:text-gray-200 transition-colors duration-200"
        title="Cerrar alerta (se mostrará nuevamente en 24 horas)"
      >
        <FontAwesomeIcon icon={faTimes} className="text-lg" />
      </button>

      <div className="flex items-start space-x-4">
        {/* Icono de advertencia */}
        <div className="flex-shrink-0">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className="text-3xl text-yellow-300 animate-bounce" 
          />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-xl mb-3">
            📋 Documentación Pendiente - {getRoleText(user.role)}
          </h3>
          
          <p className="mb-4 text-lg">
            Tienes <span className="font-bold text-yellow-300">
              {documentationStatus?.missingDocuments?.length || 0} documentos pendientes
            </span> por completar para tu puesto de trabajo.
          </p>

          {/* Progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">Progreso de documentación</span>
              <span className="font-bold">
                {documentationStatus?.approvedDocuments || 0} / {documentationStatus?.totalRequired || 0}
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${((documentationStatus?.approvedDocuments || 0) / (documentationStatus?.totalRequired || 1)) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm mt-1 opacity-90">
              {Math.round(((documentationStatus?.approvedDocuments || 0) / (documentationStatus?.totalRequired || 1)) * 100)}% completo
            </p>
          </div>

          {/* Documentos faltantes */}
          {documentationStatus?.missingDocuments && documentationStatus.missingDocuments.length > 0 && (
            <div className="mb-5">
              <p className="font-semibold mb-3 text-yellow-200">📄 Documentos requeridos:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documentationStatus.missingDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center bg-white bg-opacity-10 rounded-lg p-2">
                    <FontAwesomeIcon icon={faFileAlt} className="mr-2 text-yellow-300 text-sm" />
                    <span className="text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentos aprobados */}
          {(documentationStatus?.approvedDocuments || 0) > 0 && (
            <div className="mb-5">
              <p className="font-semibold mb-2 text-green-200">✅ Documentos aprobados: {documentationStatus.approvedDocuments}</p>
            </div>
          )}

          {/* Botón de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenDocuments}
              className="bg-white text-orange-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faFileUpload} className="mr-2" />
              📁 Completar Documentación
            </button>
            
            <button
              onClick={() => toast.info('Función de contacto con soporte próximamente')}
              className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white hover:text-orange-600 transition-all duration-300 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              💬 Contactar Soporte
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de urgencia */}
      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-3 py-1 animate-bounce shadow-lg">
        ¡URGENTE!
      </div>

      {/* Nota informativa */}
      <div className="mt-4 text-xs opacity-75 text-center border-t border-white border-opacity-20 pt-3">
        💡 Esta alerta se ocultará por 24 horas al cerrarla. Los documentos son necesarios para acceder a todas las funcionalidades.
      </div>
    </div>
  );
};

export default DocumentationAlert;

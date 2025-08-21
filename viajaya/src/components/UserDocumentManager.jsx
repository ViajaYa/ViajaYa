import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'react-hot-toast';
// ✅ Importar utilidades de fecha con Luxon para manejar zona horaria de Colombia
import { formatDateDisplay } from '../utils/dateUtils';
import { 
  faFileUpload, 
  faFileAlt, 
  faCheckCircle, 
  faTimesCircle, 
  faClock, 
  faTrash, 
  faEye,
  faDownload,
  faUser,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
  uploadDocument,
  getUserDocuments,
  checkDocumentationStatus,
  deleteDocument,
  selectUserDocuments,
  selectDocumentationStatus,
  selectDocumentLoading,
  selectUploadLoading,
  selectStatusLoading,
  selectDocumentError,
  clearError,
  REQUIRED_DOCUMENTS_BY_ROLE
} from '../redux/slices/documentSlice';

const UserDocumentManager = ({ userId, userRole, userName }) => {
  const dispatch = useDispatch();
  
  // Selectores del Redux store
  const userDocuments = useSelector(selectUserDocuments);
  const documentationStatus = useSelector(selectDocumentationStatus);
  const loading = useSelector(selectDocumentLoading);
  const uploadLoading = useSelector(selectUploadLoading);
  const statusLoading = useSelector(selectStatusLoading);
  const error = useSelector(selectDocumentError);

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Tipos de documentos requeridos según el rol
  const documentTypes = REQUIRED_DOCUMENTS_BY_ROLE;

  useEffect(() => {
    if (userId) {
      dispatch(getUserDocuments(userId));
      dispatch(checkDocumentationStatus(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

 const handleFileSelect = (file) => {
  if (file) {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG, JPEG y PNG'); // ✅ CAMBIAR
      return;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB'); // ✅ CAMBIAR
      return;
    }

    setSelectedFile(file);
  }
};
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

const handleUpload = async () => {
  if (!selectedFile || !documentName.trim()) {
    toast.error('Selecciona un archivo y especifica el tipo de documento'); // ✅ CAMBIAR
    return;
  }

    const documentData = {
      user_id: userId,
      document_name: documentName,
      description: description.trim() || `Documento ${documentName} de ${userName}`,
      is_required: true
    };

    try {
      await dispatch(uploadDocument({ 
        file: selectedFile, 
        documentData 
      })).unwrap();

      // Limpiar formulario
      setSelectedFile(null);
      setDocumentName('');
      setDescription('');
      setShowUploadForm(false);

      // Actualizar estado
      dispatch(getUserDocuments(userId));
      dispatch(checkDocumentationStatus(userId));

      toast.success('Documento subido exitosamente');
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.error(error.message || 'Error al subir el documento');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      try {
        await dispatch(deleteDocument(documentId)).unwrap();
        dispatch(getUserDocuments(userId));
        dispatch(checkDocumentationStatus(userId));
        toast.success('Documento eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar documento:', error);
        toast.error(error.message || 'Error al eliminar el documento');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'rejected':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faClock} className="text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      2: 'Asesor',
      3: 'Líder', 
      4: 'Gerente'
    };
    return roleMap[role] || 'Empleado';
  };

  if (loading && !userDocuments.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Cargando documentos...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={faUser} className="text-3xl text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gestión de Documentos
            </h2>
            <p className="text-gray-600">
              {userName} - {getRoleText(userRole)}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faFileUpload} />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
          {error}
        </div>
      )}

      {/* Status Summary */}
      {documentationStatus && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">Estado de Documentación</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documentationStatus.approvedDocuments || 0}
              </div>
              <div className="text-sm text-gray-600">Aprobados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {(documentationStatus.totalRequired || 0) - (documentationStatus.approvedDocuments || 0)}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${documentationStatus.isComplete ? 'text-green-600' : 'text-red-600'}`}>
                {documentationStatus.isComplete ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">
                {documentationStatus.isComplete ? 'Completo' : 'Incompleto'}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{Math.round(((documentationStatus.approvedDocuments || 0) / (documentationStatus.totalRequired || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((documentationStatus.approvedDocuments || 0) / (documentationStatus.totalRequired || 1)) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Subir Nuevo Documento</h3>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors duration-200 ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="text-green-600">
                <FontAwesomeIcon icon={faFileAlt} className="text-4xl mb-2" />
                <p className="font-semibold">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <FontAwesomeIcon icon={faFileUpload} className="text-4xl mb-2" />
                <p>Arrastra un archivo aquí o haz clic para seleccionar</p>
                <p className="text-sm">PDF, JPG, PNG (máx. 5MB)</p>
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* Document Type Selection */}
          <select
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="mb-4 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Seleccionar tipo de documento...</option>
            {documentTypes[userRole]?.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
            <option value="Otro">Otro documento</option>
          </select>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del documento (opcional)"
            className="mb-4 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          />

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={uploadLoading || !selectedFile || !documentName}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center space-x-2"
            >
              {uploadLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faFileUpload} />
              )}
              <span>Subir Documento</span>
            </button>
            
            <button
              onClick={() => setShowUploadForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Documentos Subidos</h3>
        
        {userDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FontAwesomeIcon icon={faFileAlt} className="text-4xl mb-4" />
            <p>No tienes documentos subidos</p>
            <p className="text-sm">Sube tus documentos requeridos para completar tu perfil</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon 
                      icon={faFileAlt} 
                      className={`text-2xl ${
                        document.file_type === 'pdf' || document.document_name?.toLowerCase().includes('pdf') ? 'text-red-500' : 'text-blue-500'
                      }`} 
                    />
                    <div>
                      <h4 className="font-semibold text-gray-800">{document.document_name}</h4>
                      <p className="text-sm text-gray-600">{document.description}</p>
                      {document.createdAt && (
                        <p className="text-xs text-gray-500">
                          Subido: {formatDateDisplay(document.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {getStatusIcon(document.status)} {getStatusText(document.status)}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(document.file_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="Ver documento"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      
                      <a
                        href={document.file_url}
                        download
                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                        title="Descargar documento"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </a>
                      
                      {document.status !== 'approved' && (
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                          title="Eliminar documento"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                {document.status === 'rejected' && document.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                    <p className="font-semibold">Motivo de rechazo:</p>
                    <p className="text-sm">{document.rejection_reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDocumentManager;

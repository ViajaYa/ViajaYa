import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  getPendingDocuments, 
  getDocumentStats,
  approveDocument,
  rejectDocument,
  selectPendingDocuments,
  selectDocumentStats,
  selectDocumentLoading,
  selectStatsLoading,
  selectReviewLoading,
  selectDocumentError,
  clearError
} from '../../redux/slices/documentSlice';
import NavBar from '../layout/NavBar/NavBar';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_NAMES = {
  1: 'Cliente',
  2: 'Asesor', 
  3: 'Líder',
  4: 'Gerente',
  5: 'Admin',
  6: 'Contador',
  7: 'Owner'
};

const DocumentsReview = () => {
  const dispatch = useDispatch();
  const pendingDocuments = useSelector(selectPendingDocuments);
  const documentStats = useSelector(selectDocumentStats);
  const loading = useSelector(selectDocumentLoading);
  const statsLoading = useSelector(selectStatsLoading);
  const reviewLoading = useSelector(selectReviewLoading);
  const error = useSelector(selectDocumentError);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewModal, setReviewModal] = useState({ open: false, type: null });
  const [reviewData, setReviewData] = useState({ comments: '', reason: '' });

  // Obtener ID del usuario actual (Owner)
  const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    dispatch(getPendingDocuments());
    dispatch(getDocumentStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const openReviewModal = (document, type) => {
    setSelectedDocument(document);
    setReviewModal({ open: true, type });
    setReviewData({ comments: '', reason: '' });
  };

  const closeReviewModal = () => {
    setReviewModal({ open: false, type: null });
    setSelectedDocument(null);
    setReviewData({ comments: '', reason: '' });
  };

  const handleApprove = async () => {
    if (!selectedDocument) return;

    try {
      await dispatch(approveDocument({
        documentId: selectedDocument.id,
        reviewerId: currentUser.id,
        comments: reviewData.comments
      })).unwrap();

      toast.success('Documento aprobado exitosamente');
      closeReviewModal();
      
      // Refrescar datos
      dispatch(getPendingDocuments());
      dispatch(getDocumentStats());
    } catch (error) {
      toast.error(error || 'Error al aprobar documento');
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !reviewData.reason.trim()) {
      toast.error('La razón del rechazo es requerida');
      return;
    }

    try {
      await dispatch(rejectDocument({
        documentId: selectedDocument.id,
        reviewerId: currentUser.id,
        reason: reviewData.reason,
        comments: reviewData.comments
      })).unwrap();

      toast.success('Documento rechazado exitosamente');
      closeReviewModal();
      
      // Refrescar datos
      dispatch(getPendingDocuments());
      dispatch(getDocumentStats());
    } catch (error) {
      toast.error(error || 'Error al rechazar documento');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    const texts = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status] || badges.pending}`}>
        {texts[status] || 'Desconocido'}
      </span>
    );
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="pt-20 p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>

      <div className="pt-20 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Revisión de Documentación
              </h1>
              <p className="text-gray-600">
                Gestiona y revisa los documentos de los empleados
              </p>
            </div>
            <Link
              to="/panel"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Volver al Panel
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {documentStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <i className="fas fa-clock text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{documentStats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <i className="fas fa-check-circle text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aprobados</p>
                  <p className="text-2xl font-bold text-gray-900">{documentStats.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <i className="fas fa-times-circle text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rechazados</p>
                  <p className="text-2xl font-bold text-gray-900">{documentStats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <i className="fas fa-file-alt text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Documentos Pendientes de Revisión
            </h2>
          </div>

          {pendingDocuments && pendingDocuments.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-500 text-lg">No hay documentos pendientes de revisión</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(pendingDocuments) && pendingDocuments.length > 0 ? (
                    pendingDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.Owner?.name} {document.Owner?.lastname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ROLE_NAMES[document.Owner?.role]} • {document.Owner?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{document.document_name}</div>
                        {document.description && (
                          <div className="text-sm text-gray-500">{document.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {document.file_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="fas fa-eye"></i>
                          </a>
                          <button
                            onClick={() => openReviewModal(document, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            disabled={reviewLoading}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            onClick={() => openReviewModal(document, 'reject')}
                            className="text-red-600 hover:text-red-900"
                            disabled={reviewLoading}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        {loading ? 'Cargando documentos...' : 'No hay documentos pendientes'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {reviewModal.type === 'approve' ? 'Aprobar Documento' : 'Rechazar Documento'}
            </h3>

            {selectedDocument && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedDocument.document_name}</p>
                <p className="text-sm text-gray-600">
                  {selectedDocument.Owner?.name} {selectedDocument.Owner?.lastname}
                </p>
              </div>
            )}

            {reviewModal.type === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del rechazo *
                </label>
                <textarea
                  value={reviewData.reason}
                  onChange={(e) => setReviewData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Explica por qué se rechaza el documento..."
                  required
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios adicionales
              </label>
              <textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Comentarios opcionales..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeReviewModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={reviewLoading}
              >
                Cancelar
              </button>
              <button
                onClick={reviewModal.type === 'approve' ? handleApprove : handleReject}
                className={`px-4 py-2 text-white rounded-lg ${
                  reviewModal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                disabled={reviewLoading}
              >
                {reviewLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : reviewModal.type === 'approve' ? (
                  'Aprobar'
                ) : (
                  'Rechazar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsReview;

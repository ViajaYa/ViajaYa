import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import NavBar from '../layout/NavBar/NavBar';
import {
  getPendingDocuments,
  approveDocument,
  rejectDocument,
  getDocumentStats,
  selectPendingDocuments,
  selectDocumentStats,
  selectDocumentLoading,
  selectReviewLoading,
  selectDocumentError,
  clearError
} from '../../redux/slices/documentSlice';

const ROLE_NAMES = {
  1: 'Cliente',
  2: 'Asesor', 
  3: 'Líder',
  4: 'Gerente',
  5: 'Admin',
  6: 'Contador',
  7: 'Owner'
};

const DocumentReviewPanel = () => {
  const dispatch = useDispatch();
  const pendingDocuments = useSelector(selectPendingDocuments);
  const stats = useSelector(selectDocumentStats);
  const loading = useSelector(selectDocumentLoading);
  const reviewLoading = useSelector(selectReviewLoading);
  const error = useSelector(selectDocumentError);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(''); // 'approve' o 'reject'

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

  const handleReview = (document, action) => {
    setSelectedDocument(document);
    setReviewAction(action);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedDocument) return;

    if (reviewAction === 'reject' && !reviewComments.trim()) {
      toast.error('Los comentarios son obligatorios para rechazar un documento');
      return;
    }

    const reviewData = {
      documentId: selectedDocument.id,
      comments: reviewComments.trim()
    };

    try {
      if (reviewAction === 'approve') {
        await dispatch(approveDocument(reviewData)).unwrap();
        toast.success('Documento aprobado exitosamente');
      } else {
        await dispatch(rejectDocument(reviewData)).unwrap();
        toast.success('Documento rechazado exitosamente');
      }
      
      // Refrescar datos
      dispatch(getPendingDocuments());
      dispatch(getDocumentStats());
      setShowReviewModal(false);
      setSelectedDocument(null);
      
    } catch (error) {
      toast.error(error || 'Error al procesar la revisión');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>

      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de Revisión de Documentos
            </h1>
            <p className="text-gray-600">
              Revisa y aprueba la documentación de empleados
            </p>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Aprobados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rechazados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de documentos pendientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Documentos Pendientes de Revisión
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingDocuments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos pendientes</h3>
                <p className="mt-1 text-sm text-gray-500">Todos los documentos han sido revisados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                        Subido
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
                    {pendingDocuments.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {document.User?.name?.charAt(0)}{document.User?.lastname?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {document.User?.name} {document.User?.lastname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ROLE_NAMES[document.User?.role]} • {document.User?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {document.document_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.description || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {document.file_type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(document.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(document.status)}`}>
                            {document.status === 'pending' ? 'Pendiente' : document.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <a
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            Ver
                          </a>
                          <button
                            onClick={() => handleReview(document, 'approve')}
                            className="text-green-600 hover:text-green-500"
                            disabled={reviewLoading}
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReview(document, 'reject')}
                            className="text-red-600 hover:text-red-500"
                            disabled={reviewLoading}
                          >
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de revisión */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewAction === 'approve' ? 'Aprobar Documento' : 'Rechazar Documento'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Usuario:</strong> {selectedDocument?.User?.name} {selectedDocument?.User?.lastname}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Documento:</strong> {selectedDocument?.document_name}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    reviewAction === 'approve' 
                      ? 'Comentarios opcionales sobre la aprobación...' 
                      : 'Explica por qué rechazas este documento...'
                  }
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
                  disabled={reviewLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReview}
                  disabled={reviewLoading || (reviewAction === 'reject' && !reviewComments.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {reviewLoading ? 'Procesando...' : (reviewAction === 'approve' ? 'Aprobar' : 'Rechazar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReviewPanel;

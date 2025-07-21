import React from 'react';

const DocumentPreview = ({ document, isOpen, onClose }) => {
  if (!isOpen || !document) return null;

  const handleDownload = () => {
    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = document.file_url;
    link.download = document.document_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPDF = document.file_type === 'pdf' || document.file_url?.includes('.pdf');
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.file_type?.toLowerCase()) || 
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_url);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {document.document_name}
            </h3>
            <p className="text-sm text-gray-500">
              {document.Owner?.name} {document.Owner?.lastname} • {document.file_type?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <i className="fas fa-download"></i>
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {isPDF ? (
            <iframe
              src={document.file_url}
              className="w-full h-full border rounded-lg"
              title={document.document_name}
            />
          ) : isImage ? (
            <div className="h-full flex items-center justify-center">
              <img
                src={document.file_url}
                alt={document.document_name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-file-alt text-6xl text-gray-400 mb-4"></i>
                <p className="text-lg text-gray-600 mb-2">
                  Vista previa no disponible
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Tipo de archivo: {document.file_type?.toUpperCase()}
                </p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <i className="fas fa-download mr-2"></i>
                  Descargar archivo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Info */}
        {document.description && (
          <div className="p-4 border-t bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-1">Descripción:</h4>
            <p className="text-sm text-gray-600">{document.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;

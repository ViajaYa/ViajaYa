import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import UserDocumentManager from './UserDocumentManager';

const DocumentModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            📄 Gestión de Documentos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          <UserDocumentManager
            userId={user?.id}
            userRole={user?.role}
            userName={`${user?.name || ''} ${user?.lastname || ''}`.trim()}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faTimes, 
  faChevronLeft,
  faHome,
  faPlay,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import { selectUser } from '../../redux/slices/authSlice';
import { HELP_GUIDES, WORKFLOW_GUIDES } from '../../utils/helpGuides';

const FloatingHelpButton = () => {
  const location = useLocation();
  const user = useSelector(selectUser);
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // main, guide, workflow
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // Obtener rol del usuario
  const getUserRole = () => {
    const roleMap = {
      1: 'CLIENTE',
      2: 'ASESOR', 
      3: 'LIDER',
      4: 'GERENTE',
      5: 'ADMIN',
      6: 'CONTADOR',
      7: 'OWNER'
    };
    return roleMap[user?.role] || 'CLIENTE';
  };

  // Obtener guía para la página actual
  const getCurrentGuide = () => {
    const userRole = getUserRole();
    const currentPath = location.pathname;
    
    return HELP_GUIDES[userRole]?.[currentPath];
  };

  // Obtener workflows disponibles para el rol
  const getAvailableWorkflows = () => {
    const userRole = getUserRole();
    return Object.entries(WORKFLOW_GUIDES).filter(([, workflow]) => 
      workflow.roles.includes(userRole)
    );
  };

  const currentGuide = getCurrentGuide();
  const availableWorkflows = getAvailableWorkflows();

  // Resetear vista cuando cambia la página
  useEffect(() => {
    setCurrentView('main');
    setCurrentStepIndex(0);
    setSelectedWorkflow(null);
  }, [location.pathname]);

  // No mostrar en ciertas páginas
  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(location.pathname) || !user) {
    return null;
  }

  const renderMainView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📋 Ayuda - {getUserRole()}
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Guía de la página actual */}
      {currentGuide && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <FontAwesomeIcon icon={faHome} className="text-blue-600 mr-2" />
            <h4 className="font-medium text-blue-800">{currentGuide.title}</h4>
          </div>
          <p className="text-sm text-blue-700 mb-3">{currentGuide.description}</p>
          <button
            onClick={() => setCurrentView('guide')}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
          >
            <FontAwesomeIcon icon={faPlay} className="mr-1" />
            Ver Guía Paso a Paso
          </button>
        </div>
      )}

      {/* Workflows disponibles */}
      {availableWorkflows.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <FontAwesomeIcon icon={faBook} className="mr-2 text-purple-600" />
            Flujos Completos de Trabajo
          </h4>
          {availableWorkflows.map(([workflowKey, workflow]) => (
            <button
              key={workflowKey}
              onClick={() => {
                setSelectedWorkflow(workflowKey);
                setCurrentView('workflow');
                setCurrentStepIndex(0);
              }}
              className="w-full text-left p-3 mb-2 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <h5 className="font-medium text-purple-800">{workflow.title}</h5>
              <p className="text-sm text-purple-600">{workflow.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Enlaces rápidos */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-800 mb-2">Enlaces Rápidos</h4>
        <div className="space-y-2 text-sm">
          <a 
            href="/MANUAL_USUARIO.md" 
            target="_blank" 
            className="text-blue-600 hover:text-blue-800 block"
          >
            📖 Manual Completo de Usuario
          </a>
          <button className="text-green-600 hover:text-green-800 block">
            💬 Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );

  const renderGuideView = () => {
    if (!currentGuide) return null;

    const currentStep = currentGuide.steps[currentStepIndex];
    const totalSteps = currentGuide.steps.length;

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentView('main')}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
            Volver
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {currentGuide.title}
        </h3>
        
        {/* Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Paso {currentStepIndex + 1} de {totalSteps}</span>
            <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Contenido del paso actual */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-800 mb-2">{currentStep.title}</h4>
          <p className="text-gray-700 mb-3">{currentStep.content}</p>
          
          {currentStep.action && (
            <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Acción:</strong> {currentStep.action}
              </p>
            </div>
          )}
          
          {currentStep.tip && (
            <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> {currentStep.tip}
              </p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setCurrentStepIndex(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === totalSteps - 1}
            className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  };

  const renderWorkflowView = () => {
    if (!selectedWorkflow) return null;

    const workflow = WORKFLOW_GUIDES[selectedWorkflow];
    const currentStep = workflow.steps[currentStepIndex];
    const totalSteps = workflow.steps.length;

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentView('main')}
            className="text-purple-600 hover:text-purple-800 flex items-center"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
            Volver
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {workflow.title}
        </h3>
        
        {/* Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Paso {currentStep.step} de {totalSteps}</span>
            <span>{Math.round((currentStep.step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep.step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Contenido del paso actual */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              {currentStep.step}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{currentStep.actor}</h4>
              <p className="text-sm text-gray-600">{currentStep.action}</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">{currentStep.description}</p>
          
          <div className="grid grid-cols-1 gap-2 mb-3">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Componente:</strong> {currentStep.component}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                <strong>Resultado:</strong> {currentStep.nextStep}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setCurrentStepIndex(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === totalSteps - 1}
            className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg transition-all duration-300 flex items-center justify-center group"
        title="Ayuda y Guías"
      >
        <FontAwesomeIcon icon={faQuestionCircle} size="lg" />
        <span className="absolute right-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ayuda
        </span>
      </button>

      {/* Modal de ayuda */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            {currentView === 'main' && renderMainView()}
            {currentView === 'guide' && renderGuideView()}
            {currentView === 'workflow' && renderWorkflowView()}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingHelpButton;
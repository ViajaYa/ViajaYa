import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error caught by ErrorBoundary:', error);
    console.error('📍 Error info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">
                Oops! Algo salió mal
              </h1>
              <p className="text-gray-600">
                Ha ocurrido un error inesperado en la aplicación
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">Detalles del error:</h3>
              <pre className="text-sm text-red-700 overflow-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                🔄 Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;

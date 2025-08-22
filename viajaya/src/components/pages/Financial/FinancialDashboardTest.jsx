import { useState } from 'react';
import RealFinancialBalanceFixed from './RealFinancialBalanceFixed';

const FinancialDashboardTest = () => {
  const [activeTab, setActiveTab] = useState('resumen');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 📋 ENCABEZADO */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Dashboard Financiero - Test</h1>
              <p className="mt-1 text-sm text-gray-600">
                Prueba del componente RealFinancialBalance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🔗 NAVEGACIÓN POR PESTAÑAS SIMPLIFICADA */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'resumen', name: 'Balance Financiero', icon: '💰' },
                { id: 'test', name: 'Test Simple', icon: '🧪' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 📊 CONTENIDO DE PESTAÑAS */}
        {activeTab === 'resumen' && (
          <RealFinancialBalanceFixed />
        )}

        {activeTab === 'test' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Test Simple Funcionando
              </h3>
              <p className="text-gray-500">
                Si ves esto, el dashboard básico funciona correctamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboardTest;

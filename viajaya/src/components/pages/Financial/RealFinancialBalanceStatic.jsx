import { useState } from 'react';

const RealFinancialBalanceStatic = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // 💰 FORMATEAR MONEDA
  const formatCurrency = (amount) => {
    const safeAmount = Number(amount) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safeAmount);
  };

  // 📊 FORMATEAR PORCENTAJE
  const formatPercentage = (percentage) => {
    const safePercentage = Number(percentage) || 0;
    return `${safePercentage.toFixed(1)}%`;
  };

  // 🎨 OBTENER COLOR SEGÚN VALOR
  const getValueColor = (value) => {
    const safeValue = Number(value) || 0;
    if (safeValue > 0) return 'text-green-600';
    if (safeValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // 📈 MÉTRICAS DE PRUEBA ESTÁTICAS
  const realMetrics = {
    ingresosBrutos: 5000000,
    gastosReales: 3500000,
    gananciaNeta: 1500000,
    margenGanancia: 30,
    roiPorcentaje: 42.8,
    eficienciaOperacional: 70
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 🎯 HEADER CON FILTROS */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💰 Balance Financiero Real - Test Estático
            </h1>
            <p className="text-gray-600">
              Versión de prueba con datos estáticos para diagnosticar errores
            </p>
          </div>
          
          {/* 📅 FILTROS DE FECHA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 📊 MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 💰 INGRESOS BRUTOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Ingresos Brutos
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(realMetrics.ingresosBrutos)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Pagos recibidos de clientes (datos de prueba)
          </div>
        </div>

        {/* 💸 GASTOS REALES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Gastos Reales
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(realMetrics.gastosReales)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Compras y gastos operacionales (datos de prueba)
          </div>
        </div>

        {/* 📈 GANANCIA NETA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Ganancia Neta Real
              </p>
              <p className={`text-2xl font-bold ${getValueColor(realMetrics.gananciaNeta)}`}>
                {formatCurrency(realMetrics.gananciaNeta)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              realMetrics.gananciaNeta >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <span className="text-2xl">{realMetrics.gananciaNeta >= 0 ? '📈' : '📉'}</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Diferencia real entre ingresos y gastos
          </div>
        </div>

        {/* 📊 MARGEN DE GANANCIA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Margen de Ganancia
              </p>
              <p className={`text-2xl font-bold ${getValueColor(realMetrics.margenGanancia)}`}>
                {formatPercentage(realMetrics.margenGanancia)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Porcentaje de ganancia sobre ventas
          </div>
        </div>
      </div>

      {/* ✅ MENSAJE DE ESTADO */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-green-400 text-xl">✅</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Componente funcionando correctamente
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Si puedes ver esta versión estática del Balance Financiero, 
                significa que el problema está en la integración con Redux o 
                en el procesamiento de datos reales del backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealFinancialBalanceStatic;

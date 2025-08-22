import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFinancialSummary } from '../../../redux/slices/financialSlice';

const RealFinancialBalance = () => {
  const dispatch = useDispatch();
  const { summary } = useSelector(state => state.financial);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // 🔄 CARGAR DATOS AL CAMBIAR FILTROS
  useEffect(() => {
    dispatch(fetchFinancialSummary({
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    }));
  }, [dispatch, dateRange.startDate, dateRange.endDate]);

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

  // 📈 CALCULAR MÉTRICAS REALES
  const realMetrics = summary?.metricas ? {
    ingresosBrutos: Number(summary.metricas.total_ingresos) || 0,
    gastosReales: Number(summary.metricas.total_gastos) || 0,
    gananciaNeta: (Number(summary.metricas.total_ingresos) || 0) - (Number(summary.metricas.total_gastos) || 0),
    margenGanancia: (Number(summary.metricas.total_ingresos) || 0) > 0 
      ? (((Number(summary.metricas.total_ingresos) || 0) - (Number(summary.metricas.total_gastos) || 0)) / (Number(summary.metricas.total_ingresos) || 0)) * 100
      : 0,
    roiPorcentaje: (Number(summary.metricas.total_gastos) || 0) > 0 
      ? (((Number(summary.metricas.total_ingresos) || 0) - (Number(summary.metricas.total_gastos) || 0)) / (Number(summary.metricas.total_gastos) || 0)) * 100
      : 0,
    eficienciaOperacional: (Number(summary.metricas.total_ingresos) || 0) > 0 
      ? ((Number(summary.metricas.total_gastos) || 0) / (Number(summary.metricas.total_ingresos) || 0)) * 100
      : 0
  } : {
    ingresosBrutos: 0,
    gastosReales: 0,
    gananciaNeta: 0,
    margenGanancia: 0,
    roiPorcentaje: 0,
    eficienciaOperacional: 0
  };

  // 📊 DATOS DEL GRÁFICO MENSUAL
  const monthlyData = Array.isArray(summary?.datos_mensuales) ? summary.datos_mensuales : [];
  const maxValue = monthlyData.length > 0 ? Math.max(
    ...monthlyData.map(item => Math.max(Number(item.ingresos) || 0, Number(item.gastos) || 0))
  ) * 1.1 : 100;

  // 📅 NOMBRES DE MESES
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (summary?.loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 🎯 HEADER CON FILTROS */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💰 Balance Financiero Real
            </h1>
            <p className="text-gray-600">
              Análisis preciso de ingresos vs gastos reales con métricas de rentabilidad
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
            Pagos recibidos de clientes
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
            Compras y gastos operacionales
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
              <span className="text-2xl">
                {realMetrics.gananciaNeta >= 0 ? '📈' : '📉'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Ingresos - Gastos reales
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
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              realMetrics.margenGanancia >= 0 ? 'bg-purple-100' : 'bg-yellow-100'
            }`}>
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            % de ganancia sobre ingresos
          </div>
        </div>
      </div>

      {/* 📊 MÉTRICAS ADICIONALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 🎯 ROI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              ROI (Retorno de Inversión)
            </p>
            <p className={`text-xl font-bold ${getValueColor(realMetrics.roiPorcentaje)}`}>
              {formatPercentage(realMetrics.roiPorcentaje)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Rentabilidad sobre gastos
            </p>
          </div>
        </div>

        {/* ⚡ EFICIENCIA OPERACIONAL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Eficiencia Operacional
            </p>
            <p className={`text-xl font-bold ${
              realMetrics.eficienciaOperacional <= 80 ? 'text-green-600' : 
              realMetrics.eficienciaOperacional <= 90 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatPercentage(realMetrics.eficienciaOperacional)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              % gastos vs ingresos
            </p>
          </div>
        </div>

        {/* 💡 PUNTO DE EQUILIBRIO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💡</span>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Punto de Equilibrio
            </p>
            <p className={`text-xl font-bold ${
              realMetrics.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {realMetrics.gananciaNeta >= 0 ? '✅ Alcanzado' : '❌ No alcanzado'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Estado actual del negocio
            </p>
          </div>
        </div>
      </div>

      {/* 📈 GRÁFICO DE FLUJO DE CAJA MENSUAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            📈 Flujo de Caja Mensual Real
          </h3>
          <p className="text-gray-600">
            Comparación mensual de ingresos vs gastos reales con ganancia neta
          </p>
        </div>

        {monthlyData.length > 0 ? (
          <div className="h-96 relative">
            {/* 📊 GRÁFICO DE BARRAS */}
            <div className="flex items-end justify-between h-full space-x-2 pt-4">
              {monthlyData.map((item, index) => {
                const incomeHeight = ((Number(item.ingresos) || 0) / maxValue) * 100;
                const expensesHeight = ((Number(item.gastos) || 0) / maxValue) * 100;
                const profit = (Number(item.ingresos) || 0) - (Number(item.gastos) || 0);
                const month = monthNames[new Date(item.mes).getMonth()] || `Mes ${index + 1}`;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    {/* 📊 BARRAS */}
                    <div className="relative w-full h-full flex items-end justify-center space-x-1">
                      {/* 💰 BARRA DE INGRESOS */}
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 relative group"
                          style={{ height: `${incomeHeight}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Ingresos: {formatCurrency(Number(item.ingresos) || 0)}
                          </div>
                        </div>
                      </div>

                      {/* 💸 BARRA DE GASTOS */}
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600 relative group"
                          style={{ height: `${expensesHeight}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Gastos: {formatCurrency(Number(item.gastos) || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 📅 ETIQUETA DEL MES Y GANANCIA */}
                    <div className="mt-2 text-center">
                      <div className="text-xs text-gray-600 font-medium">
                        {month}
                      </div>
                      <div className={`text-xs font-bold mt-1 ${getValueColor(profit)}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 📏 ESCALA VERTICAL */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-20">
              <span>{formatCurrency(maxValue)}</span>
              <span>{formatCurrency(maxValue * 0.75)}</span>
              <span>{formatCurrency(maxValue * 0.5)}</span>
              <span>{formatCurrency(maxValue * 0.25)}</span>
              <span>$0</span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">No hay información para el período seleccionado.</p>
            </div>
          </div>
        )}

        {/* 🔍 LEYENDA MEJORADA */}
        <div className="flex justify-center items-center mt-6 space-x-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Ingresos Reales</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Gastos Reales</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Ganancia Neta (Verde/Rojo)</span>
          </div>
        </div>
      </div>

      {/* 📋 RESUMEN EJECUTIVO */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          📋 Resumen Ejecutivo del Período
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">💰 Situación Financiera:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Ingresos totales: <span className="font-medium text-green-600">{formatCurrency(realMetrics.ingresosBrutos)}</span></li>
              <li>• Gastos totales: <span className="font-medium text-red-600">{formatCurrency(realMetrics.gastosReales)}</span></li>
              <li>• Ganancia neta: <span className={`font-medium ${getValueColor(realMetrics.gananciaNeta)}`}>{formatCurrency(realMetrics.gananciaNeta)}</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">📊 Indicadores Clave:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Margen de ganancia: <span className={`font-medium ${getValueColor(realMetrics.margenGanancia)}`}>{formatPercentage(realMetrics.margenGanancia)}</span></li>
              <li>• ROI: <span className={`font-medium ${getValueColor(realMetrics.roiPorcentaje)}`}>{formatPercentage(realMetrics.roiPorcentaje)}</span></li>
              <li>• Eficiencia operacional: <span className="font-medium">{formatPercentage(realMetrics.eficienciaOperacional)}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealFinancialBalance;

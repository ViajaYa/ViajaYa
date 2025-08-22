import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { fetchFinancialSummary } from '../../../redux/slices/financialSlice';

const RealFinancialBalanceFixed = () => {
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

  // 📈 CALCULAR MÉTRICAS REALES DESDE EL SLICE
  const realMetrics = {
    ingresosBrutos: Number(summary.totalIncome) || 0,
    gastosReales: Number(summary.totalExpenses) || 0,
    gananciaNeta: Number(summary.netProfit) || 0,
    margenGanancia: Number(summary.profitMargin) || 0,
    roiPorcentaje: (Number(summary.totalExpenses) || 0) > 0 
      ? (((Number(summary.totalIncome) || 0) - (Number(summary.totalExpenses) || 0)) / (Number(summary.totalExpenses) || 0)) * 100
      : 0,
    eficienciaOperacional: (Number(summary.totalIncome) || 0) > 0 
      ? ((Number(summary.totalExpenses) || 0) / (Number(summary.totalIncome) || 0)) * 100
      : 0
  };

  // 🥧 COMPONENTE DE GRÁFICO DE TORTA
  const PieChart = ({ data, size = 200, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
      return (
        <div className="flex flex-col items-center">
          <div 
            className="border border-gray-200 rounded-full flex items-center justify-center bg-gray-50"
            style={{ width: size, height: size }}
          >
            <span className="text-gray-400 text-sm">Sin datos</span>
          </div>
          <h4 className="text-sm font-medium text-gray-600 mt-2">{title}</h4>
        </div>
      );
    }

    let currentAngle = 0;
    const radius = (size - 20) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    const segments = data.map((item) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      // Convertir ángulos a radianes
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      // Calcular puntos del arco
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      // Flag para arcos grandes
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      // Path del segmento
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle += angle;
      
      return {
        ...item,
        pathData,
        percentage: percentage.toFixed(1),
        startAngle,
        endAngle
      };
    });

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </g>
            ))}
            
            {/* Círculo central */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.4}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            
            {/* Texto central */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="text-sm font-bold fill-gray-700 transform rotate-90"
              style={{ fontSize: '12px' }}
            >
              {formatCurrency(total)}
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              className="text-xs fill-gray-500 transform rotate-90"
              style={{ fontSize: '10px' }}
            >
              Total
            </text>
          </svg>
        </div>
        
        <h4 className="text-sm font-medium text-gray-700 mt-3 mb-2">{title}</h4>
        
        {/* Leyenda */}
        <div className="space-y-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="text-gray-600">{segment.label}</span>
              <span className="font-medium text-gray-800">{segment.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Asignar PropTypes al componente PieChart
  PieChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired
    })).isRequired,
    size: PropTypes.number,
    title: PropTypes.string.isRequired
  };

  // � NOMBRES DE MESES
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  // �📊 DATOS DEL GRÁFICO MENSUAL DESDE EL SLICE
  const monthlyData = Array.isArray(summary.monthlyData) ? summary.monthlyData : [];

  // 📊 DATOS DE GRÁFICOS DE TORTA
  const incomeVsExpensesData = [
    {
      label: 'Ingresos',
      value: realMetrics.ingresosBrutos,
      color: '#10b981' // Verde
    },
    {
      label: 'Gastos',
      value: realMetrics.gastosReales,
      color: '#ef4444' // Rojo
    }
  ];

  const profitabilityData = [
    {
      label: 'Ganancia',
      value: Math.max(0, realMetrics.gananciaNeta),
      color: '#3b82f6' // Azul
    },
    {
      label: 'Costos',
      value: realMetrics.gastosReales,
      color: '#f59e0b' // Amarillo
    }
  ];

  // 📈 GRÁFICO MENSUAL COMO MINI TORTAS
  const monthlyCharts = monthlyData.slice(0, 6).map((item, index) => {
    const income = Number(item.income) || 0;
    const expenses = Number(item.expenses) || 0;
    const month = item.month ? monthNames[new Date(item.month).getMonth()] : `Mes ${index + 1}`;
    
    return {
      month,
      data: [
        { label: 'Ingresos', value: income, color: '#10b981' },
        { label: 'Gastos', value: expenses, color: '#ef4444' }
      ]
    };
  });

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (summary.loading) {
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
              💰 Balance Financiero Real - Redux Corregido
            </h1>
            <p className="text-gray-600">
              Análisis preciso usando la estructura del Redux slice
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

      {/* 🥧 GRÁFICOS DE TORTA FINANCIEROS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* � GRÁFICO: INGRESOS VS GASTOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-center">
            <PieChart 
              data={incomeVsExpensesData} 
              size={280} 
              title="Distribución: Ingresos vs Gastos" 
            />
          </div>
        </div>

        {/* � GRÁFICO: RENTABILIDAD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-center">
            <PieChart 
              data={profitabilityData} 
              size={280} 
              title="Análisis de Rentabilidad" 
            />
          </div>
        </div>
      </div>

      {/* � ANÁLISIS MENSUAL CON MINI TORTAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            📈 Análisis Mensual Detallado
          </h3>
          <p className="text-gray-600">
            Comparación visual por mes: {monthlyData.length} períodos disponibles
          </p>
        </div>

        {monthlyCharts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {monthlyCharts.map((monthChart, index) => (
              <div key={index} className="text-center">
                <PieChart 
                  data={monthChart.data} 
                  size={160} 
                  title={monthChart.month} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 012-2h2a2 2 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 012-2h2a2 2 0 012 2v14a2 2 01-2 2h-2a2 2 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">No hay información para el período seleccionado.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🐛 DEBUG INFO */}
      {summary.error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error en Redux
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{summary.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealFinancialBalanceFixed;

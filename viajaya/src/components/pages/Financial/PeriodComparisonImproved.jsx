import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Calendar, TrendingUp, TrendingDown, ArrowUpDown, Filter, DollarSign } from 'lucide-react';

// Componente de gráfico de torta personalizado
const ComparisonPieChart = ({ data, title, size = 180, colors = ['#3B82F6', '#EF4444'] }) => {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center p-3">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Sin datos</span>
        </div>
        <h4 className="text-xs font-medium text-gray-600 mt-2 text-center">{title}</h4>
      </div>
    );
  }
  
  let cumulativeAngle = 0;
  const radius = size / 2 - 8;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const paths = data.map((item, index) => {
    const value = Number(item.value || 0);
    const percentage = (value / total) * 100;
    const angle = (value / total) * 2 * Math.PI;
    
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    cumulativeAngle += angle;
    
    return {
      pathData,
      color: colors[index % colors.length],
      label: item.label,
      value,
      percentage: percentage.toFixed(1)
    };
  });
  
  return (
    <div className="flex flex-col items-center p-3">
      <svg width={size} height={size} className="mb-2">
        {paths.map((path, index) => (
          <g key={index}>
            <path
              d={path.pathData}
              fill={path.color}
              stroke="white"
              strokeWidth="1"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          </g>
        ))}
        
        {/* Texto central con total */}
        <text x={centerX} y={centerY} textAnchor="middle" className="text-xs font-bold fill-gray-700">
          ${(total / 1000).toFixed(0)}K
        </text>
      </svg>
      
      <h4 className="text-xs font-medium text-gray-700 mb-1 text-center">{title}</h4>
      
      <div className="space-y-0.5 text-xs">
        {paths.map((path, index) => (
          <div key={index} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: path.color }}
            />
            <span className="text-gray-600 text-xs">
              {path.label}: {path.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente principal
const PeriodComparisonImproved = () => {
  const financialSummary = useSelector(state => state.financial.summary);
  const [selectedPeriods, setSelectedPeriods] = useState({ current: 3, previous: 3 }); // meses
  
  // Procesar datos para comparación
  const comparisonData = useMemo(() => {
    if (!financialSummary?.datos_mensuales || financialSummary.datos_mensuales.length === 0) return null;
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const allData = financialSummary.datos_mensuales.map(item => ({
      month: monthNames[item.mes - 1] || `Mes ${item.mes}`,
      monthNumber: item.mes,
      ingresos: Number(item.total_ingresos || 0),
      gastos: Number(item.total_gastos || 0),
      beneficio: Number(item.total_ingresos || 0) - Number(item.total_gastos || 0)
    }));
    
    // Obtener períodos de comparación
    const totalMonths = allData.length;
    const currentPeriodData = allData.slice(-selectedPeriods.current);
    const previousPeriodData = allData.slice(-(selectedPeriods.current + selectedPeriods.previous), -selectedPeriods.current);
    
    // Calcular totales
    const currentTotals = currentPeriodData.reduce((acc, item) => ({
      ingresos: acc.ingresos + item.ingresos,
      gastos: acc.gastos + item.gastos,
      beneficio: acc.beneficio + item.beneficio
    }), { ingresos: 0, gastos: 0, beneficio: 0 });
    
    const previousTotals = previousPeriodData.reduce((acc, item) => ({
      ingresos: acc.ingresos + item.ingresos,
      gastos: acc.gastos + item.gastos,
      beneficio: acc.beneficio + item.beneficio
    }), { ingresos: 0, gastos: 0, beneficio: 0 });
    
    // Calcular variaciones
    const variations = {
      ingresos: previousTotals.ingresos !== 0 ? 
        ((currentTotals.ingresos - previousTotals.ingresos) / Math.abs(previousTotals.ingresos)) * 100 : 0,
      gastos: previousTotals.gastos !== 0 ? 
        ((currentTotals.gastos - previousTotals.gastos) / Math.abs(previousTotals.gastos)) * 100 : 0,
      beneficio: previousTotals.beneficio !== 0 ? 
        ((currentTotals.beneficio - previousTotals.beneficio) / Math.abs(previousTotals.beneficio)) * 100 : 0
    };
    
    return {
      currentPeriod: {
        data: currentPeriodData,
        totals: currentTotals,
        name: `Últimos ${selectedPeriods.current} meses`
      },
      previousPeriod: {
        data: previousPeriodData,
        totals: previousTotals,
        name: `${selectedPeriods.previous} meses anteriores`
      },
      variations,
      availableMonths: totalMonths
    };
  }, [financialSummary, selectedPeriods]);
  
  // Datos para gráficos de torta
  const pieChartsData = useMemo(() => {
    if (!comparisonData) return null;
    
    return {
      currentPeriod: {
        incomeExpenses: [
          { label: 'Ingresos', value: comparisonData.currentPeriod.totals.ingresos },
          { label: 'Gastos', value: comparisonData.currentPeriod.totals.gastos }
        ],
        profitability: [
          { label: 'Beneficio', value: Math.max(0, comparisonData.currentPeriod.totals.beneficio) },
          { label: 'Pérdida', value: Math.max(0, -comparisonData.currentPeriod.totals.beneficio) }
        ]
      },
      previousPeriod: {
        incomeExpenses: [
          { label: 'Ingresos', value: comparisonData.previousPeriod.totals.ingresos },
          { label: 'Gastos', value: comparisonData.previousPeriod.totals.gastos }
        ],
        profitability: [
          { label: 'Beneficio', value: Math.max(0, comparisonData.previousPeriod.totals.beneficio) },
          { label: 'Pérdida', value: Math.max(0, -comparisonData.previousPeriod.totals.beneficio) }
        ]
      }
    };
  }, [comparisonData]);
  
  if (!comparisonData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos para comparar</h3>
          <p className="text-gray-500">No hay suficientes datos históricos para hacer comparaciones</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 🎛️ CONTROLES DE PERÍODO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Configurar Períodos de Comparación</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Actual (meses)
            </label>
            <select
              value={selectedPeriods.current}
              onChange={(e) => setSelectedPeriods(prev => ({ ...prev, current: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 mes</option>
              <option value={2}>2 meses</option>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Anterior (meses)
            </label>
            <select
              value={selectedPeriods.previous}
              onChange={(e) => setSelectedPeriods(prev => ({ ...prev, previous: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 mes</option>
              <option value={2}>2 meses</option>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Comparando:</span> {comparisonData.currentPeriod.name} vs {comparisonData.previousPeriod.name}
          <span className="ml-2">({comparisonData.availableMonths} meses de datos disponibles)</span>
        </div>
      </div>
      
      {/* 📊 MÉTRICAS DE COMPARACIÓN */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpDown className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Comparación de Períodos</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Variación de Ingresos */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Variación en Ingresos</span>
            </div>
            <div className={`text-2xl font-bold ${comparisonData.variations.ingresos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.variations.ingresos >= 0 ? '+' : ''}{comparisonData.variations.ingresos.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {comparisonData.variations.ingresos >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className="text-xs text-gray-500">
                ${Math.abs(comparisonData.currentPeriod.totals.ingresos - comparisonData.previousPeriod.totals.ingresos).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Variación de Gastos */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Variación en Gastos</span>
            </div>
            <div className={`text-2xl font-bold ${comparisonData.variations.gastos <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.variations.gastos >= 0 ? '+' : ''}{comparisonData.variations.gastos.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {comparisonData.variations.gastos <= 0 ? (
                <TrendingDown className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingUp className="w-3 h-3 text-red-600" />
              )}
              <span className="text-xs text-gray-500">
                ${Math.abs(comparisonData.currentPeriod.totals.gastos - comparisonData.previousPeriod.totals.gastos).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Variación de Beneficio */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Variación en Beneficio</span>
            </div>
            <div className={`text-2xl font-bold ${comparisonData.variations.beneficio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.variations.beneficio >= 0 ? '+' : ''}{comparisonData.variations.beneficio.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {comparisonData.variations.beneficio >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className="text-xs text-gray-500">
                ${Math.abs(comparisonData.currentPeriod.totals.beneficio - comparisonData.previousPeriod.totals.beneficio).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* 🥧 GRÁFICOS DE COMPARACIÓN */}
        {pieChartsData && (
          <div className="space-y-8">
            {/* Período Actual */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {comparisonData.currentPeriod.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg">
                  <ComparisonPieChart
                    data={pieChartsData.currentPeriod.incomeExpenses}
                    title="Ingresos vs Gastos"
                    colors={['#10B981', '#EF4444']}
                  />
                </div>
                <div className="bg-blue-50 rounded-lg">
                  <ComparisonPieChart
                    data={pieChartsData.currentPeriod.profitability.filter(item => item.value > 0)}
                    title="Rentabilidad"
                    colors={['#3B82F6', '#F59E0B']}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      ${comparisonData.currentPeriod.totals.beneficio.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Beneficio Total</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Margen: {comparisonData.currentPeriod.totals.ingresos > 0 ? 
                        ((comparisonData.currentPeriod.totals.beneficio / comparisonData.currentPeriod.totals.ingresos) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Período Anterior */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {comparisonData.previousPeriod.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg">
                  <ComparisonPieChart
                    data={pieChartsData.previousPeriod.incomeExpenses}
                    title="Ingresos vs Gastos"
                    colors={['#10B981', '#EF4444']}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg">
                  <ComparisonPieChart
                    data={pieChartsData.previousPeriod.profitability.filter(item => item.value > 0)}
                    title="Rentabilidad"
                    colors={['#3B82F6', '#F59E0B']}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 mb-1">
                      ${comparisonData.previousPeriod.totals.beneficio.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Beneficio Total</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Margen: {comparisonData.previousPeriod.totals.ingresos > 0 ? 
                        ((comparisonData.previousPeriod.totals.beneficio / comparisonData.previousPeriod.totals.ingresos) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 📋 TABLA COMPARATIVA DETALLADA */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparación Detallada</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">Métrica</th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-semibold text-gray-700">{comparisonData.currentPeriod.name}</th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-semibold text-gray-700">{comparisonData.previousPeriod.name}</th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-semibold text-gray-700">Variación</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-gray-200 px-4 py-2 font-medium">Ingresos Totales</td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-green-600 font-semibold">
                    ${comparisonData.currentPeriod.totals.ingresos.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-gray-600">
                    ${comparisonData.previousPeriod.totals.ingresos.toLocaleString()}
                  </td>
                  <td className={`border border-gray-200 px-4 py-2 text-center font-semibold ${
                    comparisonData.variations.ingresos >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonData.variations.ingresos >= 0 ? '+' : ''}{comparisonData.variations.ingresos.toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-medium">Gastos Totales</td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-red-600 font-semibold">
                    ${comparisonData.currentPeriod.totals.gastos.toLocaleString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-gray-600">
                    ${comparisonData.previousPeriod.totals.gastos.toLocaleString()}
                  </td>
                  <td className={`border border-gray-200 px-4 py-2 text-center font-semibold ${
                    comparisonData.variations.gastos <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonData.variations.gastos >= 0 ? '+' : ''}{comparisonData.variations.gastos.toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-gray-200 px-4 py-2 font-medium">Beneficio Neto</td>
                  <td className={`border border-gray-200 px-4 py-2 text-center font-semibold ${
                    comparisonData.currentPeriod.totals.beneficio >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${comparisonData.currentPeriod.totals.beneficio.toLocaleString()}
                  </td>
                  <td className={`border border-gray-200 px-4 py-2 text-center ${
                    comparisonData.previousPeriod.totals.beneficio >= 0 ? 'text-gray-600' : 'text-gray-600'
                  }`}>
                    ${comparisonData.previousPeriod.totals.beneficio.toLocaleString()}
                  </td>
                  <td className={`border border-gray-200 px-4 py-2 text-center font-semibold ${
                    comparisonData.variations.beneficio >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonData.variations.beneficio >= 0 ? '+' : ''}{comparisonData.variations.beneficio.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes para ComparisonPieChart
ComparisonPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string)
};

export default PeriodComparisonImproved;

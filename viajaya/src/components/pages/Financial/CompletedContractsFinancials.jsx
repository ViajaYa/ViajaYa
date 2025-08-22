import { useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { CheckCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Target, Award, Filter } from 'lucide-react';
import { fetchCompletedContractsFinancials } from '../../../redux/slices/financialSlice';

// Componente de gráfico de torta personalizado para contratos completados
const CompletedContractsPieChart = ({ data, title, size = 200, colors = ['#10B981', '#EF4444'] }) => {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  
  if (total === 0 || !data || data.length === 0) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Sin datos</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-600 mt-2">{title}</h3>
      </div>
    );
  }
  
  let cumulativeAngle = 0;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const paths = data.map((item, index) => {
    const value = Number(item.value || 0);
    if (value <= 0) return null; // Skip zero or negative values
    
    const percentage = (value / total) * 100;
    const angle = (value / total) * 2 * Math.PI;
    
    // Prevent invalid angles
    if (!isFinite(angle) || angle <= 0) return null;
    
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    // Check for valid coordinates
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
      return null;
    }
    
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
  }).filter(Boolean); // Remove null values
  
  return (
    <div className="flex flex-col items-center p-4">
      <svg width={size} height={size} className="mb-3">
        {paths.map((path, index) => (
          <g key={index}>
            <path
              d={path.pathData}
              fill={path.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          </g>
        ))}
        
        {/* Texto central con total */}
        <text x={centerX} y={centerY} textAnchor="middle" className="text-lg font-bold fill-gray-700">
          ${(total / 1000).toFixed(0)}K
        </text>
      </svg>
      
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      
      <div className="space-y-1 text-xs">
        {paths.map((path, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: path.color }}
            />
            <span className="text-gray-600">
              {path.label}: {path.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente principal
const CompletedContractsFinancials = () => {
  const dispatch = useDispatch();
  const { completedContracts } = useSelector(state => state.financial);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  
  // Cargar datos al montar el componente
  useEffect(() => {
    dispatch(fetchCompletedContractsFinancials());
  }, [dispatch]);
  
  // Aplicar filtros de fecha
  const handleFilterChange = () => {
    const filters = {};
    if (dateFilter.start) filters.startDate = dateFilter.start;
    if (dateFilter.end) filters.endDate = dateFilter.end;
    
    dispatch(fetchCompletedContractsFinancials(filters));
  };
  
  // Datos para gráficos de torta
  const chartData = useMemo(() => {
    if (!completedContracts.resumen) return null;
    
    const { total_ingresos, total_gastos, ganancia_total } = completedContracts.resumen;
    
    return {
      incomeVsExpenses: [
        { label: 'Ingresos', value: total_ingresos },
        { label: 'Gastos', value: total_gastos }
      ],
      profitDistribution: [
        { label: 'Ganancia', value: Math.max(0, ganancia_total) },
        { label: 'Pérdida', value: Math.max(0, -ganancia_total) }
      ]
    };
  }, [completedContracts.resumen]);
  
  // Top 5 contratos más rentables
  const topContracts = useMemo(() => {
    return completedContracts.contratos
      .slice(0, 5)
      .map(contract => ({
        label: `${contract.contract_number}`,
        value: contract.ganancia_neta
      }));
  }, [completedContracts.contratos]);
  
  if (completedContracts.loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (completedContracts.error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Error al cargar datos</h3>
          <p className="text-gray-500">{completedContracts.error}</p>
          <button 
            onClick={() => dispatch(fetchCompletedContractsFinancials())}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 🎛️ FILTROS DE FECHA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Filtros de Período</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <button
              onClick={handleFilterChange}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
      
      {/* 🏆 MÉTRICAS DE CONTRATOS COMPLETADOS */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Contratos Completados - Análisis Financiero</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Contratos */}
          <div className="p-4 rounded-lg border border-gray-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Contratos Completados</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {completedContracts.resumen.total_contratos}
            </div>
            <p className="text-xs text-gray-500 mt-1">Contratos finalizados</p>
          </div>
          
          {/* Total Ingresos */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Ingresos Totales</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${Number(completedContracts.resumen.total_ingresos).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pagos verificados</p>
          </div>
          
          {/* Ganancia Total */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Ganancia Total</span>
            </div>
            <div className={`text-2xl font-bold ${completedContracts.resumen.ganancia_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Number(completedContracts.resumen.ganancia_total).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Beneficio neto</p>
          </div>
          
          {/* Margen Promedio */}
          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {completedContracts.resumen.margen_promedio >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-600">Margen Promedio</span>
            </div>
            <div className={`text-2xl font-bold ${completedContracts.resumen.margen_promedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(completedContracts.resumen.margen_promedio).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Rentabilidad promedio</p>
          </div>
        </div>
        
        {/* 🥧 GRÁFICOS DE TORTA */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingresos vs Gastos */}
            <div className="bg-gray-50 rounded-lg">
              <CompletedContractsPieChart
                data={chartData.incomeVsExpenses}
                title="Ingresos vs Gastos Totales"
                colors={['#10B981', '#EF4444']}
              />
            </div>
            
            {/* Distribución de Ganancia */}
            <div className="bg-gray-50 rounded-lg">
              <CompletedContractsPieChart
                data={chartData.profitDistribution.filter(item => item.value > 0)}
                title="Distribución de Rentabilidad"
                colors={['#3B82F6', '#F59E0B']}
              />
            </div>
            
            {/* Top 5 Contratos */}
            {topContracts.length > 0 && (
              <div className="bg-gray-50 rounded-lg">
                <CompletedContractsPieChart
                  data={topContracts}
                  title="Top 5 Contratos Más Rentables"
                  colors={['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6B7280']}
                />
              </div>
            )}
          </div>
        )}
        
        {/* 📋 TABLA DETALLADA DE CONTRATOS */}
        {completedContracts.contratos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detalle de Contratos Completados
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">Contrato</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">Cliente</th>
                    <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Pagado</th>
                    <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Gastos</th>
                    <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Ganancia</th>
                    <th className="border border-gray-200 px-4 py-2 text-center font-semibold text-gray-700">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {completedContracts.contratos.map((contract, index) => (
                    <tr key={contract.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {contract.contract_number}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <div>
                          <div className="font-medium">{contract.cliente}</div>
                          <div className="text-xs text-gray-500">{contract.destino}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right text-green-600 font-semibold">
                        ${contract.total_pagado.toLocaleString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-right text-red-600">
                        ${contract.total_gastos.toLocaleString()}
                      </td>
                      <td className={`border border-gray-200 px-4 py-2 text-right font-semibold ${
                        contract.ganancia_neta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${contract.ganancia_neta.toLocaleString()}
                      </td>
                      <td className={`border border-gray-200 px-4 py-2 text-center ${
                        contract.margen_ganancia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {contract.margen_ganancia.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// PropTypes para CompletedContractsPieChart
CompletedContractsPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string)
};

export default CompletedContractsFinancials;

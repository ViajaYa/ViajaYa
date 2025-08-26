import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, AlertTriangle } from 'lucide-react';

// Componente de gráfico de torta personalizado
const PieChart = ({ data, title, size = 200, colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'] }) => {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  
  if (total === 0) {
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
const TrendsAnalysisImproved = ({ loading = false }) => {
  const financialSummary = useSelector(state => state.financial.summary);
  
  // Procesar datos para tendencias
  const trendsData = useMemo(() => {
    if (!financialSummary?.datos_mensuales) return null;
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const processedData = financialSummary.datos_mensuales.map(item => ({
      month: monthNames[item.mes - 1] || `Mes ${item.mes}`,
      ingresos: Number(item.total_ingresos || 0),
      gastos: Number(item.total_gastos || 0),
      beneficio: Number(item.total_ingresos || 0) - Number(item.total_gastos || 0),
      utilidad: Number(item.utilidad_neta || 0)
    }));
    
    return processedData;
  }, [financialSummary]);
  
  // Calcular métricas de tendencias
  const trendMetrics = useMemo(() => {
    if (!trendsData || trendsData.length < 2) return null;
    
    const recent = trendsData.slice(-3); // Últimos 3 meses
    const previous = trendsData.slice(-6, -3); // 3 meses anteriores
    
    const avgRecent = recent.reduce((sum, item) => sum + item.beneficio, 0) / recent.length;
    const avgPrevious = previous.length > 0 ? previous.reduce((sum, item) => sum + item.beneficio, 0) / previous.length : 0;
    
    const growthRate = avgPrevious !== 0 ? ((avgRecent - avgPrevious) / Math.abs(avgPrevious)) * 100 : 0;
    
    return {
      avgRecent: avgRecent.toFixed(0),
      growthRate: growthRate.toFixed(1),
      isPositive: growthRate > 0,
      totalIngresos: recent.reduce((sum, item) => sum + item.ingresos, 0),
      totalGastos: recent.reduce((sum, item) => sum + item.gastos, 0)
    };
  }, [trendsData]);
  
  // Datos para gráficos de torta
  const pieChartData = useMemo(() => {
    if (!trendMetrics) return null;
    
    return {
      incomeVsExpenses: [
        { label: 'Ingresos', value: trendMetrics.totalIngresos },
        { label: 'Gastos', value: trendMetrics.totalGastos }
      ],
      monthlyBreakdown: trendsData?.slice(-6).map(item => ({
        label: item.month,
        value: Math.max(0, item.beneficio) // Solo valores positivos para el gráfico
      })) || []
    };
  }, [trendMetrics, trendsData]);
  
  if (loading) {
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
  
  if (!trendsData || trendsData.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin datos de tendencias</h3>
          <p className="text-gray-500">No hay suficientes datos históricos para mostrar tendencias</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 📈 MÉTRICAS DE TENDENCIAS */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Análisis de Tendencias</h2>
        </div>
        
        {trendMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Tendencia de Crecimiento */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                {trendMetrics.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-600">Tendencia de Crecimiento</span>
              </div>
              <div className={`text-2xl font-bold ${trendMetrics.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trendMetrics.growthRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 3 meses vs anteriores</p>
            </div>
            
            {/* Beneficio Promedio */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Beneficio Promedio</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ${Number(trendMetrics.avgRecent).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 3 meses</p>
            </div>
            
            {/* Estabilidad */}
            <div className="p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600">Estabilidad</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {Math.abs(Number(trendMetrics.growthRate)) < 10 ? 'Alta' : 'Media'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Variación mensual</p>
            </div>
          </div>
        )}
        
        {/* 🥧 GRÁFICOS DE TORTA */}
        {pieChartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ingresos vs Gastos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <PieChart
                data={pieChartData.incomeVsExpenses}
                title="Distribución: Ingresos vs Gastos (Últimos 3 meses)"
                size={220}
                colors={['#10B981', '#EF4444']}
              />
            </div>
            
            {/* Evolución por Meses */}
            <div className="bg-gray-50 rounded-lg p-4">
              <PieChart
                data={pieChartData.monthlyBreakdown.filter(item => item.value > 0)}
                title="Distribución de Beneficios por Mes"
                size={220}
                colors={['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6B7280']}
              />
            </div>
          </div>
        )}
        
        {/* 📊 TABLA DE DATOS MENSUALES */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Datos Mensuales Detallados
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-700">Mes</th>
                  <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Ingresos</th>
                  <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Gastos</th>
                  <th className="border border-gray-200 px-4 py-2 text-right font-semibold text-gray-700">Beneficio</th>
                  <th className="border border-gray-200 px-4 py-2 text-center font-semibold text-gray-700">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {trendsData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-2 font-medium">{row.month}</td>
                    <td className="border border-gray-200 px-4 py-2 text-right text-green-600">
                      ${row.ingresos.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-right text-red-600">
                      ${row.gastos.toLocaleString()}
                    </td>
                    <td className={`border border-gray-200 px-4 py-2 text-right font-semibold ${
                      row.beneficio >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${row.beneficio.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {row.beneficio >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// PropTypes para PieChart
PieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired
  })).isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string)
};

// PropTypes para TrendsAnalysisImproved
TrendsAnalysisImproved.propTypes = {
  loading: PropTypes.bool
};

export default TrendsAnalysisImproved;

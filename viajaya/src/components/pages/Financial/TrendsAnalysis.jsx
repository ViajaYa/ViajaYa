import PropTypes from 'prop-types';

const TrendsAnalysis = ({ monthlyData = [], loading = false }) => {
  // �️ VALIDACIÓN DE DATOS DE ENTRADA
  const safeMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
  
  // �💰 FORMATEAR MONEDA
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

  // 📈 CALCULAR TENDENCIA
  const calculateTrend = (data, field) => {
    if (!data || data.length < 2) return { trend: 0, direction: 'stable' };
    
    const values = data.map(item => Number(item[field]) || 0);
    const first = values[0];
    const last = values[values.length - 1];
    
    if (first === 0) return { trend: last > 0 ? 100 : 0, direction: last > 0 ? 'up' : 'stable' };
    
    const trend = ((last - first) / Math.abs(first)) * 100;
    const direction = trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable';
    
    return { trend: Math.abs(trend), direction };
  };

  // 🎯 IDENTIFICAR MEJORES Y PEORES MESES
  const getBestWorstMonths = (data) => {
    if (!data || data.length === 0) return { best: null, worst: null };
    
    const months = data.map((item, index) => ({
      ...item,
      profit: (Number(item.ingresos) || 0) - (Number(item.gastos) || 0),
      index
    }));
    
    const best = months.reduce((max, current) => 
      current.profit > max.profit ? current : max
    );
    
    const worst = months.reduce((min, current) => 
      current.profit < min.profit ? current : min
    );
    
    return { best, worst };
  };

  // 📅 NOMBRES DE MESES
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!safeMonthlyData || safeMonthlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Análisis de Tendencias
          </h3>
          <p className="text-gray-500">
            No hay suficientes datos para realizar el análisis de tendencias
          </p>
        </div>
      </div>
    );
  }

  const incomeTrend = calculateTrend(safeMonthlyData, 'ingresos');
  const expensesTrend = calculateTrend(safeMonthlyData, 'gastos');
  const { best, worst } = getBestWorstMonths(safeMonthlyData);

  // 📊 CALCULAR INDICADORES CLAVE
  const totalIncome = safeMonthlyData.reduce((sum, item) => sum + (Number(item.ingresos) || 0), 0);
  const totalExpenses = safeMonthlyData.reduce((sum, item) => sum + (Number(item.gastos) || 0), 0);
  const avgIncome = totalIncome / safeMonthlyData.length;
  const avgExpenses = totalExpenses / safeMonthlyData.length;
  const profitability = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          📈 Análisis de Tendencias Financieras
        </h3>
        <p className="text-gray-600">
          Insights y patrones basados en {safeMonthlyData.length} meses de datos
        </p>
      </div>

      {/* 📊 INDICADORES DE TENDENCIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 💰 TENDENCIA DE INGRESOS */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💰</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              incomeTrend.direction === 'up' ? 'bg-green-100 text-green-800' :
              incomeTrend.direction === 'down' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {incomeTrend.direction === 'up' ? '📈 Creciendo' :
               incomeTrend.direction === 'down' ? '📉 Decreciendo' :
               '➡️ Estable'}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Tendencia de Ingresos
          </h4>
          <p className="text-lg font-bold text-green-600">
            {incomeTrend.direction !== 'stable' ? formatPercentage(incomeTrend.trend) : '0%'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Promedio mensual: {formatCurrency(avgIncome)}
          </p>
        </div>

        {/* 💸 TENDENCIA DE GASTOS */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💸</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              expensesTrend.direction === 'down' ? 'bg-green-100 text-green-800' :
              expensesTrend.direction === 'up' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {expensesTrend.direction === 'up' ? '📈 Aumentando' :
               expensesTrend.direction === 'down' ? '📉 Reduciendo' :
               '➡️ Estable'}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Tendencia de Gastos
          </h4>
          <p className="text-lg font-bold text-red-600">
            {expensesTrend.direction !== 'stable' ? formatPercentage(expensesTrend.trend) : '0%'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Promedio mensual: {formatCurrency(avgExpenses)}
          </p>
        </div>

        {/* 📊 RENTABILIDAD GENERAL */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📊</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              profitability > 20 ? 'bg-green-100 text-green-800' :
              profitability > 10 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {profitability > 20 ? '✅ Excelente' :
               profitability > 10 ? '⚠️ Bueno' :
               '❌ Mejorable'}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Rentabilidad Promedio
          </h4>
          <p className={`text-lg font-bold ${
            profitability > 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {formatPercentage(profitability)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Ganancia neta total: {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      {/* 🏆 MEJORES Y PEORES MESES */}
      {best && worst && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🏆</span>
              <h4 className="text-lg font-semibold text-green-800">Mejor Mes</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>{monthNames[new Date(best.mes).getMonth()]}</strong> - Ganancia: 
                <span className="text-green-600 font-bold ml-1">
                  {formatCurrency(best.profit)}
                </span>
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Ingresos: {formatCurrency(best.ingresos)}</div>
                <div>• Gastos: {formatCurrency(best.gastos)}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📉</span>
              <h4 className="text-lg font-semibold text-red-800">Mes Más Difícil</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>{monthNames[new Date(worst.mes).getMonth()]}</strong> - Resultado: 
                <span className="text-red-600 font-bold ml-1">
                  {formatCurrency(worst.profit)}
                </span>
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Ingresos: {formatCurrency(worst.ingresos)}</div>
                <div>• Gastos: {formatCurrency(worst.gastos)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📈 RECOMENDACIONES INTELIGENTES */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Recomendaciones Inteligentes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h5 className="font-medium text-blue-800">🎯 Estrategias de Crecimiento:</h5>
            <ul className="space-y-1 text-blue-700">
              {incomeTrend.direction === 'down' && (
                <li>• Revisar estrategias de ventas y marketing</li>
              )}
              {profitability < 10 && (
                <li>• Optimizar márgenes de ganancia</li>
              )}
              {avgExpenses > avgIncome * 0.8 && (
                <li>• Controlar costos operacionales</li>
              )}
              <li>• Diversificar fuentes de ingresos</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="font-medium text-blue-800">⚡ Optimización Operacional:</h5>
            <ul className="space-y-1 text-blue-700">
              {expensesTrend.direction === 'up' && (
                <li>• Analizar incremento en gastos</li>
              )}
              <li>• Implementar presupuestos mensuales</li>
              <li>• Monitorear KPIs financieros regularmente</li>
              <li>• Automatizar procesos de seguimiento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

TrendsAnalysis.propTypes = {
  monthlyData: PropTypes.arrayOf(PropTypes.shape({
    mes: PropTypes.string,
    ingresos: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    gastos: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  })),
  loading: PropTypes.bool
};

TrendsAnalysis.defaultProps = {
  monthlyData: [],
  loading: false
};

export default TrendsAnalysis;

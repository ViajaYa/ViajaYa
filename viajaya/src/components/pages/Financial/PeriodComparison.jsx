import { useState, useEffect, useCallback } from 'react';

const PeriodComparison = () => {
  const [periods, setPeriods] = useState({
    current: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      data: null,
      loading: false
    },
    previous: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
      data: null,
      loading: false
    }
  });

  const loadPeriodData = useCallback(async (periodType) => {
    setPeriods(prev => ({
      ...prev,
      [periodType]: { ...prev[periodType], loading: true }
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/summary?start_date=${periods[periodType].startDate}&end_date=${periods[periodType].endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      setPeriods(prev => ({
        ...prev,
        [periodType]: { 
          ...prev[periodType], 
          data: data.metricas,
          loading: false 
        }
      }));
    } catch (error) {
      console.error(`Error loading ${periodType} period data:`, error);
      setPeriods(prev => ({
        ...prev,
        [periodType]: { ...prev[periodType], loading: false }
      }));
    }
  }, [periods]);

  // 🔄 CARGAR DATOS DE AMBOS PERÍODOS
  useEffect(() => {
    loadPeriodData('current');
    loadPeriodData('previous');
  }, [loadPeriodData]);

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

  // 📈 CALCULAR CAMBIO PORCENTUAL
  const calculatePercentageChange = (current, previous) => {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;
    
    if (!previousValue || previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  };

  // 🎨 OBTENER COLOR DEL CAMBIO
  const getChangeColor = (change, inverse = false) => {
    if (change > 0) return inverse ? 'text-red-600' : 'text-green-600';
    if (change < 0) return inverse ? 'text-green-600' : 'text-red-600';
    return 'text-gray-600';
  };

  // 📊 OBTENER ICONO DEL CAMBIO
  const getChangeIcon = (change) => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  };

  const currentData = periods.current.data;
  const previousData = periods.previous.data;

  if (periods.current.loading || periods.previous.loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentData || !previousData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Comparación de Períodos
          </h3>
          <p className="text-gray-500">
            No hay suficientes datos para realizar la comparación
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      name: 'Ingresos Totales',
      current: Number(currentData.total_ingresos) || 0,
      previous: Number(previousData.total_ingresos) || 0,
      icon: '💰',
      inverse: false
    },
    {
      name: 'Gastos Totales',
      current: Number(currentData.total_gastos) || 0,
      previous: Number(previousData.total_gastos) || 0,
      icon: '💸',
      inverse: true // Para gastos, menor es mejor
    },
    {
      name: 'Ganancia Neta',
      current: (Number(currentData.total_ingresos) || 0) - (Number(currentData.total_gastos) || 0),
      previous: (Number(previousData.total_ingresos) || 0) - (Number(previousData.total_gastos) || 0),
      icon: '📈',
      inverse: false
    },
    {
      name: 'Margen de Ganancia',
      current: (Number(currentData.total_ingresos) || 0) > 0 
        ? (((Number(currentData.total_ingresos) || 0) - (Number(currentData.total_gastos) || 0)) / (Number(currentData.total_ingresos) || 0)) * 100
        : 0,
      previous: (Number(previousData.total_ingresos) || 0) > 0 
        ? (((Number(previousData.total_ingresos) || 0) - (Number(previousData.total_gastos) || 0)) / (Number(previousData.total_ingresos) || 0)) * 100
        : 0,
      icon: '📊',
      inverse: false,
      isPercentage: true
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🔄 Comparación de Períodos
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Período Actual:</span> {periods.current.startDate} - {periods.current.endDate}
          </div>
          <div>
            <span className="font-medium">Período Anterior:</span> {periods.previous.startDate} - {periods.previous.endDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const change = calculatePercentageChange(metric.current, metric.previous);
          const changeColor = getChangeColor(change, metric.inverse);
          const changeIcon = getChangeIcon(change);

          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">{metric.icon}</span>
                <span className={`text-sm font-medium ${changeColor}`}>
                  {changeIcon} {Math.abs(change).toFixed(1)}%
                </span>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {metric.name}
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Actual:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {metric.isPercentage 
                      ? formatPercentage(metric.current)
                      : formatCurrency(metric.current)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Anterior:</span>
                  <span className="text-sm text-gray-600">
                    {metric.isPercentage 
                      ? formatPercentage(metric.previous)
                      : formatCurrency(metric.previous)
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Diferencia:</span>
                  <span className={`text-sm font-medium ${changeColor}`}>
                    {metric.isPercentage 
                      ? `${metric.current - metric.previous > 0 ? '+' : ''}${formatPercentage(metric.current - metric.previous)}`
                      : `${metric.current - metric.previous > 0 ? '+' : ''}${formatCurrency(metric.current - metric.previous)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📈 ANÁLISIS RÁPIDO */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-bold text-blue-900 mb-2">🔍 Análisis Rápido:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {(() => {
            const incomeChange = calculatePercentageChange(
              currentData.total_ingresos || 0,
              previousData.total_ingresos || 0
            );
            const expenseChange = calculatePercentageChange(
              currentData.total_gastos || 0,
              previousData.total_gastos || 0
            );
            const profitChange = calculatePercentageChange(
              (currentData.total_ingresos || 0) - (currentData.total_gastos || 0),
              (previousData.total_ingresos || 0) - (previousData.total_gastos || 0)
            );

            return (
              <>
                <p>
                  • Los ingresos han {incomeChange >= 0 ? 'aumentado' : 'disminuido'} un <strong>{Math.abs(incomeChange).toFixed(1)}%</strong> respecto al período anterior.
                </p>
                <p>
                  • Los gastos han {expenseChange >= 0 ? 'aumentado' : 'disminuido'} un <strong>{Math.abs(expenseChange).toFixed(1)}%</strong> respecto al período anterior.
                </p>
                <p>
                  • La ganancia neta ha {profitChange >= 0 ? 'mejorado' : 'empeorado'} un <strong>{Math.abs(profitChange).toFixed(1)}%</strong> respecto al período anterior.
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PeriodComparison;

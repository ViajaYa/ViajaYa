import PropTypes from 'prop-types';

const FinancialChart = ({ data = [], loading = false }) => {
  // 🔢 FUNCIÓN PARA FORMATEAR MONEDA COMPACTA
  const formatCurrencyCompact = (amount) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  // 📊 OBTENER VALOR MÁXIMO PARA ESCALA
  const getMaxValue = () => {
    if (!data || data.length === 0) return 100;
    const maxIncome = Math.max(...data.map(item => item.income || 0));
    const maxExpenses = Math.max(...data.map(item => item.expenses || 0));
    return Math.max(maxIncome, maxExpenses) * 1.1; // 10% más para espacio
  };

  // 📅 MESES EN ESPAÑOL
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">No hay información financiera para mostrar en este momento.</p>
        </div>
      </div>
    );
  }

  const maxValue = getMaxValue();

  return (
    <div className="h-80">
      <div className="relative h-full">
        {/* 📊 GRÁFICO DE BARRAS */}
        <div className="flex items-end justify-between h-full space-x-2 pt-4">
          {data.map((item, index) => {
            const incomeHeight = ((item.income || 0) / maxValue) * 100;
            const expensesHeight = ((item.expenses || 0) / maxValue) * 100;
            const month = monthNames[new Date(item.month).getMonth()] || `Mes ${index + 1}`;

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
                      {/* 💡 TOOLTIP */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Ingresos: {formatCurrencyCompact(item.income || 0)}
                      </div>
                    </div>
                  </div>

                  {/* 💸 BARRA DE GASTOS */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600 relative group"
                      style={{ height: `${expensesHeight}%` }}
                    >
                      {/* 💡 TOOLTIP */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Gastos: {formatCurrencyCompact(item.expenses || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 📅 ETIQUETA DEL MES */}
                <div className="mt-2 text-xs text-gray-600 font-medium">
                  {month}
                </div>
              </div>
            );
          })}
        </div>

        {/* 📏 ESCALA VERTICAL */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-16">
          <span>{formatCurrencyCompact(maxValue)}</span>
          <span>{formatCurrencyCompact(maxValue * 0.75)}</span>
          <span>{formatCurrencyCompact(maxValue * 0.5)}</span>
          <span>{formatCurrencyCompact(maxValue * 0.25)}</span>
          <span>$0</span>
        </div>
      </div>

      {/* 🔍 LEYENDA */}
      <div className="flex justify-center items-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Ingresos</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Gastos</span>
        </div>
      </div>
    </div>
  );
};

FinancialChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    month: PropTypes.string,
    income: PropTypes.number,
    expenses: PropTypes.number
  })),
  loading: PropTypes.bool
};

export default FinancialChart;

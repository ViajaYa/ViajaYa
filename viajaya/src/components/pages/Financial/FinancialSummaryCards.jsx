import PropTypes from 'prop-types';

const FinancialSummaryCards = ({ summary }) => {
  const { totalIncome, totalExpenses, netProfit, profitMargin, loading } = summary;

  // 🔢 FUNCIÓN PARA FORMATEAR MONEDA
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // 🔢 FUNCIÓN PARA FORMATEAR PORCENTAJE
  const formatPercentage = (percentage) => {
    return `${(percentage || 0).toFixed(1)}%`;
  };

  // 📊 OBTENER COLOR BASADO EN EL VALOR
  const getValueColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const cards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(totalIncome),
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Gastos Totales',
      value: formatCurrency(totalExpenses),
      icon: '💸',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      title: 'Ganancia Neta',
      value: formatCurrency(netProfit),
      valueColor: getValueColor(netProfit),
      icon: '📈',
      bgColor: netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      iconColor: netProfit >= 0 ? 'text-blue-600' : 'text-orange-600',
      borderColor: netProfit >= 0 ? 'border-blue-200' : 'border-orange-200'
    },
    {
      title: 'Margen de Ganancia',
      value: formatPercentage(profitMargin),
      valueColor: getValueColor(profitMargin, true),
      icon: '📊',
      bgColor: profitMargin >= 0 ? 'bg-purple-50' : 'bg-yellow-50',
      iconColor: profitMargin >= 0 ? 'text-purple-600' : 'text-yellow-600',
      borderColor: profitMargin >= 0 ? 'border-purple-200' : 'border-yellow-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow border ${card.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center">
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <span className={`text-2xl ${card.iconColor}`}>
                {card.icon}
              </span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${card.valueColor || 'text-gray-900'}`}>
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

FinancialSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalIncome: PropTypes.number,
    totalExpenses: PropTypes.number,
    netProfit: PropTypes.number,
    profitMargin: PropTypes.number,
    loading: PropTypes.bool
  }).isRequired
};

export default FinancialSummaryCards;

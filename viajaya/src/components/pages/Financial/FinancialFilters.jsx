import { useState } from 'react';
import PropTypes from 'prop-types';

const FinancialFilters = ({ filters, onFilterChange, type }) => {
  const [contractId, setContractId] = useState(filters.contractId || '');
  const [dateRange, setDateRange] = useState(filters.dateRange || '');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');

  // 🔄 APLICAR FILTROS
  const applyFilters = () => {
    let finalDateRange = dateRange;
    
    // Si es rango personalizado, construir el string
    if (dateRange === 'custom' && customDateStart && customDateEnd) {
      finalDateRange = `${customDateStart},${customDateEnd}`;
    }

    onFilterChange({
      contractId: contractId.trim(),
      dateRange: finalDateRange
    });
  };

  // 🔄 LIMPIAR FILTROS
  const clearFilters = () => {
    setContractId('');
    setDateRange('');
    setCustomDateStart('');
    setCustomDateEnd('');
    onFilterChange({
      contractId: '',
      dateRange: ''
    });
  };

  // 🗓️ OPCIONES DE RANGO DE FECHAS
  const dateRangeOptions = [
    { value: '', label: 'Todas las fechas' },
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last7days', label: 'Últimos 7 días' },
    { value: 'last30days', label: 'Últimos 30 días' },
    { value: 'thisMonth', label: 'Este mes' },
    { value: 'lastMonth', label: 'Mes pasado' },
    { value: 'last3months', label: 'Últimos 3 meses' },
    { value: 'last6months', label: 'Últimos 6 meses' },
    { value: 'thisYear', label: 'Este año' },
    { value: 'lastYear', label: 'Año pasado' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          🔍 Filtros - {type === 'payments' ? 'Pagos' : 'Compras'}
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 📄 FILTRO POR CONTRATO */}
        <div>
          <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-2">
            Número de Contrato
          </label>
          <input
            type="text"
            id="contractId"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Ej: CON-1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* 🗓️ FILTRO POR FECHA */}
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">
            Rango de Fechas
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 🎯 BOTÓN APLICAR */}
        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* 📅 RANGO PERSONALIZADO */}
      {dateRange === 'custom' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customDateStart" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="customDateStart"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="customDateEnd" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin
              </label>
              <input
                type="date"
                id="customDateEnd"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                min={customDateStart}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🔍 FILTROS ACTIVOS */}
      {(contractId || dateRange) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Filtros activos:</p>
          <div className="flex flex-wrap gap-2">
            {contractId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Contrato: {contractId}
              </span>
            )}
            {dateRange && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {dateRangeOptions.find(opt => opt.value === dateRange)?.label || 'Fecha personalizada'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

FinancialFilters.propTypes = {
  filters: PropTypes.shape({
    contractId: PropTypes.string,
    dateRange: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['payments', 'purchases']).isRequired
};

export default FinancialFilters;

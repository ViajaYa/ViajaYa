import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faUser,
  faCalendar,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faSpinner,
  faSync,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchAllVendorsMonthlyLimits,
  selectMonthlyLimits,
  selectCommissionLoading,
  clearMonthlyLimits,
} from "../../../redux/slices/commissionSlice";
import { toast } from "react-hot-toast";
import NavBar from "../../layout/NavBar/NavBar";

const MonthlyLimitsManager = () => {
  const dispatch = useDispatch();
  const monthlyLimits = useSelector(selectMonthlyLimits);
  const loading = useSelector(selectCommissionLoading);

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");

  // Función para cargar todos los límites de vendedores
  const loadAllVendorsLimits = async () => {
    try {
      await dispatch(fetchAllVendorsMonthlyLimits()).unwrap();
      toast.success("Límites mensuales cargados correctamente");
    } catch (error) {
      toast.error("Error cargando límites mensuales");
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllVendorsLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    dispatch(clearMonthlyLimits());
    loadAllVendorsLimits();
  };

  // Función para obtener el color y icono del estado
  const getStatusInfo = (status) => {
    switch (status) {
      case "safe":
        return {
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: faCheckCircle,
          label: "Seguro",
        };
      case "warning":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          icon: faExclamationTriangle,
          label: "Advertencia",
        };
      case "critical":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: faExclamationTriangle,
          label: "Crítico",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: faInfoCircle,
          label: "Desconocido",
        };
    }
  };

  // Filtrar vendedores por término de búsqueda
  const filteredLimits = monthlyLimits.filter((vendor) =>
    vendor.vendedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );  // Formato de moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FontAwesomeIcon 
                  icon={faMoneyBillWave} 
                  className="h-6 w-6 text-blue-600" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Límites Mensuales de Comisiones
                </h1>
                <p className="text-gray-600">
                  Seguimiento mensual del límite de $1,300,000 COP por vendedor
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FontAwesomeIcon 
                icon={loading ? faSpinner : faSync} 
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" 
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre del vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        {monthlyLimits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendedores Seguros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlyLimits.filter(v => v.status === 'safe').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En Advertencia</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlyLimits.filter(v => v.status === 'warning').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Críticos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {monthlyLimits.filter(v => v.status === 'critical').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de vendedores */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Vendedores y Límites Mensuales ({filteredLimits.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando límites mensuales...</span>
            </div>
          ) : filteredLimits.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faUser} className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No se encontraron vendedores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mes Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagado este Mes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Límite Restante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLimits.map((vendor) => {
                    const statusInfo = getStatusInfo(vendor.status);
                    const percentage = vendor.porcentaje_usado || 0;
                    
                    return (
                      <tr key={vendor.vendedor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {vendor.vendedor.nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {vendor.vendedor.id} | Rol: {vendor.vendedor.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">2025-09</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(vendor.total_pagado)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(vendor.disponible)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <FontAwesomeIcon icon={statusInfo.icon} className="mr-1 h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                vendor.status === 'safe' ? 'bg-green-600' :
                                vendor.status === 'warning' ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {percentage.toFixed(1)}% del límite
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyLimitsManager;

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoice, 
  faCalendarCheck,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';

const FacturasPendientes = () => {
  const [contractsPendientes, setContractsPendientes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'invoices'
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Para ver detalles

  // ✅ FUNCIÓN PARA CARGAR TODOS LOS DATOS
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadContractsPendientes(),
        loadInvoices()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CARGAR DATOS AL MONTAR COMPONENTE
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ CARGAR CONTRATOS PENDIENTES DE FACTURAR
  const loadContractsPendientes = async () => {
    try {
      const response = await api.get('/invoices/pending');
      if (response.data.success) {
        setContractsPendientes(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando contratos pendientes:', error);
    }
  };

  // ✅ CARGAR FACTURAS EXISTENTES
  const loadInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
    }
  };

  // ✅ VER DETALLES DE FACTURA
  const viewInvoiceDetails = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando detalles de factura:', error);
      alert('Error al cargar los detalles de la factura');
    }
  };

  // ✅ CERRAR MODAL DE DETALLES
  const closeInvoiceDetails = () => {
    setSelectedInvoice(null);
  };

  // ✅ GENERAR FACTURA PARA UN CONTRATO
  const generateInvoice = async (contractId) => {
    if (!window.confirm('¿Estás seguro de generar la factura para este contrato?')) {
      return;
    }

    setGeneratingInvoice(contractId);
    try {
      const response = await api.post(`/invoices/generate/${contractId}`);
      
      if (response.data.success) {
        // Recargar datos
        await loadData();
        alert('Factura generada exitosamente');
      } else {
        alert(response.data.message || 'Error generando la factura');
      }
    } catch (error) {
      console.error('Error generando factura:', error);
      alert('Error al generar la factura');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  // ✅ FORMATEAR MONEDA
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // ✅ FORMATEAR FECHA
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ✅ OBTENER COLOR DE ESTADO
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'approved': 'text-green-600 bg-green-100',
      'rejected': 'text-red-600 bg-red-100',
      'paid': 'text-blue-600 bg-blue-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  // ✅ OBTENER TEXTO DE ESTADO
  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'paid': 'Pagada'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Cargando facturas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ========== HEADER ========== */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          <FontAwesomeIcon icon={faFileInvoice} className="mr-3 text-blue-600" />
          Gestión de Facturas
        </h1>
        <p className="text-gray-600">
          Administra las facturas de los contratos completados
        </p>
      </div>

      {/* ========== TABS ========== */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon icon={faClock} className="mr-2" />
            Pendientes ({contractsPendientes.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'invoices'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
            Facturas ({invoices.length})
          </button>
        </div>
      </div>

      {/* ========== CONTENIDO DE TABS ========== */}
      {activeTab === 'pending' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Contratos Pendientes de Facturar
          </h2>
          
          {contractsPendientes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-6xl text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                ¡Todo al día!
              </h3>
              <p className="text-gray-600">
                No hay contratos pendientes de facturar
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contractsPendientes.map((contract) => (
                <div key={contract.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="grid md:grid-cols-4 gap-4 items-center">
                    
                    {/* Info del Contrato */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        Contrato #{contract.contract_number}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Cliente: {contract.Quote?.Cliente?.name} {contract.Quote?.Cliente?.lastname}
                      </p>
                      <p className="text-sm text-gray-600">
                        Teléfono: {contract.Quote?.Cliente?.phone}
                      </p>
                    </div>

                    {/* Fechas del Viaje */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                        Inicio: {formatDate(contract.fecha_inicio_viaje)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Fin: {formatDate(contract.fecha_fin_viaje)}
                      </p>
                    </div>

                    {/* Valor Total */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valor Total:</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(contract.Quote?.Calculation?.precio_final_total || 0)}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => generateInvoice(contract.id)}
                        disabled={generatingInvoice === contract.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {generatingInvoice === contract.id ? (
                          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        ) : (
                          <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                        )}
                        {generatingInvoice === contract.id ? 'Generando...' : 'Generar Factura'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Facturas Generadas
          </h2>
          
          {invoices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FontAwesomeIcon icon={faFileInvoice} className="text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Sin facturas aún
              </h3>
              <p className="text-gray-600">
                No se han generado facturas todavía
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    
                    {/* Info de la Factura */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        Factura #{invoice.numero_factura}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Contrato #{invoice.contract_id}
                      </p>
                    </div>

                    {/* Cliente */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cliente:</p>
                      <p className="font-medium">
                        {invoice.cliente_nombre}
                      </p>
                    </div>

                    {/* Fecha */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fecha:</p>
                      <p className="font-medium">
                        {formatDate(invoice.fecha_factura)}
                      </p>
                    </div>

                    {/* Estado */}
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewInvoiceDetails(invoice.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Ver Detalles
                      </button>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Total:</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(invoice.monto_total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ========== MODAL DE DETALLES DE FACTURA ========== */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  <FontAwesomeIcon icon={faFileInvoice} className="mr-3" />
                  Factura #{selectedInvoice.numero_factura}
                </h2>
                <button
                  onClick={closeInvoiceDetails}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Info de la Factura */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Información de Factura</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Número:</span> {selectedInvoice.numero_factura}</p>
                    <p><span className="font-medium">Fecha:</span> {formatDate(selectedInvoice.fecha_factura)}</p>
                    <p><span className="font-medium">Vencimiento:</span> {formatDate(selectedInvoice.fecha_vencimiento)}</p>
                    <p><span className="font-medium">Estado:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                        {getStatusText(selectedInvoice.status)}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cliente</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nombre:</span> {selectedInvoice.cliente_nombre}</p>
                    <p><span className="font-medium">Documento:</span> {selectedInvoice.cliente_documento}</p>
                    <p><span className="font-medium">Email:</span> {selectedInvoice.cliente_email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedInvoice.cliente_telefono}</p>
                  </div>
                </div>
              </div>
              
              {/* Desglose de Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Desglose de Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cantidad</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Valor Unit.</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items_detallados?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.descripcion}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.valor_unitario)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.valor_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Resumen de Totales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Compras/Servicios</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(selectedInvoice.monto_compras)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Comisiones</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {formatCurrency(selectedInvoice.monto_comisiones)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Ganancia</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedInvoice.monto_ganancia)}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 mt-4 pt-4 text-center">
                  <p className="text-sm text-gray-600">Total Factura</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.monto_total)}
                  </p>
                </div>
              </div>
              
              {/* Observaciones */}
              {selectedInvoice.observaciones && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Observaciones</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedInvoice.observaciones}
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer del Modal */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={closeInvoiceDetails}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturasPendientes;
// Ejemplo de integración de tooltips en ContractPurchaseManager
import { ContextualTooltip } from '../../hooks/useContextualTooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart, faPlane, faHotel, faCar, faGift,
  faUpload, faCalendarAlt, faCreditCard, faList,
  faClock, faShieldAlt, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

// Ejemplo de cómo integrar los tooltips en el componente real
const ContractPurchaseManagerExample = () => {
  return (
    <div className="p-6">
      {/* Header con tooltip explicativo */}
      <div className="mb-6">
        <ContextualTooltip
          tooltipId="contract-purchase-manager-btn"
          placement="bottom"
        >
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faShoppingCart} className="text-blue-600" />
            Gestor de Compras del Contrato
          </h1>
        </ContextualTooltip>
      </div>

      {/* Dashboard de prioridades */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Tickets - Prioridad Máxima */}
        <ContextualTooltip
          tooltipId="priority-filter-tickets"
          placement="top"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors">
            <FontAwesomeIcon icon={faPlane} className="text-red-600 text-2xl mb-2" />
            <h3 className="font-semibold text-red-800">Tickets Aéreos</h3>
            <p className="text-red-600 text-sm">PRIORIDAD MÁXIMA</p>
            <p className="text-xs text-red-500">3 críticos, 2 vencidos</p>
          </div>
        </ContextualTooltip>

        {/* Alojamiento */}
        <ContextualTooltip
          tooltipId="priority-filter-accommodation"
          placement="top"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
            <FontAwesomeIcon icon={faHotel} className="text-blue-600 text-2xl mb-2" />
            <h3 className="font-semibold text-blue-800">Alojamiento</h3>
            <p className="text-blue-600 text-sm">ALTA PRIORIDAD</p>
            <p className="text-xs text-blue-500">5 pendientes</p>
          </div>
        </ContextualTooltip>

        {/* Traslados */}
        <ContextualTooltip
          tooltipId="priority-filter-transport"
          placement="top"
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
            <FontAwesomeIcon icon={faCar} className="text-green-600 text-2xl mb-2" />
            <h3 className="font-semibold text-green-800">Traslados</h3>
            <p className="text-green-600 text-sm">PRIORIDAD MEDIA</p>
            <p className="text-xs text-green-500">2 pendientes</p>
          </div>
        </ContextualTooltip>

        {/* Otros */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <FontAwesomeIcon icon={faGift} className="text-gray-600 text-2xl mb-2" />
          <h3 className="font-semibold text-gray-800">Otros</h3>
          <p className="text-gray-600 text-sm">PRIORIDAD BAJA</p>
          <p className="text-xs text-gray-500">1 pendiente</p>
        </div>
      </div>

      {/* Lista de Items con Acciones */}
      <div className="space-y-4">
        {/* Item de Ticket Crítico */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faPlane} className="text-red-600" />
                <h3 className="font-semibold text-red-800">Tickets Aéreos BOG-MAD</h3>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">CRÍTICO</span>
              </div>
              <p className="text-sm text-red-600 mb-2">Vence en 8 horas - Acción requerida urgente</p>
              <p className="text-xs text-gray-600">Precio cotizado: $2,450,000 COP</p>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Botón Subir Comprobante */}
              <ContextualTooltip
                tooltipId="subir-comprobante-btn"
                placement="left"
              >
                <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faUpload} />
                  Subir Comprobante
                </button>
              </ContextualTooltip>

              {/* Botón Actualizar Fecha */}
              <ContextualTooltip
                tooltipId="actualizar-fecha-limite-btn"
                placement="left"
              >
                <button className="bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Actualizar Fecha
                </button>
              </ContextualTooltip>
            </div>
          </div>
        </div>

        {/* Item de Alojamiento con Sistema de Cuotas */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faHotel} className="text-blue-600" />
                <h3 className="font-semibold text-blue-800">Hotel Boutique Madrid - 7 noches</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">ALTO VALOR</span>
              </div>
              <p className="text-sm text-blue-600 mb-2">Precio cotizado: $4,200,000 COP</p>
              <p className="text-xs text-gray-600">Recomendado: Sistema de cuotas</p>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Botón Pagar en Cuotas */}
              <ContextualTooltip
                tooltipId="pagar-en-cuotas-btn"
                placement="left"
              >
                <button className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faCreditCard} />
                  Pagar en Cuotas
                </button>
              </ContextualTooltip>

              {/* Botón Subir Comprobante */}
              <ContextualTooltip
                tooltipId="subir-comprobante-btn"
                placement="left"
              >
                <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faUpload} />
                  Subir Comprobante
                </button>
              </ContextualTooltip>
            </div>
          </div>
        </div>

        {/* Item con Cuotas Activas */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faCar} className="text-green-600" />
                <h3 className="font-semibold text-green-800">Traslados Privados - Todo el viaje</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">CON CUOTAS</span>
              </div>
              <p className="text-sm text-green-600 mb-2">Sistema de cuotas activo: 3 de 6 pagadas</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>💰 Total: $1,800,000 | Pagado: $900,000 | Pendiente: $900,000</p>
                <p>⚠️ Próxima cuota: $300,000 - Vence 15 Nov 2025</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {/* Botón Ver Cuotas */}
              <ContextualTooltip
                tooltipId="ver-cuotas-btn"
                placement="left"
              >
                <button className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faList} />
                  Ver Cuotas
                </button>
              </ContextualTooltip>

              {/* Estado de Alerta para Cuota */}
              <ContextualTooltip
                tooltipId="installment-due-soon"
                placement="left"
              >
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} />
                  Cuota vence pronto
                </div>
              </ContextualTooltip>
            </div>
          </div>
        </div>

        {/* Item Completado */}
        <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faShieldAlt} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Seguro de Viaje Integral</h3>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">COMPLETADO</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Comprado y pagado exitosamente</p>
              <p className="text-xs text-gray-500">Proveedor: AXA Seguros | Pagado: $180,000</p>
            </div>
            
            <div className="flex items-center text-green-600">
              <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer con Estadísticas */}
      <div className="mt-6 bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Resumen del Contrato</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">11</p>
            <p className="text-gray-600">Items Totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">3</p>
            <p className="text-gray-600">Completados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">5</p>
            <p className="text-gray-600">En Proceso</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">3</p>
            <p className="text-gray-600">Críticos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPurchaseManagerExample;
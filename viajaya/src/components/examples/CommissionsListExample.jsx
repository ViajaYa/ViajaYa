// Ejemplo de cómo integrar el sistema de ayuda en CommissionsList.jsx
import { ContextualTooltip } from '../../hooks/useContextualTooltip';

// En el render del componente, envolver botones críticos:

{/* Botón Aprobar Comisión con tooltip contextual */}
{canApprove(commission) && (
  <ContextualTooltip
    tooltipId="aprobar-comision-btn"
    placement="top"
  >
    <button
      onClick={() => handleApproveCommission(commission.id)}
      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
      title="Aprobar comisión"
    >
      <FontAwesomeIcon icon={faCheckCircle} size="sm" />
    </button>
  </ContextualTooltip>
)}

{/* Botón Pagar Comisión con tooltip contextual */}
{canPay(commission) && (
  <ContextualTooltip
    tooltipId="pagar-comision-btn"
    placement="top"
  >
    <button
      onClick={() => handlePayCommission(commission)}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
      title="Marcar como pagada"
    >
      <FontAwesomeIcon icon={faCreditCard} size="sm" />
    </button>
  </ContextualTooltip>
)}

{/* Botón Nueva Comisión Manual (solo para roles altos) */}
{(user?.role >= 5) && (
  <ContextualTooltip
    tooltipId="nueva-comision-manual-btn" 
    placement="bottom"
  >
    <button
      onClick={() => setShowCreateCommission(true)}
      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
    >
      <FontAwesomeIcon icon={faPlus} />
      Comisión Manual
    </button>
  </ContextualTooltip>
)}
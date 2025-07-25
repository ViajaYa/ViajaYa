import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBar from "../../layout/NavBar/NavBar";
import {
  faArrowLeft,
  faCoins,
  faUser,
  faCalendarAlt,
  faDollarSign,
  faSpinner,
  faEye,
  faDownload,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faFileAlt,
  faInfoCircle,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchCommissionsByContract,
  selectCommissionsByContract,
  selectCommissionLoading,
} from "../../../redux/slices/commissionSlice";
import { fetchContractById } from "../../../redux/slices/contractSlice";
import api from "../../../utils/api";

const ContractCommissions = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const commissions = useSelector(selectCommissionsByContract);
  const loading = useSelector(selectCommissionLoading);
  
  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);

  useEffect(() => {
    if (contractId) {
      // Cargar datos del contrato
      loadContractData();
      // Cargar comisiones del contrato
      dispatch(fetchCommissionsByContract(contractId));
    }
  }, [contractId, dispatch]);

  const loadContractData = async () => {
    try {
      const response = await api.get(`/contracts/${contractId}`);
      if (response.data.success) {
        setContract(response.data.contract);
      }
    } catch (error) {
      console.error("Error al cargar contrato:", error);
    } finally {
      setContractLoading(false);
    }
  };

  // Función para obtener el color del estado de comisión
  const getCommissionStatusColor = (status) => {
    switch (status) {
      case "generated":
        return "bg-blue-100 text-blue-800";
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "paid":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el icono del estado de comisión
  const getCommissionStatusIcon = (status) => {
    switch (status) {
      case "generated":
        return faInfoCircle;
      case "requested":
        return faClock;
      case "approved":
        return faCheckCircle;
      case "paid":
        return faCheckCircle;
      case "rejected":
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case "generated":
        return "Generada";
      case "requested":
        return "Solicitada";
      case "approved":
        return "Aprobada";
      case "paid":
        return "Pagada";
      case "rejected":
        return "Rechazada";
      default:
        return status;
    }
  };


  const handlePreviewDocument = (documentId) => {
    const token = localStorage.getItem('token');
    const previewUrl = `${import.meta.env.VITE_API_URL}/commissions/document/${documentId}/preview?token=${token}`;
    window.open(previewUrl, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
  };

  // Calcular estadísticas de comisiones
  const getCommissionStats = () => {
    if (!commissions || commissions.length === 0) {
      return {
        total: 0,
        totalAmount: 0,
        generated: 0,
        requested: 0,
        approved: 0,
        paid: 0,
      };
    }

    return commissions.reduce(
      (stats, commission) => {
        stats.total += 1;
        stats.totalAmount += parseFloat(commission.monto_comision || 0);
        stats[commission.status] = (stats[commission.status] || 0) + 1;
        return stats;
      },
      {
        total: 0,
        totalAmount: 0,
        generated: 0,
        requested: 0,
        approved: 0,
        paid: 0,
      }
    );
  };

  const stats = getCommissionStats();

  if (loading || contractLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="2x"
          className="text-blue-500"
        />
        <span className="ml-3 text-lg">Cargando comisiones del contrato...</span>
      </div>
    );
  }

  return (
      <div className="mb-64 pt-20 p-8"> {/* Agregado pt-20 para el margen superior */}
      <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/contractsList")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>
          <div className="h-6 border-l border-gray-300"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Comisiones del Contrato
            </h1>
            {contract && (
              <p className="text-gray-600 mt-1">
                {contract.contract_number} - {contract.clienteName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Información del contrato */}
      {contract && (
        <div className=" rounded-lg shadow-md p-6 mb-6 bg-slate-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Contrato
          </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Cliente</label>
              <p className="text-gray-900">
                {/* Intentar primero desde Quote, luego desde Cliente directo */}
                {contract.Quote?.nombre_cliente || 
                 `${contract.Cliente?.name} ${contract.Cliente?.lastname}` || 
                 'No especificado'}
              </p>
              {/* Email del cliente */}
              {(contract.Quote?.email_cliente || contract.Cliente?.email) && (
                <p className="text-sm text-gray-500">
                  {contract.Quote?.email_cliente || contract.Cliente?.email}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Destino</label>
              <p className="text-gray-900">
                {contract.Quote?.destino || 'No especificado'}
              </p>
              {contract.Quote?.origen && (
                <p className="text-sm text-gray-500">
                  Desde: {contract.Quote?.origen}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Valor Total</label>
              <p className="text-gray-900 font-semibold">
                ${parseFloat(contract.precio_total || 0).toLocaleString('es-CO')}
              </p>
            </div>
             <div>
              <label className="text-sm font-medium text-gray-600">Asesor</label>
              <p className="text-gray-900">
                {/* Asesor desde Quote */}
                {contract.Quote?.Asesor ? 
                  `${contract.Quote.Asesor.name} ${contract.Quote.Asesor.lastname}` : 
                  'No asignado'
                }
              </p>
              {contract.Quote?.Asesor?.email && (
                <p className="text-sm text-gray-500">{contract.Quote.Asesor.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Estado</label>
              <p className="text-gray-900 capitalize">{contract.status}</p>
            </div>
           <div>
              <label className="text-sm font-medium text-gray-600">Fecha Creación</label>
              <p className="text-gray-900">
                {contract.created_at ? 
                  new Date(contract.created_at).toLocaleDateString("es-CO") : 
                  'No disponible'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de comisiones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Comisiones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FontAwesomeIcon icon={faCoins} className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <FontAwesomeIcon icon={faDollarSign} className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {(stats.approved || 0) + (stats.paid || 0)}
              </p>
            </div>
            <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagadas</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.paid || 0}</p>
            </div>
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Lista de comisiones */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {!commissions || commissions.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon
              icon={faCoins}
              className="text-gray-300 text-4xl mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay comisiones generadas
            </h3>
            <p className="text-gray-600">
              Este contrato aún no tiene comisiones generadas.
            </p>
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Empleado</div>
                <div className="col-span-2">Rol</div>
                <div className="col-span-2">Monto</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">Fecha Generación</div>
                <div className="col-span-1">Acciones</div>
              </div>
            </div>

            {/* Filas de comisiones */}
            <div className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Empleado */}
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-400 mr-2"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {commission.Vendedor?.name} {commission.Vendedor?.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.Vendedor?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rol */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {commission.tipo_vendedor}
                      </span>
                    </div>

                    {/* Monto */}
                    <div className="col-span-2">
                      <div className="font-medium text-gray-900">
                        ${parseFloat(commission.monto_comision).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {commission.porcentaje}%
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCommissionStatusColor(
                          commission.status
                        )}`}
                      >
                        <FontAwesomeIcon
                          icon={getCommissionStatusIcon(commission.status)}
                          className="mr-1"
                        />
                        {getStatusText(commission.status)}
                      </span>
                    </div>

                    {/* Fecha generación */}
                    <div className="col-span-2">
                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="text-gray-400 mr-2"
                        />
                        <div className="text-gray-900">
                          {new Date(commission.created_at).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        
                        {/* Vista previa del documento si existe */}
                        {commission.DocumentoSoporte && (
                          <button
                            onClick={() => handlePreviewDocument(commission.DocumentoSoporte.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Vista previa del documento"
                          >
                            <FontAwesomeIcon icon={faFilePdf} size="sm" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información adicional si hay observaciones */}
                  {commission.observaciones && (
                    <div className="mt-2 pl-4 border-l-2 border-blue-200">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Observaciones:</span>{" "}
                        {commission.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContractCommissions;

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchBankingData, selectBankingData } from "../../../redux/slices/userSlice";
import {
  faTimes,
  faBank,
  faFileInvoice,
  faSpinner,
  faUser,
  faPhone,
  faIdCard
} from "@fortawesome/free-solid-svg-icons";
import { selectDocumentationStatus } from "../../../redux/slices/documentSlice";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";

const PaymentRequestModal = ({ commission, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const bankingData = useSelector(selectBankingData);
  const documentationStatus = useSelector(selectDocumentationStatus);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: 'ahorros',
    nombre_titular: '',          // ✅ Campo requerido
    documento_titular: '',       // ✅ Campo requerido  
    telefono: '',
    observaciones: ''
  });

  const firmaDigital = documentationStatus?.documents?.find(
    doc => doc.document_name === "Firma Digital" && doc.status === "approved"
  );

  useEffect(() => {
    console.log("Firma Digital encontrada:", firmaDigital);
  }, [firmaDigital]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBankingData(user.id));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (bankingData) {
      setFormData(prev => ({
        ...prev,
        ...bankingData
      }));
    }
  }, [bankingData]);

  const bancos = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA Colombia',
    'Banco Popular',
    'Banco de Occidente',
    'Banco AV Villas',
    'Banco Caja Social',
    'Banco Agrario',
    'Nequi',
    'Daviplata',
    'Otro'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ✅ Debug logs
    console.log('🔍 Datos a enviar:', {
      commissionId: commission.id,
      paymentData: formData,
      firma_digital_url: firmaDigital?.file_url || null // <-- Agrega esto al log
    });

    const response = await api.post('/commissions/request-payment', {
      commissionId: commission.id,
      paymentData: formData,
      firma_digital_url: firmaDigital?.file_url || null // <-- Agrega esto al payload
    });

    console.log('✅ Respuesta del servidor:', response.data);

    if (response.data.success) {
      toast.success('Solicitud de pago enviada exitosamente');
      onSuccess();
    }
  } catch (error) {
    console.error('❌ Error requesting payment:', error);
    console.error('❌ Error response:', error.response?.data);
    toast.error(error.response?.data?.message || 'Error al enviar solicitud');
  } finally {
    setLoading(false);
  }
};


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Solicitar Pago de Comisión</h2>
            <p className="text-sm text-gray-600">
              Contrato: {commission?.Contract?.contract_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Commission Details */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="font-medium capitalize">{commission?.tipo_vendedor}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Base</p>
              <p className="font-medium">{formatCurrency(commission?.monto_base)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">% Comisión</p>
              <p className="font-medium">{commission?.porcentaje}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Comisión</p>
              <p className="font-bold text-green-600">{formatCurrency(commission?.monto_comision)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos Bancarios */}
          <div>
            <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faBank} className="mr-2" />
              Datos Bancarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco *
                </label>
                <select
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar banco</option>
                  {bancos.map(banco => (
                    <option key={banco} value={banco}>{banco}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta *
                </label>
                <select
                  name="tipo_cuenta"
                  value={formData.tipo_cuenta}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuenta *
                </label>
                <input
                  type="text"
                  name="numero_cuenta"
                  value={formData.numero_cuenta}
                  onChange={handleInputChange}
                  required
                  placeholder="Ingresa el número de cuenta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Datos del Titular */}
          <div>
            <h3 className="flex items-center text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Datos del Titular
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre_titular"
                  value={formData.nombre_titular}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre completo del titular de la cuenta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  name="documento_titular"
                  value={formData.documento_titular}
                  onChange={handleInputChange}
                  required
                  placeholder="Cédula de ciudadanía"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Número de celular"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {firmaDigital && firmaDigital.file_url && (
                <div className="my-4 flex justify-end">
                  <img
                    src={firmaDigital.file_url}
                    alt="Firma Digital"
                    style={{ width: 120, height: 60, objectFit: "contain", border: "1px solid #eee" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={3}
              placeholder="Observaciones adicionales (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentRequestModal;
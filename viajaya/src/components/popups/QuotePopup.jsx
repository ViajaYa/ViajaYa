import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createQuote } from '../../redux/slices/quoteSlice';

const QuotePopup = ({ onClose, prefilledData = {} }) => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const user = auth.user;
  const isAuthenticated = auth.isAuthenticated;

  const [form, setForm] = useState({
    nombre_cliente: prefilledData.nombre_cliente || '',
    email_cliente: prefilledData.email_cliente || '',
    telefono_cliente: prefilledData.telefono_cliente || '',
    destino: prefilledData.destino || '',
    origen: prefilledData.origen || '',
    fecha_ida: prefilledData.fecha_ida || '',
    fecha_regreso: prefilledData.fecha_regreso || '',
    numero_personas: prefilledData.numero_personas || 1,
    acomodacion: prefilledData.acomodacion || '',
    tipo_hotel: prefilledData.tipo_hotel || '',
    ninos: prefilledData.ninos || 0,
    edades_ninos: prefilledData.edades_ninos || '',
    observaciones: prefilledData.observaciones || '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const getRolePayload = (user) => {
      if (!user) return {};
      switch (user.role) {
        case 2: return { asesor_id: user.id };
        case 3: return { lider_id: user.id };
        case 4: return { gerente_id: user.id };
        case 7: return {}; // Admin
        default: return { cliente_id: user.id };
      }
    };

    const payload = {
      ...form,
      ...(isAuthenticated && user ? getRolePayload(user) : {}),
    };

    await dispatch(createQuote(payload));
    if (onClose) onClose();
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Solicitar Cotización</h2>

       
          <>
            <input
              type="text"
              name="nombre_cliente"
              placeholder="Nombre completo"
              value={form.nombre_cliente}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
            <input
              type="email"
              name="email_cliente"
              placeholder="Correo electrónico"
              value={form.email_cliente}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
            <input
              type="text"
              name="telefono_cliente"
              placeholder="Teléfono"
              value={form.telefono_cliente}
              onChange={handleChange}
              required
              className="input input-bordered w-full"
            />
          </>
     

        <input
          type="text"
          name="destino"
          placeholder="Destino"
          value={form.destino}
          onChange={handleChange}
          required
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="origen"
          placeholder="Origen"
          value={form.origen}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <div className="flex gap-2">
          <input
            type="date"
            name="fecha_ida"
            placeholder="Fecha de ida"
            value={form.fecha_ida}
            onChange={handleChange}
            required
            className="input input-bordered w-full"
          />
          <input
            type="date"
            name="fecha_regreso"
            placeholder="Fecha de regreso"
            value={form.fecha_regreso}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            name="numero_personas"
            placeholder="Número de personas"
            value={form.numero_personas}
            onChange={handleChange}
            min={1}
            required
            className="input input-bordered w-full"
          />
          <input
            type="number"
            name="ninos"
            placeholder="Niños"
            value={form.ninos}
            onChange={handleChange}
            min={0}
            className="input input-bordered w-full"
          />
        </div>
        <input
          type="text"
          name="acomodacion"
          placeholder="Acomodación"
          value={form.acomodacion}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="tipo_hotel"
          placeholder="Tipo de hotel"
          value={form.tipo_hotel}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="edades_ninos"
          placeholder="Edades de los niños (separadas por coma)"
          value={form.edades_ninos}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <textarea
          name="observaciones"
          placeholder="Observaciones"
          value={form.observaciones}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />

        {isAuthenticated && user && user.role >= 2 && (
          <input
            type="text"
            value={`${user.name || ''} ${user.lastname || ''}`}
            readOnly
            disabled
            className="input input-bordered w-full bg-gray-100 font-bold"
            title="Usuario que crea la cotización"
          />
        )}

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="btn btn-primary w-1/2 mr-2"
          >
            Enviar cotización
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary w-1/2 ml-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotePopup;
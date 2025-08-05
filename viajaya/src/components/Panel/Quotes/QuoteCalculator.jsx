
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuoteCalculation } from '../../../redux/slices/quoteCalculationSlice';
import { selectUser } from '../../../redux/slices/authSlice';


const QuoteCalculator = ({ onContinue, quote_id }) => {
  const dispatch = useDispatch();
  const { loading, error, calculation } = useSelector(state => state.quoteCalculation || {});
  const user = useSelector(selectUser);

  const [form, setForm] = useState({
    proveedor: '',
    items: [{ nombre: '', costo: 0, proveedor: '' }],
    margen: 0,
    num_personas: 1,
  });

  const handleItemChange = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { nombre: '', costo: 0, proveedor: '' }] });
  };

  const removeItem = (idx) => {
    const newItems = form.items.filter((_, i) => i !== idx);
    setForm({ ...form, items: newItems });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calcularCostoTotal = () => {
    return form.items.reduce((acc, item) => acc + Number(item.costo || 0), 0);
  };

  const calcularPrecioSugerido = () => {
    const costo = calcularCostoTotal();
    const margen = Number(form.margen || 0);
    return costo + (costo * margen / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      costo_total: calcularCostoTotal(),
      precio_sugerido: calcularPrecioSugerido(),
      items: form.items,
      estado: 'temporal',
      user_id: user?.id || null,
      quote_id: quote_id || null,
    };
    const res = await dispatch(createQuoteCalculation(data));
    if (res.meta.requestStatus === 'fulfilled' && onContinue) {
      onContinue(res.payload); // Puedes pasar el cálculo al siguiente paso
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Calculadora de Costos</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label>Proveedor principal:</label>
          <input
            type="text"
            name="proveedor"
            value={form.proveedor}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label>Ítems / Servicios:</label>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Nombre"
                value={item.nombre}
                onChange={e => handleItemChange(idx, 'nombre', e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <input
                type="number"
                placeholder="Costo"
                value={item.costo}
                onChange={e => handleItemChange(idx, 'costo', e.target.value)}
                className="border p-2 rounded w-24"
              />
              <input
                type="text"
                placeholder="Proveedor"
                value={item.proveedor}
                onChange={e => handleItemChange(idx, 'proveedor', e.target.value)}
                className="border p-2 rounded flex-1"
              />
              <button type="button" onClick={() => removeItem(idx)} className="text-red-500">X</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-blue-500 mt-2">+ Agregar ítem</button>
        </div>
        <div className="mb-4">
          <label>Margen de ganancia (%):</label>
          <input
            type="number"
            name="margen"
            value={form.margen}
            onChange={handleChange}
            className="w-24 border p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label>Número de personas:</label>
          <input
            type="number"
            name="num_personas"
            value={form.num_personas}
            min={1}
            onChange={handleChange}
            className="w-24 border p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <strong>Costo total:</strong> ${calcularCostoTotal().toLocaleString()}
        </div>
        <div className="mb-4">
          <strong>Precio sugerido total:</strong> ${calcularPrecioSugerido().toLocaleString()}
        </div>
        <div className="mb-4">
          <strong>Precio por persona:</strong> ${(calcularPrecioSugerido() / (form.num_personas || 1)).toLocaleString()}
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  );
};

export default QuoteCalculator;
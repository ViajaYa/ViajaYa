
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
    // ✅ ACTUALIZADO: Nueva estructura de pasajeros
    num_personas: 1,
    adultos: 1,
    menores: 0,
    infantes: 0,
    edades_menores: [],
    edades_infantes: [],
    personas_atencion_especial: 0,
    // ✅ NUEVO: Campos para excursiones y extras
    excursiones: [],
    extras: [],
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

  // ✅ NUEVO: Funciones para manejar excursiones
  const addExcursion = () => {
    setForm({ 
      ...form, 
      excursiones: [...form.excursiones, { nombre: '', descripcion: '', costo: 0, proveedor: '' }] 
    });
  };

  const removeExcursion = (idx) => {
    const newExcursiones = form.excursiones.filter((_, i) => i !== idx);
    setForm({ ...form, excursiones: newExcursiones });
  };

  const handleExcursionChange = (idx, field, value) => {
    const newExcursiones = [...form.excursiones];
    newExcursiones[idx][field] = value;
    setForm({ ...form, excursiones: newExcursiones });
  };

  // ✅ NUEVO: Funciones para manejar extras
  const addExtra = () => {
    setForm({ 
      ...form, 
      extras: [...form.extras, { nombre: '', descripcion: '', costo: 0, proveedor: '' }] 
    });
  };

  const removeExtra = (idx) => {
    const newExtras = form.extras.filter((_, i) => i !== idx);
    setForm({ ...form, extras: newExtras });
  };

  const handleExtraChange = (idx, field, value) => {
    const newExtras = [...form.extras];
    newExtras[idx][field] = value;
    setForm({ ...form, extras: newExtras });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ NUEVA FUNCIÓN: Calcular personas que realmente pagan (excluyendo infantes)
  const calcularPersonasQuePagan = () => {
    const adultos = parseInt(form.adultos) || 0;
    const menores = parseInt(form.menores) || 0;
    // Los infantes (<2 años) NO pagan
    return adultos + menores;
  };

  // ✅ NUEVA FUNCIÓN: Actualizar total de personas automáticamente
  const updateTotalPersonas = () => {
    const total = (parseInt(form.adultos) || 0) + (parseInt(form.menores) || 0) + (parseInt(form.infantes) || 0);
    setForm(prev => ({ ...prev, num_personas: total }));
  };

  // ✅ NUEVA FUNCIÓN: Manejar cambios en pasajeros
  const handlePassengerChange = (field, value) => {
    const newForm = { ...form, [field]: parseInt(value) || 0 };
    
    // Actualizar total automáticamente
    const total = (newForm.adultos || 0) + (newForm.menores || 0) + (newForm.infantes || 0);
    newForm.num_personas = total;
    
    setForm(newForm);
  };

  const calcularCostoTotal = () => {
    const costoItems = form.items.reduce((acc, item) => acc + Number(item.costo || 0), 0);
    const costoExcursiones = form.excursiones.reduce((acc, exc) => acc + Number(exc.costo || 0), 0);
    const costoExtras = form.extras.reduce((acc, ext) => acc + Number(ext.costo || 0), 0);
    
    const personasQuePagan = calcularPersonasQuePagan();
    
    // Items normales + (excursiones + extras) por persona que paga
    return costoItems + ((costoExcursiones + costoExtras) * personasQuePagan);
  };

  // ✅ ACTUALIZADO: Calcular precio considerando solo personas que pagan
  const calcularPrecioSugerido = () => {
    const costo = calcularCostoTotal();
    const margen = Number(form.margen || 0);
    const precioBase = costo + (costo * margen / 100);
    
    // Nota: El precio total sigue siendo el mismo, pero ahora sabemos
    // que se distribuye entre las personas que pagan (excluyendo infantes)
    return precioBase;
  };

  // ✅ ACTUALIZADO: Calcular precio por persona que paga
  const calcularPrecioPorPersonaQuePaga = () => {
    const precioTotal = calcularPrecioSugerido();
    const personasQuePagan = calcularPersonasQuePagan();
    return personasQuePagan > 0 ? precioTotal / personasQuePagan : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ NUEVO: Combinar excursiones y extras en un solo array de "extras"
    const combinedExtras = [];
    
    // Agregar excursiones como extras
    form.excursiones.forEach(excursion => {
      if (excursion.nombre && excursion.costo > 0) {
        combinedExtras.push({
          nombre: excursion.nombre,
          descripcion: excursion.descripcion || '',
          costo: excursion.costo,
          proveedor: excursion.proveedor || '',
          tipo: 'excursion'
        });
      }
    });
    
    // Agregar extras
    form.extras.forEach(extra => {
      if (extra.nombre && extra.costo > 0) {
        combinedExtras.push({
          nombre: extra.nombre,
          descripcion: extra.descripcion || '',
          costo: extra.costo,
          proveedor: extra.proveedor || '',
          tipo: 'servicio_extra'
        });
      }
    });
    
    console.log("🔄 SIMPLE CALCULATOR: Combinando excursiones y extras:", combinedExtras);
    
    // ✅ ACTUALIZADO: Enviar datos con nueva estructura de pasajeros
    const data = {
      // Datos de pasajeros (nueva estructura)
      adultos: form.adultos,
      menores: form.menores, 
      infantes: form.infantes,
      edades_menores: form.edades_menores,
      edades_infantes: form.edades_infantes,
      personas_atencion_especial: form.personas_atencion_especial,
      num_personas: form.num_personas, // Se calcula automáticamente
      
      // Datos de proveedor y servicios
      proveedor: form.proveedor,
      items: form.items,
      
      // ✅ MODIFICADO: Solo enviar el array combinado como "extras"
      excursiones: [], // ✅ Vaciar excursiones porque van en extras
      extras: combinedExtras, // ✅ Todo va como extras
      
      // Datos de precios y márgenes
      margen_ganancia: Number(form.margen) || 0,
      costo_total: calcularCostoTotal(),
      precio_sugerido: calcularPrecioSugerido(),
      
      // Información adicional calculada
      personas_que_pagan: calcularPersonasQuePagan(),
      precio_por_persona_que_paga: calcularPrecioPorPersonaQuePaga(),
      
      // Metadatos
      estado: 'temporal',
      user_id: user?.id || null,
      quote_id: quote_id || null,
    };
    
    console.log('📊 Enviando datos de cotización:', data);
    
    const res = await dispatch(createQuoteCalculation(data));
    if (res.meta.requestStatus === 'fulfilled' && onContinue) {
      onContinue(res.payload);
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
        
        {/* ✅ NUEVA SECCIÓN: Gestión detallada de pasajeros */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Información de Pasajeros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adultos (14+ años) - Pagan
              </label>
              <input
                type="number"
                min="0"
                value={form.adultos}
                onChange={(e) => handlePassengerChange('adultos', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menores (2-14 años) - Pagan
              </label>
              <input
                type="number"
                min="0"
                value={form.menores}
                onChange={(e) => handlePassengerChange('menores', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Infantes (&lt;2 años) - NO pagan
              </label>
              <input
                type="number"
                min="0"
                value={form.infantes}
                onChange={(e) => handlePassengerChange('infantes', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Resumen de pasajeros */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm">
              <div className="font-medium text-blue-800">
                Total: {form.num_personas} pasajero{form.num_personas !== 1 ? 's' : ''}
              </div>
              <div className="text-blue-600">
                Personas que pagan: {calcularPersonasQuePagan()}
              </div>
              {form.infantes > 0 && (
                <div className="text-gray-600">
                  Infantes (gratis): {form.infantes}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ✅ NUEVA SECCIÓN: Excursiones */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Excursiones</h3>
          {form.excursiones.map((excursion, idx) => (
            <div key={idx} className="mb-3 p-3 bg-white border rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nombre de la excursión"
                  value={excursion.nombre}
                  onChange={e => handleExcursionChange(idx, 'nombre', e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Costo por persona"
                  value={excursion.costo}
                  onChange={e => handleExcursionChange(idx, 'costo', e.target.value)}
                  className="border p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={excursion.descripcion}
                  onChange={e => handleExcursionChange(idx, 'descripcion', e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Proveedor"
                  value={excursion.proveedor}
                  onChange={e => handleExcursionChange(idx, 'proveedor', e.target.value)}
                  className="border p-2 rounded"
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeExcursion(idx)} 
                className="text-red-500 text-sm hover:text-red-700"
              >
                ✕ Eliminar excursión
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addExcursion} 
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Agregar excursión
          </button>
        </div>

        {/* ✅ NUEVA SECCIÓN: Extras */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Servicios Extras</h3>
          {form.extras.map((extra, idx) => (
            <div key={idx} className="mb-3 p-3 bg-white border rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nombre del servicio"
                  value={extra.nombre}
                  onChange={e => handleExtraChange(idx, 'nombre', e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Costo total"
                  value={extra.costo}
                  onChange={e => handleExtraChange(idx, 'costo', e.target.value)}
                  className="border p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={extra.descripcion}
                  onChange={e => handleExtraChange(idx, 'descripcion', e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Proveedor"
                  value={extra.proveedor}
                  onChange={e => handleExtraChange(idx, 'proveedor', e.target.value)}
                  className="border p-2 rounded"
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeExtra(idx)} 
                className="text-red-500 text-sm hover:text-red-700"
              >
                ✕ Eliminar extra
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addExtra} 
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Agregar servicio extra
          </button>
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
        
        {/* ✅ ACTUALIZADO: Mostrar cálculos con nueva lógica */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
          <div className="font-semibold text-gray-800">Resumen de Cálculos:</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Costo items base:</div>
              <div className="font-medium">${form.items.reduce((acc, item) => acc + Number(item.costo || 0), 0).toLocaleString()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Excursiones (por persona):</div>
              <div className="font-medium">${form.excursiones.reduce((acc, exc) => acc + Number(exc.costo || 0), 0).toLocaleString()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Extras (total):</div>
              <div className="font-medium">${form.extras.reduce((acc, ext) => acc + Number(ext.costo || 0), 0).toLocaleString()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Costo total calculado:</div>
              <div className="font-medium">${calcularCostoTotal().toLocaleString()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Precio sugerido total:</div>
              <div className="font-medium">${calcularPrecioSugerido().toLocaleString()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Personas que pagan:</div>
              <div className="font-medium">{calcularPersonasQuePagan()}</div>
            </div>
            
            <div>
              <div className="text-gray-600">Precio por persona que paga:</div>
              <div className="font-medium text-green-600">${calcularPrecioPorPersonaQuePaga().toLocaleString()}</div>
            </div>
          </div>
          
          {/* Precio destacado */}
          <div className="border-t pt-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                Precio Total: ${calcularPrecioSugerido().toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Para {calcularPersonasQuePagan()} persona{calcularPersonasQuePagan() !== 1 ? 's' : ''} que paga{calcularPersonasQuePagan() === 1 ? '' : 'n'}
                {form.infantes > 0 && ` (${form.infantes} infante${form.infantes !== 1 ? 's' : ''} gratis)`}
              </div>
            </div>
          </div>
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
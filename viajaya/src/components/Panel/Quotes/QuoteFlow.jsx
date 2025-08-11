import React, { useState } from 'react';
import QuoteCalculator from './QuoteCalculator';
import QuotePopup from '../popups/QuotePopup';

const QuoteFlow = () => {
  const [calculation, setCalculation] = useState(null);
  const [showQuotePopup, setShowQuotePopup] = useState(false);

  // ✅ MEJORADO: Cuando la calculadora termina
  const handleCalculatorContinue = (calcData) => {
    console.log('🔄 QuoteFlow: Datos recibidos de calculadora:', calcData);
    setCalculation(calcData);
    setShowQuotePopup(true);
  };

  // ✅ MEJORADO: Cuando se cierra el popup
  const handleClosePopup = () => {
    console.log('🔄 QuoteFlow: Cerrando popup de cotización');
    setShowQuotePopup(false);
    setCalculation(null);
  };

  return (
    <>
      {!showQuotePopup && (
        <QuoteCalculator onContinue={handleCalculatorContinue} />
      )}
      {showQuotePopup && (
        <QuotePopup
          isOpen={showQuotePopup}
          onClose={handleClosePopup}
          prefilledData={{
            // ✅ ACTUALIZADO: Datos de proveedor y servicios
            proveedor: calculation?.proveedor,
            items: calculation?.items || [],
            
            // ✅ MODIFICADO: Solo usar extras (que ahora incluye todo)
            extras: calculation?.extras || [], // Ya incluye excursiones, actividades y extras
            
            // ✅ ACTUALIZADO: Nueva estructura de pasajeros
            adultos: calculation?.adultos || 0,
            menores: calculation?.menores || 0,
            infantes: calculation?.infantes || 0,
            edades_menores: calculation?.edades_menores || [],
            edades_infantes: calculation?.edades_infantes || [],
            personas_atencion_especial: calculation?.personas_atencion_especial || 0,
            num_personas: calculation?.num_personas || 0,
            
            // ✅ ACTUALIZADO: Datos de precios y cálculos
            margen_ganancia: calculation?.margen_ganancia || 0,
            costo_total: calculation?.costo_total || 0,
            precio_sugerido: calculation?.precio_sugerido || 0,
            personas_que_pagan: calculation?.personas_que_pagan || 0,
            precio_por_persona_que_paga: calculation?.precio_por_persona_que_paga || 0,
            
            // ✅ ACTUALIZADO: Metadatos
            calculationId: calculation?.id,
            estado: 'borrador', // Empieza como borrador en el popup
          }}
        />
      )}
    </>
  );
};

export default QuoteFlow;
import React, { useState } from 'react';
import QuoteCalculator from './QuoteCalculator';
import QuotePopup from '../popups/QuotePopup';

const QuoteFlow = () => {
  const [calculation, setCalculation] = useState(null);
  const [showQuotePopup, setShowQuotePopup] = useState(false);

  // Cuando la calculadora termina
  const handleCalculatorContinue = (calcData) => {
    setCalculation(calcData);
    setShowQuotePopup(true);
  };

  // Cuando se cierra el popup
  const handleClosePopup = () => {
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
            // Puedes pasar aquí los datos que quieras autocompletar
            proveedor: calculation.proveedor,
            items: calculation.items,
            margen: calculation.margen,
            num_personas: calculation.num_personas,
            costo_total: calculation.costo_total,
            precio_sugerido: calculation.precio_sugerido,
            // ...otros campos si los necesitas
            calculationId: calculation.id, // importante para asociar luego
          }}
        />
      )}
    </>
  );
};

export default QuoteFlow;
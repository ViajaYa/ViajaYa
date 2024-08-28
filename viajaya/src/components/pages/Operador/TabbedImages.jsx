import { useState } from 'react';
import onya from '../../../assets/newImg/viajayaImg/onya.png';
import cuarenta from '../../../assets/newImg/viajayaImg/40mil.png';
import vuelaYa from '../../../assets/newImg/viajayaImg/vuelaya.png';
import combiya from '../../../assets/newImg/viajayaImg/combiYa.png';
import ganaya from '../../../assets/newImg/viajayaImg/ganaya.png';

const TabbedImages = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const getImageAndText = (tab) => {
    switch (tab) {
      case 'tab1':
        return {
          image: combiya,
          text: (
            <>
              <span className="font-bold text-BotonNaranja">Combi YA</span> ¿Qué es?: Aquí encontrarás la oportunidad de conocer múltiples destinos con descuentos. ¿Para quién es?: Viajeros con tiempo ilimitado y el doble de ganas de viajar. ¿Cómo se obtiene?: Con cuota de % inicial y saldo a cuotas mensuales.
            </>
          ),
        };
      case 'tab2':
        return {
          image: onya,
          text: (
            <>
              <span className="font-bold text-BotonAmarillo">ONYA!</span> ¿Qué es?: Convenio con cadena hotelera colombiana con destinos seleccionados. ¿Cómo se obtiene?: 30% de valor y pagando cuotas hasta 24 meses. ¿Para quién es?: Viajeros que no tengan miedo de enamorarse de una nueva región colombiana. ¿Cómo se obtiene?: Desde un 5% del plan elegido y a cuotas.
            </>
          ),
        };
      case 'tab3':
        return {
          image: vuelaYa,
          text: (
            <>
              <span className="font-bold text-ColorAzul">Vuela Ya</span> ¿Qué es?: Adquiere las tasas más bajas de tiquetes a diario. ¿Para quién es?: Viajeros que aceptan horarios nocturnos y baja demanda. ¿Cómo se separa?: Pago 100% clientes con la decisión de volar ya.
            </>
          ),
        };
      case 'tab4':
        return {
          image: cuarenta,
          text: (
            <>
              <span className="font-bold text-BotonMorado">40 Mil Razones para viajar</span> ¿Qué es?: Aparta la promoción vigente con el valor más bajo. ¿Para quién es?: Viajeros con poder de decisión. ¿Cómo se obtiene?: Con 2 billetes de 20 mil pesos y en el momento adecuado.
            </>
          ),
        };
      case 'tab5':
        return {
          image: ganaya,
          text: (
            <>
              <span className="font-bold text-BotonValija">GanaYA y Viajaya</span> (sorteos cada trimestre) ¿Qué es?: Por un precio bajo obtener la oportunidad de ganar un plan completo. ¿Para quién es?: Personas con fe de ganar con sus números preferidos de la suerte. ¿Cómo se obtiene?: Valor por boleta o compra de planes turísticos promocionales.
            </>
          ),
        };
      default:
        return {
          image: cuarenta,
          text: 'Texto explicativo por defecto.',
        };
    }
  };

  const { image, text } = getImageAndText(activeTab);

  return (
    <div className="flex flex-col items-center mt-4  md:p-8 bg-opacity-50 rounded-lg p-10">
      <div className="flex justify-center mb-4 p-2 md:p-4 gap-2 md:gap-6 flex-wrap">
        <button
          className={`px-2 py-1 md:px-4 md:py-2 font-nunito rounded text-sm lg:text-lg ${activeTab === 'tab1' ? 'bg-BotonNaranja text-gray-700' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab1')}
        >
          Combi YA
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg mx-1 md:mx-2 ${activeTab === 'tab2' ? 'bg-BotonAmarillo text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab2')}
        >
          ONYA!
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg mx-1 md:mx-2 ${activeTab === 'tab3' ? 'bg-ColorAzul text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab3')}
        >
          Vuela Ya
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg font-nunito ${activeTab === 'tab4' ? 'bg-BotonMorado text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab4')}
        >
          40 Mil Razones para viajar    
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg mx-1 md:mx-2 ${activeTab === 'tab5' ? 'bg-BotonValija text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab5')}
        >
          GanaYA y Viajaya
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 lg:space-x-8">
        <div className="w-full md:w-1/2 flex justify-center">
          <img src={image} alt="Tab Image" className="w-40 md:w-80 lg:w-96 h-auto rounded-lg border-4" />
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col items-center">
          <p className="text-sm md:text-lg lg:text-2xl font-bold font-nunito text-gray-500 text-center p-2 md:p-4">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TabbedImages;

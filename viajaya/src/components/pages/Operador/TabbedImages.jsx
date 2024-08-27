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
          text: 'Combi YA Que es? aqui encontraras la oportunidad de conocer multiples destinos con descuentos para quien es? : Viajeros con tiempo ilimitado y el doble de ganas de viajar. ¿Cómo se obtiene ? :  Con cuota de %  inicial y saldo a cuotas mensuales.',
        };
      case 'tab2':
        return {
          image: onya,
          text: 'ONYA! Que es ?: convenio con cadena hotelera colombiana con destinos seleccionados Como se obtiene: 30% de valor y pagando cuotas hasta 24 meses !! Para quien es? : Viajeros que no tengan miedo de enamorarse de una nueva region colombiana como se ontiene? : como es nuestro producto estrella desde un 5% del plan elegido y ha cuotas .',
        };
      case 'tab3':
        return {
          image: vuelaYa,
          text: 'Vuela Ya Que es? adquiere la tasas mas bajas de tiquetes a diario para quien es?: viajeros que aceptan horarios nocturnos y baja demanda como se seprara? Pago 100% clientes con la desicion de volar ya .',
        };
      case 'tab4':
        return {
          image: cuarenta,
          text: '40 Mil Razones para viajar  que es?  Apartar la promocion vigente con el valor más bajo para quien es? Viajeros con poder de decisión como se obtiene? Con 2 billetes de 20 mil pesos y en el momento adecuado..',
        };
        case 'tab5':
          return {
            image: ganaya,
            text: 'GanaYA y Viajaya (sorteos  cada trimestre) que es?  por un precio Bajo obtener la oportunidad de ganar un plan completo para quien es ? Personas con Fe de Ganar con sus numeros preferidos de la suerte Como se obtiene? : Valor por boleta o compra de planes turisticos promocionales .',
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
    <div className="flex flex-col items-center mt-4 p-4 md:p-8 bg-opacity-50 bg-ColorMorado rounded-lg">
      <div className="flex justify-center mb-4 p-2 md:p-4 gap-2 md:gap-6 flex-wrap">
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg ${activeTab === 'tab1' ? 'bg-ColorAzul text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab1')}
        >
         Combi YA
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg mx-1 md:mx-2 ${activeTab === 'tab2' ? 'bg-ColorAzul text-gray-900' : 'bg-gray-200 text-gray-600'}`}
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
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg font-nunito ${activeTab === 'tab4' ? 'bg-ColorAzul text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab4')}
        >
          40 Mil Razones para viajar    
        </button>
        <button
          className={`px-2 py-1 md:px-4 md:py-2 rounded text-sm lg:text-lg mx-1 md:mx-2 ${activeTab === 'tab5' ? 'bg-ColorAzul text-gray-900' : 'bg-gray-200 text-gray-600'}`}
          onClick={() => handleTabClick('tab5')}
        >
          GanaYA y Viajaya
        </button>
      </div>
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 lg:space-x-8">
        <div className="w-full md:w-1/2 flex justify-center">
          <img src={image} alt="Tab Image" className="w-40 md:w-80 lg:w-96 h-auto rounded-lg" />
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col items-center">
          <p className="text-sm md:text-lg lg:text-2xl font-bold font-nunito text-gray-700 text-center p-2 md:p-4">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default TabbedImages;
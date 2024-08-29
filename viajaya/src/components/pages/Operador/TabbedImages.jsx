import onya from '../../../assets/newImg/viajayaImg/onya.png';
import cuarenta from '../../../assets/newImg/viajayaImg/40mil.png';
import vuelaYa from '../../../assets/newImg/viajayaImg/vuelaya.png';
import combiya from '../../../assets/newImg/viajayaImg/combiYa.png';
import ganaya from '../../../assets/newImg/viajayaImg/ganaya.png';
import NavBar from '../../layout/NavBar/NavBar';
import standard from '../../../assets/newImg/viajayaImg/standard.png'
import alohaya from '../../../assets/newImg/viajayaImg/alohaya.png'
import yapaya from '../../../assets/newImg/viajayaImg/yapaYaLogo.png'
import viajofacil from '../../../assets/newImg/viajayaImg/viajofacilLogo.png'
import viajollanos from '../../../assets/newImg/viajayaImg/viajallanos.png'
import terrestres from '../../../assets/newImg/viajayaImg/terrestres.png'
import tarjeta from '../../../assets/newImg/viajayaImg/tarjeta.png'
const TabbedImages = () => {
  const items = [
    {
      image: combiya,
      text: (
        <>
          <span className="font-bold text-BotonNaranja">Combi YA</span> <strong>¿Qué es?</strong><br></br>
          Aquí encontrarás la oportunidad de conocer múltiples destinos con descuentos.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros con tiempo ilimitado y el doble de ganas de viajar.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Con cuota de % inicial y saldo a cuotas mensuales.
        </>
      ),
    },
    {
      image: onya,
      text: (
        <>
          <span className="font-bold text-BotonAmarillo">ONYA!</span> <strong>¿Qué es?</strong><br></br>
          Convenio con cadena hotelera colombiana con destinos seleccionados.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros que no tengan miedo de enamorarse de una nueva región colombiana.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Desde un 5% del plan elegido y a cuotas.
        </>
      ),
    },
    {
      image: vuelaYa,
      text: (
        <>
          <span className="font-bold text-ColorAzul">Vuela Ya</span><strong> ¿Qué es?</strong><br></br>
          Adquiere las tasas más bajas de tiquetes a diario.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros que aceptan horarios nocturnos y baja demanda.
          <strong><br></br>¿Cómo se separa?<br></br></strong>
          Pago 100% clientes con la decisión de volar ya.
        </>
      ),
    },
    {
      image: cuarenta,
      text: (
        <>
          <span className="font-bold text-BotonMorado">40 Mil Razones para viajar</span> <strong>¿Qué es?</strong><br></br>
          Aparta la promoción vigente con el valor más bajo.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros con poder de decisión.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Con 2 billetes de 20 mil pesos y en el momento adecuado.
        </>
      ),
    },
    {
      image: ganaya,
      text: (
        <>
          <span className="font-bold text-BotonValija">GanaYA y Viajaya</span><br></br><strong>¿Qué es?</strong><br></br>
          Por un precio bajo obtener la oportunidad de ganar un plan completo.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Personas con fe de ganar con sus números preferidos de la suerte.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Valor por boleta o compra de planes turísticos promocionales
          <br></br> (sorteos cada trimestre) .
        </>
      ),
    },
  
    {
      image: standard,
      text: (
        <>
          <span className="font-bold text-ColorAzul">Tarifas Standar</span> <strong>¿Qué es?</strong><br></br>
          Es el mi plan todo incluido con una inversión mensual
          en cuotas cómodas a más de 6 meses.
          <br></br><strong>¿Para quién es?</strong><br></br>
          para familias, grupos, excursiones colegiales viajes
          ya estipulados o con un fin de fecha..
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Cuota mínima por persona y compromiso de pago con las
          cuotas, ya que funciona por su cumplimento de pago.
        </>
      ),
    },
    {
      image: alohaya,
      text: (
        <>
          <span className="font-bold text-purple-700">Aloha YA</span> <strong>¿Qué es?</strong><br></br>
          Hotel seguro y con tiempo e ideal a quienes tienen sus
          propias maneras de conseguir vuelos..
          <br></br><strong>¿Para quién es?</strong><br></br>
          Para los viajeros que acumulan millas o para los viajeros que programan
          con tiempo sus alojamientos en destinos para adquirir promociones
          perfectas.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Con un porcentaje muy bajo y pagando a cuotas.
        </>
      ),
    },
    {
      image: yapaya,
      text: (
        <>
          <span className="font-bold text-purple-600">YAPAYA</span> <strong>¿Qué es?</strong><br></br>
          OPORTUNIDAD que ofrecemos para adquirir en 24 HORAS o
          menor tiempo posible, planes, promocionales y
          ofertas a nivel mundial a los viajeros.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Para todos los clientes que estan esperando la mejor
          oportunidad de reservar sus vacaciones o oportunidad de
          cierre de los comerciales.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Aplica términos y condiciones.
        </>
      ),
    },
    {
      image: viajofacil,
      text: (
        <>
          <span className="font-bold text-violet-800">Viajo Fácil</span> <strong>¿Qué es?</strong><br></br>
          Una semilla viajera que plantas con una cuota mínima
          y el destino final es tu viaje todo incluido a donde tu
          decidas tu plan.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Para esas personas que primero tienen las ganas de
          viajar sin saber su destino ni sus acompañantes.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Cuota minima de 100 mil en adelante,con el compromiso
          de ahorrar mientras defino el destino y evita cobros por
          cancelaciones.
        </>
      ),
    },
    {
      image: viajollanos,
      text: (
        <>
        
          {/* <span className="font-bold text-amber-400">Combi YA</span> <strong>¿Qué es?</strong><br></br>
          Aquí encontrarás la oportunidad de conocer múltiples destinos con descuentos.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros con tiempo ilimitado y el doble de ganas de viajar.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Con cuota de % inicial y saldo a cuotas mensuales. */}
        </>
      ),
    },
    {
      image: terrestres,
      text: (
        <>
          {/* <span className="font-bold text-yellow-300">Combi YA</span> <strong>¿Qué es?</strong><br></br>
          Aquí encontrarás la oportunidad de conocer múltiples destinos con descuentos.
          <br></br><strong>¿Para quién es?</strong><br></br>
          Viajeros con tiempo ilimitado y el doble de ganas de viajar.
          <br></br><strong>¿Cómo se obtiene?</strong><br></br>
          Con cuota de % inicial y saldo a cuotas mensuales. */}
        </>
      ),
    },

  ];

  return (
    <div className="flex flex-col items-center mt-4 mb-10 md:p-8 bg-opacity-50 rounded-lg p-10">
      <div className='fixed top-0 left-0 z-50'>
        <NavBar />
      </div>
      <h1 className='font-nunito bg-ColorAzul text-gray-600 font-bold p-4 text-2xl w-screen justify-center text-center mb-8 mt-8'>
        Nuestros Productos
      </h1>
      <div className="flex flex-col space-y-8"> {/* Contenedor para alinear verticalmente */}
        {items.map((item, index) => (
          <div key={index} className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 lg:space-x-8 mb-8">
            <div className="w-full md:w-1/2 flex justify-center p-8">
              <img src={item.image} alt={`Tab Image ${index + 1}`} className="w-40 md:w-80 lg:w-96 h-auto rounded-lg border-2 border-gray-700" />
            </div>
            <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col items-center p-8">
              <p className="text-sm md:text-lg lg:text-lg font-bold font-nunito text-gray-500 text-center p-2 md:p-4">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabbedImages;

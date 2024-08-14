import { useState } from 'react';
import style from './ModalDestino.module.css'
 
const ModalDestino = ({close}) => {
  const [pages, setPages] = useState(1)
  return(
    <>
    {pages == 1 &&<div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Politicas y condiciones</h2>
        <div className={style.flex}>
          <p>VIAJA YA! entiende que tu privacidad es importante para ti. Estamos comprometidos en proteger la privacidad de tu información personal mientras usas este sitio web. Esta Política de Privacidad explica cómo protegemos y usamos la información que recolectamos de ti. Al usar este sitio web, aceptas los términos descritos en la versión más reciente de esta Política de Privacidad. También debes leer nuestros Términos de Uso para entender las reglas generales acerca del uso de este sitio web, y cualesquiera términos adicionales que puedan aplicar cuando accedes a servicios particulares o materiales en ciertas áreas de este sitio web. “Nosotros”, “nuestro” significa Viaja ya y sus afiliados. “Tú”, “tu”, “visitante” o “usuario” significa el individuo accediendo a este sitio.


Información personal y no personal
Nuestra Política de Privacidad identifica cómo tratamos tu información personal y no personal.


¿Qué es la información no personal y cómo es recolectada y usada?
La información no personal es información que no puede identificarte. Si visitas este sitio web para leer información, así como información acerca de uno de nuestros servicios, podemos recolectar cierta información no personal del navegador web de tu computadora. Debido a que la información no personal no puede identificarte o no puede ser atada a ti de ninguna forma, no hay restricciones en las formas en las que usamos o compartimos información no personal.


¿Qué es la información personal y cómo es recolectada?
La información personal es información que te identifica como un individuo, tales como tu nombre, dirección de correo, dirección de correo electrónico, número de teléfono, y número de fax. Podemos recolectar información personal de ti en una variedad de formas:
Cuando nos mandas una aplicación o alguna otra forma
Cuando conduces una transacción con nosotros, nuestros afiliados y/o otros
Cuando recolectamos tu información en soporte de una transacción, tal como información de tarjeta de crédito
En algunos lugares de este sitio web tienes la oportunidad de mandarnos información personal sobre ti, para elegir recibir información particular, para comprar acceso a uno de nuestros productos o servicios, o para participar en una actividad.
</p>
        </div>
        <br></br><br></br>
{/* <button className={style.button} onClick={close}>Si estoy seguro</button><br></br> */}
        <button className={style.button} onClick={() => setPages(2)}>Siguiente</button>
      </div>
    </div>}
    {pages == 2 &&<div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Politicas y nose</h2>
        <div className={style.flex}>
          <p>Politicas de  daw wdwada wdawd wda awd wd wadwadwadaw wdawdadawd awd</p>
        </div>
        <br></br><br></br>
{/* <button className={style.button} onClick={close}>Si estoy seguro</button><br></br> */}
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>}
    {pages == 3 &&<div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Politicas y nose</h2>
        <div className={style.flex}>
          <p>Politicas de nosequeverga daw wdwada wdawd wda awd wd wadwadwadaw wdawdadawd awd</p>
        </div>
        <br></br><br></br>
{/* <button className={style.button} onClick={close}>Si estoy seguro</button><br></br> */}
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>}
    </>
  )
};

export default ModalDestino
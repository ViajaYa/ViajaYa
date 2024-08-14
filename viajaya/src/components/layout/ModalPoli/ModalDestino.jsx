import style from './ModalDestino.module.css'
 
const ModalDestino = ({close, id}) => {
  return(
    <>
    {id == 1 &&
    <div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Destinos nacionales</h2>
        <div className={style.flex}>
          <ul className={style.ul}>
            <li className={style.li}>San Andrés</li>
            <li className={style.li}>Santa Marta</li>
            <li className={style.li}>Cartagena</li>
            <li className={style.li}>Tolu</li>
            <li className={style.li}>Coveñas</li>
            <li className={style.li}>Guajira</li>
            <li className={style.li}>Cali</li>
          </ul>
          <ul className={style.ul}>
            <li className={style.li}>Llanos orientales</li>
            <li className={style.li}>Santander</li>
            <li className={style.li}>Eje cafetero</li>
            <li className={style.li}>Boyaca</li>
            <li className={style.li}>Amazonas</li>
            <li className={style.li}>Huila</li>
            <li className={style.li}>Buga</li>
          </ul>
        </div>
        <br></br><br></br>
{/* <button className={style.button} onClick={close}>Si estoy seguro</button><br></br> */}
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>}
    {id == 2 &&
    <div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Destinos internacionales</h2>
        <div className={style.flex}>
          <ul className={style.ul}>
            <li className={style.li}>Cancún</li>
            <li className={style.li}>México</li>
            <li className={style.li}>Curacao</li>
            <li className={style.li}>Punta Cana</li>
          </ul>
          <ul className={style.ul}>
            <li className={style.li}>Aruba</li>
            <li className={style.li}>Chile</li>
            <li className={style.li}>Argentina</li>
            <li className={style.li}>Madrid</li>
            <li className={style.li}>España Circuito</li>
          </ul>
        </div>
        <br></br><br></br>
{/* <button className={style.button} onClick={close}>Si estoy seguro</button><br></br> */}
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>}

    {id == 3 &&
    <div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Cruceros</h2>
        <div className={style.flex}>
          <ul className={style.ul}>
            <li className={style.li}>Disney</li>
            <li className={style.li}>Royal Caribbean</li>
            <li className={style.li}>Princess</li>
          </ul>
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
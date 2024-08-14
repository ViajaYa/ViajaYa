import style from './Modal.module.css'
 
const Modal = ({close, pay}) => {
  return(
    <>
    <div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>¿Estás seguro que deseas agregar este producto al carrito?</h2>
        <p>Puedes mirar tu carrito dando click en el icono en la esquina superior</p>
<button className={style.button} onClick={close}>Si estoy seguro</button><br></br>
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>
    </>
  )
};

export default Modal
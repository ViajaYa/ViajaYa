import style from './Modal.module.css'
import Slider from 'react-slick';
 
const ModalProject = ({close, detail, price}) => {
  const settings = {
    infinite: true,
    slidesToScroll: 1,
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    style:{
      margin:"15px 50px",
    }
  };
  return(
    <>
    <div className={style.modalContainer}>
      <div className={style.modal}>
        <h2 className={style.title}>Promocion ya pa ya</h2>
        <p className={style.price}>${price} p/p</p>
        <p className={style.desc} style={{height:"300px", overflowX:"scroll", whiteSpace: 'pre-line' }}>{`${detail}`}</p>
        <br></br>
        <button className={style.button} onClick={close}>Cerrar</button>
      </div>
    </div>
    </>
  )
};

export default ModalProject
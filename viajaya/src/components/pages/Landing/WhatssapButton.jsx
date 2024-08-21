import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import style from './Landing.module.css'
const WhatssapButton = () => {
  return (
    <a
      href="https://wa.link/28unmk" 
      className={style.whatsappButton}
      target="_blank"
      rel="noopener noreferrer"
    >
      <FontAwesomeIcon icon={faWhatsapp} size="2x" />
    </a>
  );
}

export default WhatssapButton;

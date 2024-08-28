import React, {useState, useEffect} from 'react'

import sobrenosotros1 from '../../../assets/sn/sobrenosotros1.png';
import sobrenosotros2 from '../../../assets/sn/sobrenosotros2.png';
import sobrenosotros3 from '../../../assets/sn/sobrenosotros3.png';
import sobrenosotros4 from '../../../assets/sn/sobrenosotros4.png';
import sobrenosotros5 from '../../../assets/sn/sobrenosotros5.png';
import sobrenosotros6 from '../../../assets/sn/sobrenosotros6.png';
import sobrenosotros7 from '../../../assets/sn/sobrenosotros7.png';
import sobrenosotros8 from '../../../assets/sn/sobrenosotros8.png';
import sobrenosotros9 from '../../../assets/sn/sobrenosotros9.png';
import sobrenosotros10 from '../../../assets/sn/sobrenosotros10.png';
import sobrenosotros11 from '../../../assets/sn/sobrenosotros11.png';
import sobrenosotros12 from '../../../assets/sn/sobrenosotros12.png';
import sobrenosotros13 from '../../../assets/sn/sobrenosotros13.png';
import sobrenosotros14 from '../../../assets/sn/sobrenosotros14.png';
import sobrenosotros15 from '../../../assets/sn/sobrenosotros15.png';
import sobrenosotros16 from '../../../assets/sn/sobrenosotros16.png';

const About = () => {
  const [scattered, setScattered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setScattered(!scattered), 2000);
    return () => clearTimeout(timer);
  }, [scattered]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 p-8">
        <img src={sobrenosotros1} alt="sobrenosotros 1" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-4' : ''}`} />
        <img src={sobrenosotros2} alt="sobrenosotros 2" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-4 translate-y-2' : ''}`} />
        <img src={sobrenosotros3} alt="sobrenosotros 3" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-4 translate-y-4' : ''}`} />
        <img src={sobrenosotros4} alt="sobrenosotros 4" className={`transition-transform duration-700 ${scattered ? 'transform translate-y-4' : ''}`} />
        <img src={sobrenosotros5} alt="sobrenosotros 5" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-6 -translate-y-2' : ''}`} />
        <img src={sobrenosotros6} alt="sobrenosotros 6" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-8 translate-y-6' : ''}`} />
        <img src={sobrenosotros7} alt="sobrenosotros 7" className={`transition-transform duration-700 ${scattered ? 'transform -translate-y-8 translate-x-2' : ''}`} />
        <img src={sobrenosotros8} alt="sobrenosotros 8" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-10 translate-y-4' : ''}`} />
        <img src={sobrenosotros9} alt="sobrenosotros 9" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-4' : ''}`} />
        <img src={sobrenosotros10} alt="sobrenosotros 10" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-4 translate-y-2' : ''}`} />
        <img src={sobrenosotros11} alt="sobrenosotros 11" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-4 translate-y-4' : ''}`} />
        <img src={sobrenosotros12} alt="sobrenosotros 12" className={`transition-transform duration-700 ${scattered ? 'transform translate-y-4' : ''}`} />
        <img src={sobrenosotros13} alt="sobrenosotros 13" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-6 -translate-y-2' : ''}`} />
        <img src={sobrenosotros14} alt="sobrenosotros 14" className={`transition-transform duration-700 ${scattered ? 'transform translate-x-8 translate-y-6' : ''}`} />
        <img src={sobrenosotros15} alt="sobrenosotros 15" className={`transition-transform duration-700 ${scattered ? 'transform -translate-y-8 translate-x-2' : ''}`} />
        <img src={sobrenosotros16} alt="sobrenosotros 16" className={`transition-transform duration-700 ${scattered ? 'transform -translate-x-10 translate-y-4' : ''}`} />
      </div>
      
    </div>
  );
};

export default About
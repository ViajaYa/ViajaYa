// src/hooks/useScript.js
import { useEffect, useState } from 'react';

const useScript = (src) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Verificar si el script ya está cargado
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`Script ${src} ya está cargado.`);
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const onScriptLoad = () => {
      console.log(`Script ${src} cargado exitosamente.`);
      setLoaded(true);
    };

    const onScriptError = () => {
      console.error(`Error al cargar el script ${src}.`);
      setError(true);
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);

    document.body.appendChild(script);
    console.log(`Script ${src} añadido al DOM.`);

    return () => {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
      console.log(`Script ${src} eliminado del DOM.`);
    };
  }, [src]);

  return { loaded, error };
};

export default useScript;



import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import useAuthGuard from "./components/hooks/useAuthGuard"; // ✅ SIN llaves {}
import AppRoutes from "./components/AppRoutes";
import FloatingHelpButton from "./components/help/FloatingHelpButton";
import "react-toastify/dist/ReactToastify.css";

// CSS para animaciones del tooltip
const tooltipStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rutaAnterior, setRutaAnterior] = useState(null);
  
  const location = useLocation();
  
  // 🎯 Ejecutar useAuthGuard solo por sus efectos (sincronización)
  useAuthGuard();

  // Inyectar estilos CSS para tooltips
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = tooltipStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Guardar ruta anterior
  useEffect(() => {
    if (location.pathname !== "/") {
      setRutaAnterior(location.pathname);
    }
  }, [location.pathname]);

  const handleFormBack = () => {
    setShowForm(false);
  };

  const handleSelect = (numbers) => {
    setSelectedNumbers(numbers);
    setShowForm(true);
  };

  return (
    <>
      <AppRoutes
        selectedNumbers={selectedNumbers}
        showForm={showForm}
        handleFormBack={handleFormBack}
        handleSelect={handleSelect}
        rutaAnterior={rutaAnterior}
      />
      
      {/* Sistema de ayuda flotante */}
      <FloatingHelpButton />
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
    </>
  );
}

export default App;
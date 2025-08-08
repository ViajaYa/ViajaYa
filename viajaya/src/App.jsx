import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import useAuthGuard from "./components/hooks/useAuthGuard"; // ✅ SIN llaves {}
import AppRoutes from "./components/AppRoutes";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rutaAnterior, setRutaAnterior] = useState(null);
  
  const location = useLocation();
  
  // 🎯 Ejecutar useAuthGuard solo por sus efectos (sincronización)
  useAuthGuard();

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
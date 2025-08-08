import  { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from "react-hot-toast";

// ✅ Importar hooks y acciones de Redux Toolkit
import { useAppDispatch } from '../../../redux/hooks/hooks';
import { useAuth } from '../../../redux/hooks/hooks';
import { 
  loginUser, 
  registerUser, 
  forgotPassword, 
  clearError 
} from '../../../redux/slices/authSlice';
import { config } from '../../../utils/env';

import NavBar from '../../layout/NavBar/NavBar';

const Login = () => {
  // ✅ Estados locales para UI
  const [loginMode, setLoginMode] = useState(1); // 0: registro, 1: login, 2: recuperar
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    name: '',
  });

  // ✅ Redux hooks
  const dispatch = useAppDispatch();
  const {  isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const { referral_code } = useParams();

  // ✅ Expresión regular para email
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ✅ Limpiar errores cuando cambia el modo
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [loginMode, dispatch]);

  // ✅ Mostrar errores como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ✅ Redirigir si ya está autenticado - usar useEffect para evitar loops
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/profile", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // ✅ Función para crear usuario (registro)
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name?.trim()) {
      return toast.error("El nombre es obligatorio");
    }
    
    if (!emailReg.test(formData.email)) {
      return toast.error("Debes ingresar un email válido");
    }
    
    if (!formData.password || formData.password.length < 8) {
      return toast.error("La contraseña debe tener al menos 8 caracteres");
    }
    
    if (formData.password !== formData.password2) {
      return toast.error("Las contraseñas no coinciden");
    }

    // ✅ Preparar datos del usuario
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      referred_by: referral_code || null,
    };

    // ✅ Debug en desarrollo
    if (config?.isDevelopment) {
      console.log("Datos de registro:", userData);
    }

   try {
      // ✅ Usar la acción de Redux (sin variable no utilizada)
      await dispatch(registerUser(userData)).unwrap();
      
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión");
      
      // ✅ Cambiar a modo login y limpiar formulario
      setLoginMode(1);
      setFormData({
        email: formData.email, // Mantener email para facilitar login
        password: '',
        password2: '',
        name: '',
      });
      
    } catch (error) {
      // El error ya se muestra mediante useEffect
      console.error('Error en registro:', error);
    }
  };

  // ✅ Función para autenticar usuario (login)
 const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!emailReg.test(formData.email)) {
      return toast.error("Debes ingresar un email válido");
    }
    
    if (!formData.password) {
      return toast.error("La contraseña es obligatoria");
    }

    try {
      // ✅ Usar la acción de Redux (sin variable no utilizada)
      await dispatch(loginUser({
        email: formData.email.trim(),
        password: formData.password
      })).unwrap();
      
      toast.success("¡Bienvenido!");
      navigate("/profile");
      
    } catch (error) {
      // El error ya se muestra mediante useEffect
      console.error('Error en login:', error);
    }
  };


  // ✅ Función para recuperar contraseña
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!emailReg.test(formData.email)) {
      return toast.error("Debes ingresar un email válido");
    }

    try {
      // ✅ Usar la acción de Redux
      await dispatch(forgotPassword({ email: formData.email.trim() })).unwrap();
      
      toast.success("Email de recuperación enviado");
      setLoginMode(1); // Volver al login
      
    } catch (error) {
      // El error ya se muestra mediante useEffect
      console.error('Error en recuperación:', error);
    }
  };

  // ✅ Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      {/* NavBar fijo */}
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            fontFamily: 'Nunito',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Contenedor principal */}
      <div className="w-full max-w-md mx-auto mt-20">
        {/* ✅ MODO RECUPERAR CONTRASEÑA */}
        {loginMode === 2 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 font-nunito">
                Recupera tu cuenta
              </h2>
              <p className="text-gray-600 mt-2">
                Te enviaremos un email para restablecer tu contraseña
              </p>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.email} 
                  name="email" 
                  type="email" 
                  placeholder="Ingresa tu email"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold font-nunito hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  'Recuperar'
                )}
              </button>
            </form>
            
            <div className="mt-6 space-y-3 text-center">
              <p className="text-gray-600 font-nunito">
                ¿Aún no tienes cuenta?{' '}
                <button 
                  onClick={() => setLoginMode(0)} 
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Regístrate
                </button>
              </p>
              <p className="text-gray-600 font-nunito">
                <button 
                  onClick={() => setLoginMode(1)} 
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors"
                >
                  ← Volver al login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ✅ MODO LOGIN */}
        {loginMode === 1 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 font-nunito">
                Iniciar sesión
              </h2>
              <p className="text-gray-600 mt-2">
                ¡Bienvenido de vuelta!
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.email} 
                  name="email" 
                  type="email" 
                  placeholder="Email"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.password} 
                  name="password" 
                  type="password" 
                  placeholder="Contraseña"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold font-nunito hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Ingresando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
            
            <div className="mt-6 space-y-3 text-center">
              <p className="text-gray-600 font-nunito">
                <button 
                  onClick={() => setLoginMode(2)} 
                  className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors"
                >
                  Olvidé mi contraseña
                </button>
              </p>
              
              <p className="text-gray-600 font-nunito">
                ¿Aún no tienes cuenta?{' '}
                <button 
                  onClick={() => setLoginMode(0)} 
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ✅ MODO REGISTRO */}
        {loginMode === 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 font-nunito">
                Registrarme
              </h2>
              <p className="text-gray-600 mt-2">
                Crea tu cuenta y únete a ViajaYa
              </p>
            </div>
            
            {/* Código de referido */}
            {referral_code && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6 text-center">
                <p className="font-semibold font-nunito">🎉 ¡Tienes un código de referido!</p>
                <p className="text-sm opacity-90 font-nunito">Código: {referral_code}</p>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.name} 
                  name="name" 
                  type="text" 
                  placeholder="Nombre completo"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.email} 
                  name="email" 
                  type="email" 
                  placeholder="Email"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.password} 
                  name="password" 
                  type="password" 
                  placeholder="Contraseña (mín. 8 caracteres)"
                  disabled={loading}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <div>
                <input 
                  onChange={handleInputChange} 
                  value={formData.password2} 
                  name="password2" 
                  type="password" 
                  placeholder="Repetir contraseña"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-nunito"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold font-nunito hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  'Registrarme'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 font-nunito">
                ¿Ya tienes cuenta?{' '}
                <button 
                  onClick={() => setLoginMode(1)} 
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                >
                  Ingresa
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ✅ Debug info solo en desarrollo */}
        {config?.isDevelopment && (
          <div className="mt-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono">
            <p>
              Modo: {loginMode === 0 ? 'Registro' : loginMode === 1 ? 'Login' : 'Recuperar'} | 
              Loading: {loading.toString()} |
              Authenticated: {isAuthenticated.toString()}
              {referral_code && ` | Referido: ${referral_code}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
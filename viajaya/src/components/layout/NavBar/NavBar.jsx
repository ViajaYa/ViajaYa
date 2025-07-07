import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  verifyToken,
  logout,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading
} from '../../../redux/slices/authSlice';

import logo from "../../../assets/logo2.png";
import {
  FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaWhatsapp, FaBars, FaTimes, FaChevronDown
} from 'react-icons/fa';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      dispatch(verifyToken());
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMenuOpen(false);
    setUserDropdown(false);
  };

  const handleLogin = () => {
    navigate("/login");
    setMenuOpen(false);
  };

  const handleProfileNavigation = () => {
    navigate('/profile');
    setMenuOpen(false);
    setUserDropdown(false);
  };

  useEffect(() => {
    setMenuOpen(false);
    setShowSocialMenu(false);
    setUserDropdown(false);
  }, [location.pathname]);

  const currentPath = location.pathname;

  const isLoginPage = currentPath === '/login';
  const isProductsPage = currentPath === '/productos';
  const isAboutPage = currentPath === '/about';
  const isPanelPage = currentPath === '/panel';
  const isProfilePage = currentPath === '/profile';
  const isPanelUserPage = currentPath === '/panel/user';
  const isPanelPackPage = currentPath === '/panel/pack';
  const isPanelNewPage = currentPath === '/panel/newPack';
  const isBeneficiosNewPage = currentPath === "/puntos";

  const isAdmin = () => {
    return user && (user.role >= 7 || user.role === 'ADMIN' || user.role === 'OWNER');
  };

  const canAccessTraining = () => {
    return user && (user.role >= 2);
  };

  if (loading && !user) {
    return (
      <nav className="bg-white shadow px-4 py-2 flex items-center justify-between">
        <RouterLink to="/">
          <img className="h-12" src={logo} alt="Logo ViajaYa" />
        </RouterLink>
        <span className="text-gray-500">Cargando...</span>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        <RouterLink to="/" className="flex items-center">
          <img className="h-12 w-auto" src={logo} alt="Logo ViajaYa" />
        </RouterLink>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center gap-2 lg:gap-6 font-nunito font-medium text-gray-700">
          {!isLoginPage && !isProductsPage && !isPanelPage && !isProfilePage &&
            !isPanelUserPage && !isPanelPackPage && !isPanelNewPage && !isBeneficiosNewPage && (
              <>
                <li>
                  <RouterLink to="/about" className="hover:text-ColorAzul transition">Nosotros</RouterLink>
                </li>
                <li>
                  <RouterLink to="/allpacks" className="hover:text-ColorAzul transition">Paquetes</RouterLink>
                </li>
                <li>
                  <RouterLink to="/productos" className="hover:text-ColorAzul transition">Productos</RouterLink>
                </li>
                <li>
                  <RouterLink to="/puntos" className="hover:text-ColorAzul transition">Obtén Descuentos</RouterLink>
                </li>
              </>
            )
          }
          {!isAuthenticated && (
            <li>
              <button onClick={handleLogin} className="bg-ColorMorado text-white px-4 py-2 rounded hover:bg-ColorAzul transition">Ingresar</button>
            </li>
          )}
          {isAuthenticated && user && (
            <li className="relative">
              <button
                onClick={() => setUserDropdown(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition"
              >
                <span>👤 {user.name || 'Usuario'}</span>
                <FaChevronDown className={`transition-transform ${userDropdown ? "rotate-180" : ""}`} />
              </button>
              {/* Dropdown */}
              {userDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg py-2 z-50 animate-fade-in">
                  <button onClick={handleProfileNavigation} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Ver Perfil</button>
                  <button onClick={() => { navigate('/userReservas'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Mis Reservas</button>
                  {canAccessTraining() && (
                    <button onClick={() => { navigate('/capacitacion'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Capacitaciones</button>
                  )}
                  {isAdmin() && (
                    <button onClick={() => { navigate('/panel'); setUserDropdown(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Panel Admin</button>
                  )}
                  <hr className="my-1" />
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cerrar Sesión</button>
                </div>
              )}
            </li>
          )}
          {/* Social menu */}
          <li className="relative">
            <button
              onClick={() => setShowSocialMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition"
            >
              Redes
              <FaChevronDown className={`transition-transform ${showSocialMenu ? "rotate-180" : ""}`} />
            </button>
            {showSocialMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg py-3 z-50 flex flex-col gap-2 animate-fade-in">
                <a href="https://wa.link/28unmk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 text-green-600">
                  <FaWhatsapp /> WhatsApp
                </a>
                <a href="https://www.facebook.com/share/w65jnMDrZaqF3ucy/?mibextid=qi2Omg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-600">
                  <FaFacebookF /> Facebook
                </a>
                <a href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-pink-50 text-pink-600">
                  <FaInstagram /> Instagram
                </a>
                <a href="https://www.tiktok.com/@agenciadeviajesviajaya" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700">
                  <FaTiktok /> TikTok
                </a>
                <a href="https://www.t.me/+jVPYyJBifRJiMjdh" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-500">
                  <FaTelegramPlane /> Telegram
                </a>
              </div>
            )}
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-3xl text-ColorAzul focus:outline-none"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg animate-fade-in">
          <ul className="flex flex-col gap-2 py-4 px-6 font-nunito font-semibold text-gray-700">
            {!isLoginPage && !isProductsPage && !isPanelPage && !isProfilePage &&
              !isPanelUserPage && !isPanelPackPage && !isPanelNewPage && !isBeneficiosNewPage && (
                <>
                  <li>
                    <RouterLink to="/about" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-ColorAzul">Nosotros</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/allpacks" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-ColorAzul">Paquetes</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/productos" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-ColorAzul">Productos</RouterLink>
                  </li>
                  <li>
                    <RouterLink to="/puntos" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-ColorAzul">Obtén Descuentos</RouterLink>
                  </li>
                </>
              )
            }
            {!isAuthenticated && (
              <li>
                <button onClick={handleLogin} className="w-full bg-ColorMorado text-white px-4 py-2 rounded hover:bg-ColorAzul transition">Ingresar</button>
              </li>
            )}
            {isAuthenticated && user && (
              <li>
                <button
                  onClick={() => setUserDropdown(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition w-full"
                >
                  <span>👤 {user.name || 'Usuario'}</span>
                  <FaChevronDown className={`transition-transform ${userDropdown ? "rotate-180" : ""}`} />
                </button>
                {userDropdown && (
                  <div className="mt-2 w-full bg-white border rounded shadow-lg py-2 z-50 animate-fade-in">
                    <button onClick={handleProfileNavigation} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Ver Perfil</button>
                    <button onClick={() => { navigate('/userReservas'); setUserDropdown(false); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Mis Reservas</button>
                    {canAccessTraining() && (
                      <button onClick={() => { navigate('/capacitacion'); setUserDropdown(false); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Capacitaciones</button>
                    )}
                    {isAdmin() && (
                      <button onClick={() => { navigate('/panel'); setUserDropdown(false); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Panel Admin</button>
                    )}
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cerrar Sesión</button>
                  </div>
                )}
              </li>
            )}
            {/* Social menu mobile */}
            <li>
              <button
                onClick={() => setShowSocialMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition w-full"
              >
                Redes
                <FaChevronDown className={`transition-transform ${showSocialMenu ? "rotate-180" : ""}`} />
              </button>
              {showSocialMenu && (
                <div className="mt-2 w-full bg-white border rounded shadow-lg py-3 z-50 flex flex-col gap-2 animate-fade-in">
                  <a href="https://wa.link/28unmk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 text-green-600">
                    <FaWhatsapp /> WhatsApp
                  </a>
                  <a href="https://www.facebook.com/share/w65jnMDrZaqF3ucy/?mibextid=qi2Omg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-600">
                    <FaFacebookF /> Facebook
                  </a>
                  <a href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-pink-50 text-pink-600">
                    <FaInstagram /> Instagram
                  </a>
                  <a href="https://www.tiktok.com/@agenciadeviajesviajaya" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700">
                    <FaTiktok /> TikTok
                  </a>
                  <a href="https://www.t.me/+jVPYyJBifRJiMjdh" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-500">
                    <FaTelegramPlane /> Telegram
                  </a>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}

      {/* Debug info solo en desarrollo */}
      {import.meta.env.MODE === 'development' && (
        <div className="absolute right-2 top-16 bg-gray-100 rounded px-2 py-1 text-xs text-gray-600 shadow">
          Usuario: {isAuthenticated ? user?.name : 'No autenticado'} | 
          Rol: {user?.role || 'N/A'} | Ruta: {currentPath}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
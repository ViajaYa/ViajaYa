import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  verifyToken, 
  logout, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading 
} from '../../../redux/slices/authSlice';

import style from './NavBar.module.css';
import logo from "../../../assets/logo2.png";
import { Link as RouterLink } from 'react-router-dom';

// Importa los íconos de redes sociales
import { FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaWhatsapp, FaBars, FaTimes } from 'react-icons/fa';

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // ✅ Usar selectores del authSlice
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  
  // Estados locales para la UI
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Verificar token al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      dispatch(verifyToken());
    }
  }, [dispatch, user]);

  // ✅ Función para manejar logout mejorada
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMenuOpen(false);
  };

  // ✅ Función para manejar login
  const handleLogin = () => {
    navigate("/login");
    setMenuOpen(false);
  };

  // ✅ Función para manejar navegación al perfil
  const handleProfileNavigation = () => {
    navigate('/profile');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // ✅ Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
    setShowSocialMenu(false);
  }, [location.pathname]);

  // ✅ Usar useLocation en lugar de window.location.pathname
  const currentPath = location.pathname;

  // Verifica las condiciones para mostrar elementos específicos
  const isLoginPage = currentPath === '/login';
  const isProductsPage = currentPath === '/productos';
  const isAboutPage = currentPath === '/about';
  const isPanelPage = currentPath === '/panel';
  const isProfilePage = currentPath === '/profile';
  const isPanelUserPage = currentPath === '/panel/user';
  const isPanelPackPage = currentPath === '/panel/pack';
  const isPanelNewPage = currentPath === '/panel/newPack';
  const isBeneficiosNewPage = currentPath === "/puntos";

  // ✅ Función para verificar roles de admin
  const isAdmin = () => {
    return user && (user.role >= 7 || user.role === 'ADMIN' || user.role === 'OWNER');
  };

  // ✅ Función para verificar si puede acceder a capacitaciones
  const canAccessTraining = () => {
    return user && (user.role >= 2);
  };

  // ✅ Mostrar indicador de carga si está verificando el token
  if (loading && !user) {
    return (
      <nav className={style.nav}>
        <RouterLink to="/" className={style.noLink}>
          <img className={style.logo} src={logo} alt="Logo ViajaYa" />
        </RouterLink>
        <div className={style.loading}>
          <span>Cargando...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className={style.nav}>
      <RouterLink to="/" className={style.noLink}>
        <img className={style.logo} src={logo} alt="Logo ViajaYa" />
      </RouterLink>
      
      {/* Botón de menú hamburguesa */}
      <button 
        className={style.hamburger} 
        onClick={toggleMenu}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

      <ul className={`${style.ul} ${menuOpen ? style.menuOpen : ''}`}>
        {/* ✅ Mostrar "Inicio" en la página de login */}
        {isLoginPage && (
          <li>
            <RouterLink to="/" className={style.noLink} onClick={() => setMenuOpen(false)}>
              <span className={style.li}>Inicio</span>
            </RouterLink>
          </li>
        )}

        {/* ✅ Mostrar navegación en página de productos */}
        {isProductsPage && (
          <>
            <li>
              <RouterLink to="/" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Inicio</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {/* ✅ Navegación en páginas del panel */}
        {isPanelPage && (
          <>
            <li>
              <RouterLink to="/" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Inicio</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {isProfilePage && (
          <>
            <li>
              <RouterLink to="/" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Inicio</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {isPanelUserPage && (
          <>
            <li>
              <RouterLink to="/panel" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Panel</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {isPanelPackPage && (
          <>
            <li>
              <RouterLink to="/panel" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Panel</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {isPanelNewPage && (
          <>
            <li>
              <RouterLink to="/panel" className={style.noLink} onClick={() => setMenuOpen(false)}>
                <span className={style.li}>Panel</span>
              </RouterLink>
            </li>
            {!isAuthenticated && (
              <li className={style.libutton} onClick={handleLogin}>
                Ingresar
              </li>
            )}
          </>
        )}

        {/* ✅ Navegación principal - mostrar cuando no estamos en páginas específicas */}
        {!isLoginPage && !isProductsPage && !isPanelPage && !isProfilePage && 
         !isPanelUserPage && !isPanelPackPage && !isPanelNewPage && !isBeneficiosNewPage && (
          <>
            {isAboutPage ? (
              <>
                <li>
                  <RouterLink to="/" className={style.noLink} onClick={() => setMenuOpen(false)}>
                    <span className={style.li}>Inicio</span>
                  </RouterLink>
                </li>
                {!isAuthenticated && (
                  <li className={style.libutton} onClick={handleLogin}>
                    Ingresar
                  </li>
                )}
              </>
            ) : (
              <>
                <li>
                  <RouterLink to="/about" className={style.noLink} onClick={() => setMenuOpen(false)}>
                    <span className={style.li}>Nosotros</span>
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/allpacks" className={style.noLink} onClick={() => setMenuOpen(false)}>
                    <span className={style.li}>Paquetes</span>
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/productos" className={style.noLink} onClick={() => setMenuOpen(false)}>
                    <span className={style.li}>Productos</span>
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/puntos" className={style.noLink} onClick={() => setMenuOpen(false)}>
                    <span className={style.li}>Obtén Descuentos</span>
                  </RouterLink>
                </li>
                {!isAuthenticated && (
                  <li className={style.libutton} onClick={handleLogin}>
                    Ingresar
                  </li>
                )}
              </>
            )}
          </>
        )}

        {/* ✅ Menú de usuario autenticado mejorado */}
        {isAuthenticated && user && (
          <li className={style.userMenu}>
            <div className={style.userDropdown}>
              <button 
                className={style.userButton}
                onClick={() => setShowSocialMenu(false)} // Cerrar menú social si está abierto
              >
                👤 {user.name || 'Usuario'}
              </button>
              <div className={style.userDropdownContent}>
                <button onClick={handleProfileNavigation} className={style.dropdownItem}>
                  Ver Perfil
                </button>
                <button onClick={() => {navigate('/userReservas'); setMenuOpen(false);}} className={style.dropdownItem}>
                  Mis Reservas
                </button>
                
                {/* ✅ Verificar acceso a capacitaciones */}
                {canAccessTraining() && (
                  <button onClick={() => {navigate('/capacitacion'); setMenuOpen(false);}} className={style.dropdownItem}>
                    Capacitaciones
                  </button>
                )}
                
                {/* ✅ Verificar acceso a panel de admin con nueva lógica de roles */}
                {isAdmin() && (
                  <button onClick={() => {navigate('/panel'); setMenuOpen(false);}} className={style.dropdownItem}>
                    Panel Admin
                  </button>
                )}
                
                <hr className={style.dropdownDivider} />
                <button onClick={handleLogout} className={`${style.dropdownItem} ${style.logoutButton}`}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </li>
        )}

        {/* ✅ Redes sociales (no mostrar en login y productos) */}
        {!isLoginPage && !isProductsPage && (
          <li className={style.socialMenu}>
            <button 
              onClick={() => setShowSocialMenu(!showSocialMenu)} 
              className={style.socialButton}
              aria-label="Mostrar redes sociales"
            >
              Redes
            </button>
            {showSocialMenu && (
              <div className={style.socialIcons}>
                <a 
                  href="https://wa.link/28unmk" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={style.icon}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp />
                </a>
                <a 
                  href="https://www.facebook.com/share/w65jnMDrZaqF3ucy/?mibextid=qi2Omg" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={style.icon}
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a 
                  href="https://www.instagram.com/viajaya_pagina_oficial/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={style.icon}
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
                <a 
                  href="https://www.tiktok.com/@agenciadeviajesviajaya" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={style.icon}
                  aria-label="TikTok"
                >
                  <FaTiktok />
                </a>
                <a 
                  href="https://www.t.me/+jVPYyJBifRJiMjdh" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={style.icon}
                  aria-label="Telegram"
                >
                  <FaTelegramPlane />
                </a>
              </div>
            )}
          </li>
        )}
      </ul>

      {/* ✅ Debug info solo en desarrollo */}
      {import.meta.env.MODE === 'development' && (
        <div className={style.debugInfo}>
          <small>
            Usuario: {isAuthenticated ? user?.name : 'No autenticado'} | 
            Rol: {user?.role || 'N/A'} |
            Ruta: {currentPath}
          </small>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
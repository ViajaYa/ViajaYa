import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { CONTEXTUAL_TOOLTIPS } from '../../utils/helpGuides';

/**
 * Hook personalizado para mostrar tooltips contextuales según el rol del usuario
 * @param {string} tooltipId - ID único del tooltip definido en helpGuides.js
 * @param {object} options - Opciones adicionales del tooltip
 */
export const useContextualTooltip = (tooltipId, options = {}) => {
  const user = useSelector(selectUser);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const targetRef = useRef(null);

  const {
    placement = 'top',
    delay = 500,
    offset = 8,
    showOnHover = true,
    showOnFocus = true
  } = options;

  // Obtener rol del usuario
  const getUserRole = () => {
    const roleMap = {
      1: 'CLIENTE',
      2: 'ASESOR', 
      3: 'LIDER',
      4: 'GERENTE',
      5: 'ADMIN',
      6: 'CONTADOR',
      7: 'OWNER'
    };
    return roleMap[user?.role] || 'CLIENTE';
  };

  // Obtener contenido del tooltip para el rol actual
  const getTooltipContent = () => {
    const userRole = getUserRole();
    const tooltipConfig = CONTEXTUAL_TOOLTIPS[tooltipId];
    
    if (!tooltipConfig) return null;
    
    return tooltipConfig[userRole] || tooltipConfig.default || null;
  };

  // Calcular posición del tooltip
  const calculatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top, left;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + offset;
        break;
      default:
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    }

    // Ajustar si se sale del viewport
    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8;
    if (top < 0) top = targetRect.bottom + offset;
    if (top + tooltipRect.height > viewportHeight) top = targetRect.top - tooltipRect.height - offset;

    setPosition({ top, left });
  };

  // Mostrar tooltip
  const showTooltip = () => {
    if (getTooltipContent()) {
      setIsVisible(true);
      setTimeout(calculatePosition, 0);
    }
  };

  // Ocultar tooltip
  const hideTooltip = () => {
    setIsVisible(false);
  };

  // Event handlers
  const handleMouseEnter = () => {
    if (showOnHover) {
      setTimeout(showTooltip, delay);
    }
  };

  const handleMouseLeave = () => {
    if (showOnHover) {
      hideTooltip();
    }
  };

  const handleFocus = () => {
    if (showOnFocus) {
      showTooltip();
    }
  };

  const handleBlur = () => {
    if (showOnFocus) {
      hideTooltip();
    }
  };

  // Recalcular posición en resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  // Props para el elemento target
  const targetProps = {
    ref: targetRef,
    ...(showOnHover && {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    ...(showOnFocus && {
      onFocus: handleFocus,
      onBlur: handleBlur,
    }),
  };

  const tooltipContent = getTooltipContent();

  return {
    targetProps,
    tooltipProps: {
      ref: tooltipRef,
      style: {
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
      },
    },
    isVisible: isVisible && tooltipContent,
    content: tooltipContent,
    showTooltip,
    hideTooltip,
  };
};

/**
 * Componente Tooltip reutilizable
 */
export const ContextualTooltip = ({ children, tooltipId, placement = 'top', className = '', ...options }) => {
  const { targetProps, tooltipProps, isVisible, content } = useContextualTooltip(tooltipId, { placement, ...options });

  return (
    <>
      <div {...targetProps} className={className}>
        {children}
      </div>
      {isVisible && content && (
        <div
          {...tooltipProps}
          className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs z-50 pointer-events-none"
          style={{
            ...tooltipProps.style,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {content}
          {/* Flecha del tooltip */}
          <div
            className="absolute w-2 h-2 bg-gray-800 transform rotate-45"
            style={{
              [placement === 'top' ? 'bottom' : placement === 'bottom' ? 'top' : placement === 'left' ? 'right' : 'left']: '-4px',
              [placement === 'top' || placement === 'bottom' ? 'left' : 'top']: '50%',
              transform: 'translate(-50%, 0) rotate(45deg)',
            }}
          />
        </div>
      )}
    </>
  );
};
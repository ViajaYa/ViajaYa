import { toast } from 'react-toastify';

const toastMiddleware = () => (next) => (action) => {
  const result = next(action);

  // Solo mostrar toasts en ciertos casos exitosos o errores importantes
  if (action.type.endsWith('/fulfilled')) {
    switch (action.type) {
      case 'auth/loginUser/fulfilled':
        toast.success(`¡Bienvenido ${action.payload.user.name}!`, {
          position: 'top-right',
          autoClose: 3000,
        });
        break;
      case 'quote/createQuote/fulfilled':
        toast.success(`Cotización ${action.payload.quote_number} creada exitosamente`, {
          position: 'top-right',
          autoClose: 4000,
        });
        break;
      case 'quote/approveQuote/fulfilled':
        toast.success('Cotización aprobada exitosamente', {
          position: 'top-right',
          autoClose: 3000,
        });
        break;
      case 'contract/createContract/fulfilled':
        toast.success('Contrato generado exitosamente', {
          position: 'top-right',
          autoClose: 4000,
        });
        break;
      case 'payment/processPayment/fulfilled':
        toast.success('Pago procesado correctamente', {
          position: 'top-right',
          autoClose: 3000,
        });
        break;
    }
  }

  // Manejar errores
  if (action.type.endsWith('/rejected')) {
    const errorMessage = action.payload || action.error?.message || 'Ha ocurrido un error';
    
    switch (action.type) {
      case 'auth/loginUser/rejected':
        toast.error(`Error de login: ${errorMessage}`, {
          position: 'top-right',
          autoClose: 5000,
        });
        break;
      default:
        // Solo mostrar errores críticos, no todos
        if (action.error?.message && !action.error.message.includes('404')) {
          toast.error(errorMessage, {
            position: 'top-right',
            autoClose: 4000,
          });
        }
        break;
    }
  }

  // Acciones especiales
  if (action.type === 'auth/logout') {
    toast.info('Sesión cerrada correctamente', {
      position: 'top-right',
      autoClose: 2000,
    });
  }

  return result;
};

export default toastMiddleware;
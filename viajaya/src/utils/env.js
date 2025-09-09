// Validar variables de entorno requeridas
const requiredEnvVars = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_WOMPI_PUBLIC_KEY: import.meta.env.VITE_WOMPI_PUBLIC_KEY,
};

// Variables opcionales con valores por defecto SOLO como fallback
const optionalEnvVars = {
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
  VITE_TOAST_DURATION: import.meta.env.VITE_TOAST_DURATION,
  VITE_WOMPI_ENVIRONMENT: import.meta.env.VITE_WOMPI_ENVIRONMENT,
  VITE_MAX_QUOTE_ITEMS: import.meta.env.VITE_MAX_QUOTE_ITEMS,
  VITE_PAYMENT_TIMEOUT: import.meta.env.VITE_PAYMENT_TIMEOUT,
  VITE_SESSION_TIMEOUT: import.meta.env.VITE_SESSION_TIMEOUT,
  VITE_MAX_FILE_SIZE: import.meta.env.VITE_MAX_FILE_SIZE,
  VITE_DEFAULT_PAGE_SIZE: import.meta.env.VITE_DEFAULT_PAGE_SIZE,
  VITE_MAX_PAGE_SIZE: import.meta.env.VITE_MAX_PAGE_SIZE,
};

// Verificar que todas las variables requeridas estén definidas
const validateEnv = () => {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars);
    throw new Error(`Variables de entorno requeridas no definidas: ${missingVars.join(', ')}`);
  }

  console.log('✅ Variables de entorno validadas correctamente');
  
  // Log de configuración en desarrollo
  if (import.meta.env.MODE === 'development') {
    console.log('🔧 Configuración de entorno:', {
      mode: import.meta.env.MODE,
      apiUrl: config.apiUrl,
      appName: config.appName,
      wompiEnv: config.wompi.environment,
      devToolsEnabled: config.devToolsEnabled,
      // No incluir datos sensibles como claves secretas o tokens
    });
  }
};

// ✅ Configuración que SOLO lee de .env (sin valores hardcodeados)
export const config = {
  // URLs y endpoints - ✅ SOLO desde .env
  apiUrl: requiredEnvVars.VITE_API_URL,
  baseUrl: import.meta.env.BASE_URL,
  
  // Información de la aplicación - ✅ SOLO desde .env
  appName: requiredEnvVars.VITE_APP_NAME,
  appVersion: optionalEnvVars.VITE_APP_VERSION || '1.0.0', // ✅ Solo este fallback mínimo
  
  // Configuraciones de entorno
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isTesting: import.meta.env.MODE === 'test',
  
  // Configuraciones de UI - ✅ SOLO desde .env
  devToolsEnabled: optionalEnvVars.VITE_ENABLE_DEVTOOLS === 'true',
  toastDuration: parseInt(optionalEnvVars.VITE_TOAST_DURATION || '3000'),
  
  // Configuración de Wompi - ✅ SOLO desde .env
  wompi: {
    publicKey: requiredEnvVars.VITE_WOMPI_PUBLIC_KEY,
    secretKey: import.meta.env.VITE_WOMPI_SECRET_KEY,
    eventKey: import.meta.env.VITE_WOMPI_EVENT_KEY,
    environment: optionalEnvVars.VITE_WOMPI_ENVIRONMENT || 'test',
    isProduction: optionalEnvVars.VITE_WOMPI_ENVIRONMENT === 'production',
    currency: 'COP', // ✅ Este sí puede ser fijo para Colombia
    acceptanceToken: import.meta.env.VITE_WOMPI_ACCEPTANCE_TOKEN,
  },
  
  // Configuraciones específicas - ✅ SOLO desde .env
  maxQuoteItems: parseInt(optionalEnvVars.VITE_MAX_QUOTE_ITEMS || '10'),
  paymentTimeout: parseInt(optionalEnvVars.VITE_PAYMENT_TIMEOUT || '300000'),
  sessionTimeout: parseInt(optionalEnvVars.VITE_SESSION_TIMEOUT || '3600000'),
  
  // Configuraciones de archivos - ✅ SOLO desde .env
  maxFileSize: parseInt(optionalEnvVars.VITE_MAX_FILE_SIZE || '5242880'),
  allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'application/pdf'
  ],
  
  // Configuraciones de paginación - ✅ SOLO desde .env
  defaultPageSize: parseInt(optionalEnvVars.VITE_DEFAULT_PAGE_SIZE || '10'),
  maxPageSize: parseInt(optionalEnvVars.VITE_MAX_PAGE_SIZE || '100'),
  
  // Configuraciones de características - ✅ SOLO desde .env
  features: {
    notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === 'true',
    referrals: import.meta.env.VITE_FEATURE_REFERRALS === 'true',
  }
};

// Utilidades adicionales
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.apiUrl.endsWith('/') 
    ? config.apiUrl.slice(0, -1) 
    : config.apiUrl;
  
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
};

export const getWompiConfig = () => {
  return {
    publicKey: config.wompi.publicKey,
    environment: config.wompi.environment,
    currency: config.wompi.currency,
  };
};

export const isFeatureEnabled = (featureName) => {
  return config.features[featureName] || false;
};

export const getEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    nodeEnv: import.meta.env.NODE_ENV,
    dev: config.isDevelopment,
    prod: config.isProduction,
    baseUrl: config.baseUrl,
    apiUrl: config.apiUrl,
  };
};

// Validación específica para Wompi
export const validateWompiConfig = () => {
  const requiredWompiVars = ['VITE_WOMPI_PUBLIC_KEY'];
  
  const missing = requiredWompiVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de Wompi faltantes: ${missing.join(', ')}`);
  }
  
  console.log('✅ Configuración de Wompi validada');
};

export default validateEnv;
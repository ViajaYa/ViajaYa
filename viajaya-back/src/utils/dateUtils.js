const { DateTime } = require('luxon');

// 🇨🇴 CONSTANTES PARA COLOMBIA
const COLOMBIA_TIMEZONE = 'America/Bogota';
const COLOMBIA_LOCALE = 'es-CO';

/**
 * 🇨🇴 Utilidades de fecha para Colombia - BACKEND
 * Todas las fechas se manejan en zona horaria de Colombia (UTC-5)
 */

// 📅 OBTENER FECHA ACTUAL EN COLOMBIA
const nowInColombia = () => {
  return DateTime.now().setZone(COLOMBIA_TIMEZONE);
};

// 📅 CREAR FECHA DESDE STRING EN COLOMBIA
const dateInColombia = (dateString) => {
  if (!dateString) return null;
  
  // Si ya es un objeto DateTime, convertirlo a Colombia
  if (dateString instanceof DateTime) {
    return dateString.setZone(COLOMBIA_TIMEZONE);
  }
  
  // Si es formato YYYY-MM-DD (input date), tratarlo como fecha local en Colombia
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return DateTime.fromISO(`${dateString}T00:00:00`, { zone: COLOMBIA_TIMEZONE });
  }
  
  // Si es ISO string con timezone, convertir a Colombia
  if (typeof dateString === 'string') {
    return DateTime.fromISO(dateString).setZone(COLOMBIA_TIMEZONE);
  }
  
  // Si es Date object
  if (dateString instanceof Date) {
    return DateTime.fromJSDate(dateString).setZone(COLOMBIA_TIMEZONE);
  }
  
  return null;
};

// 📅 FORMATEAR FECHA PARA MOSTRAR (DD/MM/AAAA)
const formatDateDisplay = (date, options = {}) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return '';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  return dt.toLocaleString(defaultOptions, { locale: COLOMBIA_LOCALE });
};

// 📅 FORMATEAR FECHA Y HORA COMPLETA
const formatDateTime = (date) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return '';
  
  return dt.toLocaleString(DateTime.DATETIME_SHORT, { locale: COLOMBIA_LOCALE });
};

// 📅 PARA DATABASE: GENERAR DATE OBJECT EN COLOMBIA
const toDatabase = (date) => {
  if (!date) return null;
  
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return null;
  
  // Retornar JavaScript Date object
  return dt.toJSDate();
};

// 📅 PARA FRONTEND: ENVIAR FECHA EN FORMATO ISO
const toFrontend = (date) => {
  if (!date) return null;
  
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return null;
  
  // Enviar en formato ISO desde la zona horaria de Colombia
  return dt.toISO();
};

// 📅 VALIDAR SI UNA FECHA ES VÁLIDA
const isValidDate = (date) => {
  if (!date) return false;
  const dt = dateInColombia(date);
  return dt && dt.isValid;
};

// 📅 CALCULAR DIFERENCIA EN DÍAS
const daysBetween = (startDate, endDate) => {
  const start = dateInColombia(startDate);
  const end = dateInColombia(endDate);
  
  if (!start || !end || !start.isValid || !end.isValid) return 0;
  
  return Math.ceil(end.diff(start, 'days').days);
};

// 📅 AGREGAR/QUITAR DÍAS
const addDays = (date, days) => {
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return null;
  
  return dt.plus({ days });
};

// 📅 OBTENER INICIO/FIN DE DÍA EN COLOMBIA
const startOfDay = (date) => {
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return null;
  
  return dt.startOf('day');
};

const endOfDay = (date) => {
  const dt = dateInColombia(date);
  if (!dt || !dt.isValid) return null;
  
  return dt.endOf('day');
};

// 📅 GENERAR FECHA DE VENCIMIENTO PARA CONTRATOS
const addDaysFromNow = (days) => {
  const now = nowInColombia();
  return now.plus({ days }).toJSDate();
};

// 📅 FORMATEO PARA DOCUMENTOS PDF
const formatForPDF = (date) => {
  if (!date) return 'Fecha no disponible';
  
  let dt = null;
  
  // ✅ CASO ESPECIAL: Si es una fecha ISO que termina en T00:00:00.000Z
  // Esto significa que es una fecha "solo fecha" almacenada como timestamp UTC
  // La tratamos como fecha local en Colombia para evitar desfase de días
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(date)) {
    // Extraer solo la parte de fecha (YYYY-MM-DD)
    const dateOnly = date.substring(0, 10);
    // Crear fecha local en Colombia sin conversión de timezone
    dt = DateTime.fromISO(`${dateOnly}T00:00:00`, { zone: COLOMBIA_TIMEZONE });
  } else {
    // Para otros formatos, usar el método normal
    dt = dateInColombia(date);
  }
  
  if (!dt || !dt.isValid) return 'Fecha no disponible';
  
  return dt.toLocaleString(
    { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    },
    { locale: COLOMBIA_LOCALE }
  );
};

// 📅 FORMATEO SIMPLE PARA DOCUMENTOS (DD/MM/YYYY)
const formatForPDFSimple = (date) => {
  if (!date) return 'Fecha no disponible';
  
  let dt = null;
  
  // ✅ CASO ESPECIAL: Si es una fecha ISO que termina en T00:00:00.000Z
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(date)) {
    const dateOnly = date.substring(0, 10);
    dt = DateTime.fromISO(`${dateOnly}T00:00:00`, { zone: COLOMBIA_TIMEZONE });
  } else {
    dt = dateInColombia(date);
  }
  
  if (!dt || !dt.isValid) return 'Fecha no disponible';
  
  return dt.toLocaleString({ day: '2-digit', month: '2-digit', year: 'numeric' }, { locale: COLOMBIA_LOCALE });
};

module.exports = {
  nowInColombia,
  dateInColombia,
  formatDateDisplay,
  formatDateTime,
  toDatabase,
  toFrontend,
  isValidDate,
  daysBetween,
  addDays,
  startOfDay,
  endOfDay,
  addDaysFromNow,
  formatForPDF,
  formatForPDFSimple,
  COLOMBIA_TIMEZONE,
  COLOMBIA_LOCALE
};

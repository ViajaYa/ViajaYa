import { DateTime } from 'luxon';

// 🇨🇴 CONSTANTES PARA COLOMBIA
const COLOMBIA_TIMEZONE = 'America/Bogota';
const COLOMBIA_LOCALE = 'es-CO';

/**
 * 🇨🇴 Utilidades de fecha para Colombia
 * Todas las fechas se manejan en zona horaria de Colombia (UTC-5)
 */

// 📅 OBTENER FECHA ACTUAL EN COLOMBIA
export const nowInColombia = () => {
  return DateTime.now().setZone(COLOMBIA_TIMEZONE);
};

// 📅 CREAR FECHA DESDE STRING EN COLOMBIA
export const dateInColombia = (dateString) => {
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
  return DateTime.fromISO(dateString).setZone(COLOMBIA_TIMEZONE);
};

// 📅 FORMATEAR FECHA PARA INPUT HTML (YYYY-MM-DD)
export const toDateInput = (date) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt.isValid) return '';
  
  // Formato YYYY-MM-DD para inputs de tipo date
  return dt.toISODate(); // Esto genera YYYY-MM-DD sin cambios de zona horaria
};

// 📅 FORMATEAR FECHA PARA MOSTRAR (DD/MM/AAAA)
export const formatDateDisplay = (date, options = {}) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt.isValid) return '';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  return dt.toLocaleString(defaultOptions, { locale: COLOMBIA_LOCALE });
};

// 📅 FORMATEAR FECHA Y HORA COMPLETA
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt.isValid) return '';
  
  return dt.toLocaleString(DateTime.DATETIME_SHORT, { locale: COLOMBIA_LOCALE });
};

// 📅 PARA BACKEND: ENVIAR FECHA EN FORMATO ISO
export const toBackend = (date) => {
  if (!date) return null;
  
  const dt = dateInColombia(date);
  if (!dt.isValid) return null;
  
  // Enviar en formato ISO pero desde la zona horaria de Colombia
  return dt.toISO();
};

// 📅 VALIDAR SI UNA FECHA ES VÁLIDA
export const isValidDate = (date) => {
  if (!date) return false;
  const dt = dateInColombia(date);
  return dt.isValid;
};

// 📅 CALCULAR DIFERENCIA EN DÍAS
export const daysBetween = (startDate, endDate) => {
  const start = dateInColombia(startDate);
  const end = dateInColombia(endDate);
  
  if (!start.isValid || !end.isValid) return 0;
  
  return Math.ceil(end.diff(start, 'days').days);
};

// 📅 AGREGAR/QUITAR DÍAS
export const addDays = (date, days) => {
  const dt = dateInColombia(date);
  if (!dt.isValid) return null;
  
  return dt.plus({ days });
};

// 📅 COMPARAR FECHAS
export const isAfter = (date1, date2) => {
  const dt1 = dateInColombia(date1);
  const dt2 = dateInColombia(date2);
  
  if (!dt1.isValid || !dt2.isValid) return false;
  
  return dt1 > dt2;
};

export const isBefore = (date1, date2) => {
  const dt1 = dateInColombia(date1);
  const dt2 = dateInColombia(date2);
  
  if (!dt1.isValid || !dt2.isValid) return false;
  
  return dt1 < dt2;
};

export const isSameDay = (date1, date2) => {
  const dt1 = dateInColombia(date1);
  const dt2 = dateInColombia(date2);
  
  if (!dt1.isValid || !dt2.isValid) return false;
  
  return dt1.hasSame(dt2, 'day');
};

// 📅 FORMATEO ESPECÍFICO PARA COLOMBIA
export const formatForContract = (date) => {
  if (!date) return '';
  
  const dt = dateInColombia(date);
  if (!dt.isValid) return '';
  
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

// 📅 OBTENER INICIO/FIN DE DÍA EN COLOMBIA
export const startOfDay = (date) => {
  const dt = dateInColombia(date);
  if (!dt.isValid) return null;
  
  return dt.startOf('day');
};

export const endOfDay = (date) => {
  const dt = dateInColombia(date);
  if (!dt.isValid) return null;
  
  return dt.endOf('day');
};

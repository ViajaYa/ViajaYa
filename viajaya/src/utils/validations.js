// ✅ Utilidades de validación para datos colombianos
// Archivo: src/utils/validations.js
import { DateTime } from 'luxon';

/**
 * Validaciones para teléfonos colombianos
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'El teléfono es requerido' };
  }

  // Limpiar el número (quitar espacios, guiones, paréntesis)
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Patrones para números colombianos
  const patterns = {
    // Celular: 3xx xxx xxxx (10 dígitos, inicia con 3)
    mobile: /^3\d{9}$/,
    // Fijo Bogotá: (601) xxx xxxx o 601 xxx xxxx
    bogotaLandline: /^601\d{7}$/,
    // Fijo otras ciudades: (60x) xxx xxxx donde x es código de área
    landline: /^60[1-9]\d{7}$/,
    // Con código país: +57 3xx xxx xxxx
    international: /^(\+57|57)?3\d{9}$/,
    // Con código país fijo: +57 601 xxx xxxx
    internationalLandline: /^(\+57|57)?60[1-9]\d{7}$/
  };

  // Verificar patrones
  if (patterns.mobile.test(cleanPhone)) {
    return { isValid: true, type: 'mobile', formatted: formatPhoneNumber(cleanPhone, 'mobile') };
  }
  
  if (patterns.bogotaLandline.test(cleanPhone)) {
    return { isValid: true, type: 'landline', formatted: formatPhoneNumber(cleanPhone, 'landline') };
  }
  
  if (patterns.landline.test(cleanPhone)) {
    return { isValid: true, type: 'landline', formatted: formatPhoneNumber(cleanPhone, 'landline') };
  }
  
  if (patterns.international.test(cleanPhone)) {
    const nationalNumber = cleanPhone.replace(/^(\+57|57)/, '');
    return { isValid: true, type: 'mobile', formatted: formatPhoneNumber(nationalNumber, 'mobile') };
  }
  
  if (patterns.internationalLandline.test(cleanPhone)) {
    const nationalNumber = cleanPhone.replace(/^(\+57|57)/, '');
    return { isValid: true, type: 'landline', formatted: formatPhoneNumber(nationalNumber, 'landline') };
  }

  return { 
    isValid: false, 
    message: 'Formato de teléfono inválido. Ejemplos válidos: 3001234567, 6011234567, +573001234567' 
  };
};

/**
 * Formatear número de teléfono colombiano
 */
export const formatPhoneNumber = (phone, type = 'mobile') => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  if (type === 'mobile' && cleanPhone.length === 10) {
    // 300 123 4567
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  if (type === 'landline' && cleanPhone.length === 10) {
    // (601) 123 4567
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  return phone;
};

/**
 * Validaciones para documentos de identidad colombianos
 */
export const validateDocument = (documentType, documentNumber) => {
  if (!documentType) {
    return { isValid: false, message: 'El tipo de documento es requerido' };
  }
  
  if (!documentNumber) {
    return { isValid: false, message: 'El número de documento es requerido' };
  }

  // Limpiar número (solo números)
  const cleanNumber = documentNumber.replace(/\D/g, '');
  
  const documentRules = {
    'CC': { // Cédula de Ciudadanía
      minLength: 6,
      maxLength: 10,
      name: 'Cédula de Ciudadanía'
    },
    'TI': { // Tarjeta de Identidad
      minLength: 10,
      maxLength: 11,
      name: 'Tarjeta de Identidad'
    },
    'CE': { // Cédula de Extranjería
      minLength: 6,
      maxLength: 10,
      name: 'Cédula de Extranjería'
    },
    'PA': { // Pasaporte
      minLength: 6,
      maxLength: 12,
      name: 'Pasaporte',
      allowLetters: true
    },
    'RC': { // Registro Civil
      minLength: 10,
      maxLength: 11,
      name: 'Registro Civil'
    },
    'MS': { // Menor sin identificación
      minLength: 0,
      maxLength: 0,
      name: 'Menor sin identificación',
      optional: true
    }
  };

  const rule = documentRules[documentType];
  if (!rule) {
    return { isValid: false, message: 'Tipo de documento no válido' };
  }

  // Para menores sin identificación
  if (rule.optional && (!cleanNumber || cleanNumber.length === 0)) {
    return { isValid: true, formatted: '' };
  }

  // Validar longitud
  if (cleanNumber.length < rule.minLength || cleanNumber.length > rule.maxLength) {
    return { 
      isValid: false, 
      message: `${rule.name} debe tener entre ${rule.minLength} y ${rule.maxLength} caracteres` 
    };
  }

  // Para pasaporte, permitir letras y números
  if (documentType === 'PA') {
    const passportPattern = /^[A-Za-z0-9]{6,12}$/;
    if (!passportPattern.test(documentNumber.replace(/\s/g, ''))) {
      return { 
        isValid: false, 
        message: 'El pasaporte debe contener solo letras y números (6-12 caracteres)' 
      };
    }
    return { isValid: true, formatted: documentNumber.toUpperCase().replace(/\s/g, '') };
  }

  // Para otros documentos, solo números
  if (!/^\d+$/.test(cleanNumber)) {
    return { 
      isValid: false, 
      message: `${rule.name} debe contener solo números` 
    };
  }

  // Validación adicional para Cédula de Ciudadanía (algoritmo de verificación básico)
  if (documentType === 'CC' && cleanNumber.length >= 6) {
    // Formatear con puntos para números largos
    const formatted = formatDocumentNumber(cleanNumber, documentType);
    return { isValid: true, formatted };
  }

  return { isValid: true, formatted: cleanNumber };
};

/**
 * Formatear número de documento
 */
export const formatDocumentNumber = (documentNumber, documentType) => {
  const cleanNumber = documentNumber.replace(/\D/g, '');
  
  if (documentType === 'CC' && cleanNumber.length >= 7) {
    // Formatear cédula con puntos: 12.345.678
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  if (documentType === 'PA') {
    return documentNumber.toUpperCase().replace(/\s/g, '');
  }
  
  return cleanNumber;
};

/**
 * Validación de email
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'El email es requerido' };
  }

  // Patrón de email más estricto
  const emailPattern = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(email)) {
    return { 
      isValid: false, 
      message: 'Formato de email inválido. Ejemplo: usuario@dominio.com' 
    };
  }

  // Validaciones adicionales
  if (email.length > 254) {
    return { isValid: false, message: 'El email es demasiado largo' };
  }

  if (email.includes('..')) {
    return { isValid: false, message: 'El email no puede contener puntos consecutivos' };
  }

  return { isValid: true, formatted: email.toLowerCase().trim() };
};

/**
 * Validación de nombres (solo letras, espacios y acentos)
 */
export const validateName = (name, fieldName = 'nombre') => {
  if (!name) {
    return { isValid: false, message: `El ${fieldName} es requerido` };
  }

  const cleanName = name.trim();
  
  if (cleanName.length < 2) {
    return { isValid: false, message: `El ${fieldName} debe tener al menos 2 caracteres` };
  }

  if (cleanName.length > 50) {
    return { isValid: false, message: `El ${fieldName} no puede tener más de 50 caracteres` };
  }

  // Permitir letras, espacios, acentos y algunos caracteres especiales comunes en nombres colombianos
  const namePattern = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'.-]+$/;
  
  if (!namePattern.test(cleanName)) {
    return { 
      isValid: false, 
      message: `El ${fieldName} solo puede contener letras, espacios y acentos` 
    };
  }

  // No debe empezar o terminar con espacio
  if (cleanName !== cleanName.trim()) {
    return { 
      isValid: false, 
      message: `El ${fieldName} no puede empezar o terminar con espacios` 
    };
  }

  return { isValid: true, formatted: cleanName };
};

/**
 * Validar edad según tipo de pasajero
 */
export const validateAge = (birthDate, passengerType = 'adulto') => {
  if (!birthDate) {
    return { isValid: false, message: 'La fecha de nacimiento es requerida' };
  }

  const birth = DateTime.fromISO(birthDate);
  const now = DateTime.now().setZone('America/Bogota');
  
  if (!birth.isValid) {
    return { isValid: false, message: 'Fecha de nacimiento inválida' };
  }

  if (birth > now) {
    return { isValid: false, message: 'La fecha de nacimiento no puede ser futura' };
  }

  const ageInYears = now.diff(birth, 'years').years;
  const ageInMonths = now.diff(birth, 'months').months;

  const ageRules = {
    'adulto': { minYears: 14, maxYears: 120 },
    'menor': { minYears: 2, maxYears: 13 },
    'infante': { minMonths: 0, maxMonths: 23 }
  };

  const rule = ageRules[passengerType];
  if (!rule) {
    return { isValid: false, message: 'Tipo de pasajero inválido' };
  }

  if (passengerType === 'infante') {
    if (ageInMonths < rule.minMonths || ageInMonths > rule.maxMonths) {
      return { 
        isValid: false, 
        message: `Los infantes deben tener entre ${rule.minMonths} y ${rule.maxMonths} meses` 
      };
    }
  } else {
    if (ageInYears < rule.minYears || ageInYears > rule.maxYears) {
      return { 
        isValid: false, 
        message: `Los ${passengerType}s deben tener entre ${rule.minYears} y ${rule.maxYears} años` 
      };
    }
  }

  return { 
    isValid: true, 
    age: passengerType === 'infante' ? Math.floor(ageInMonths) : Math.floor(ageInYears),
    unit: passengerType === 'infante' ? 'meses' : 'años'
  };
};

/**
 * Función helper para validar formulario completo
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  
  for (const field in rules) {
    const rule = rules[field];
    const value = formData[field];
    
    let validation;
    
    switch (rule.type) {
      case 'phone':
        validation = validatePhoneNumber(value);
        break;
      case 'document':
        validation = validateDocument(rule.documentType || formData.tipo_documento, value);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'name':
        validation = validateName(value, rule.fieldName || field);
        break;
      case 'age':
        validation = validateAge(value, rule.passengerType || 'adulto');
        break;
      default:
        continue;
    }
    
    if (!validation.isValid) {
      errors[field] = validation.message;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Obtener tipos de documento colombianos
 */
export const getDocumentTypes = () => [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro Civil' },
  { value: 'MS', label: 'Menor sin identificación' }
];

export default {
  validatePhoneNumber,
  formatPhoneNumber,
  validateDocument,
  formatDocumentNumber,
  validateEmail,
  validateName,
  validateAge,
  validateForm,
  getDocumentTypes
};

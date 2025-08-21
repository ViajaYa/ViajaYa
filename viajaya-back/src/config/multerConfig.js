const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'viajaya',
    // ✅ Agregar PDF a los formatos permitidos
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    // ✅ Configurar el tipo de recurso dinámicamente
    resource_type: (req, file) => {
      // Si es PDF, usar 'raw', si es imagen usar 'image'
      return file.mimetype === 'application/pdf' ? 'raw' : 'image';
    },
    // ✅ Opcional: Configurar transformaciones solo para imágenes
    transformation: (req, file) => {
      if (file.mimetype.startsWith('image/')) {
        return [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ];
      }
      return []; // No transformaciones para PDFs
    },
    // 🔑 CLAVE: Hacer archivos públicos
    access_mode: 'public'
  },
});

// ✅ Configurar filtros de archivo
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG y PDF'), false);
  }
};

// Configuración base para uploads generales
const upload = multer({ 
  storage,
  fileFilter,
  // ✅ Límite de tamaño de archivo (opcional)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

// Configuración específica para comprobantes de pago
const paymentProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'viajaya/comprobantes-pago',
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: (req, file) => {
      return file.mimetype === 'application/pdf' ? 'raw' : 'image';
    },
    transformation: (req, file) => {
      if (file.mimetype.startsWith('image/')) {
        return [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ];
      }
      return [];
    },
    // 🔑 CLAVE: Hacer archivos públicos
    access_mode: 'public'
  },
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

// ✅ NUEVA CONFIGURACIÓN: Para comprobantes de compras
const comprobantesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'viajaya/comprobantes-compras', // Carpeta específica para comprobantes de compra
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: (req, file) => {
      const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
      console.log(`🔧 Setting resource_type for ${file.originalname}:`, resourceType);
      return resourceType;
    },
    transformation: (req, file) => {
      if (file.mimetype.startsWith('image/')) {
        return [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ];
      }
      return []; // No transformaciones para PDFs
    },
    // ✅ AGREGAR: Configuración adicional para PDFs
    format: (req, file) => {
      if (file.mimetype === 'application/pdf') {
        return 'pdf'; // Forzar formato PDF
      }
      return undefined; // Auto-detect para imágenes
    },
    // ✅ AGREGAR: Public ID personalizado para mejor organización
    public_id: (req, file) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
      return `comprobante_${timestamp}_${safeName}`;
    },
    // 🔑 CLAVE: Hacer archivos públicos para evitar error 401
    access_mode: 'public',
    // ✅ AGREGAR: Headers adicionales para PDFs
    use_filename: true,
    unique_filename: false
  },
});

const uploadComprobante = multer({
  storage: comprobantesStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

// ✅ ACTUALIZAR: Exportar todas las configuraciones
module.exports = {
  upload,
  uploadPaymentProof,
  uploadComprobante  // ✅ AGREGAR ESTA NUEVA EXPORTACIÓN
};

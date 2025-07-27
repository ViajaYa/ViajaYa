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
    }
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
    }
  },
});

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

// Exportar ambas configuraciones
module.exports = {
  upload,
  uploadPaymentProof
};

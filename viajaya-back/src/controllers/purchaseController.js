const { Purchase, ContractItem, Contract, Quote, User, sequelize } = require('../db');
const { Op } = require('sequelize');

// ✅ MANTENER: Crear una compra para un item (función existente mejorada)
const createPurchase = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      proveedor,
      costo,
      fecha_compra,
      fecha_vencimiento_pago,
      comprobante_url,
      estado_pago,
      observaciones,
      tipo_comprobante,
      moneda
    } = req.body;

    // Verifica que el item existe - ✅ CORREGIR: Usar ContractItem en lugar de ContractItems
    const item = await ContractItem.findByPk(itemId);
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });

    // ✅ AGREGAR: Calcular diferencia de precio
    const precioCotizado = parseFloat(item.precio_total || 0);
    const precioReal = parseFloat(costo || 0);
    const diferenciaPrecio = precioReal - precioCotizado;

    const purchase = await Purchase.create({
      contract_item_id: itemId,
      proveedor,
      costo: precioReal,
      fecha_compra,
      fecha_vencimiento_pago,
      comprobante_url,
      estado_pago: estado_pago || 'pendiente',
      observaciones,
      tipo_comprobante: tipo_comprobante || 'factura',
      moneda: moneda || 'COP',
      diferencia_precio: diferenciaPrecio
    });

    // ✅ AGREGAR: Actualizar status del item
    await item.update({
      status: 'comprado_pendiente',
      costo_proveedor: precioReal
    });

    res.status(201).json({ 
      success: true,
      message: 'Compra creada exitosamente', 
      purchase: await Purchase.findByPk(purchase.id),
      price_difference: {
        cotizado: precioCotizado,
        real: precioReal,
        diferencia: diferenciaPrecio,
        tipo: diferenciaPrecio >= 0 ? 'sobrecosto' : 'ahorro'
      }
    });
  } catch (error) {
    console.error('Error creando compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creando compra', 
      error: error.message 
    });
  }
};

// ✅ MANTENER: Listar compras de un item (función existente)
const getPurchasesByItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const purchases = await Purchase.findAll({ 
      where: { contract_item_id: itemId },
      order: [['fecha_compra', 'DESC']]
    });
    res.json({ 
      success: true,
      purchases 
    });
  } catch (error) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo compras', 
      error: error.message 
    });
  }
};

// ✅ MANTENER: Actualizar una compra (función existente)
const updatePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) return res.status(404).json({ 
      success: false,
      message: 'Compra no encontrada' 
    });

    await purchase.update(req.body);
    res.json({ 
      success: true,
      message: 'Compra actualizada', 
      purchase: await Purchase.findByPk(purchaseId)
    });
  } catch (error) {
    console.error('Error actualizando compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando compra', 
      error: error.message 
    });
  }
};

// ✅ MANTENER: Eliminar una compra (función existente)
const deletePurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) return res.status(404).json({ 
      success: false,
      message: 'Compra no encontrada' 
    });

    await purchase.destroy();
    res.json({ 
      success: true,
      message: 'Compra eliminada' 
    });
  } catch (error) {
    console.error('Error eliminando compra:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error eliminando compra', 
      error: error.message 
    });
  }
};

// ✅ NUEVA: Obtener items de contrato con compras para el dashboard
const getContractItemsWithPurchases = async (req, res) => {
  try {
    const { contractId } = req.params;
    console.log('🔍 Obteniendo items con compras para contrato:', contractId);

    const items = await ContractItem.findAll({
      where: { contract_id: contractId },
      include: [
        {
          model: Purchase,
          as: 'Purchases',
          required: false,
          attributes: [
            'id', 'costo', 'fecha_compra', 'fecha_vencimiento_pago',
            'comprobante_url', 'cloudinary_public_id', 'tipo_comprobante', 
            'estado_pago', 'diferencia_precio', 'moneda', 'observaciones',
            'proveedor', 'createdAt'
          ]
        }
      ],
      order: [
        ['tipo', 'ASC'],
        ['descripcion', 'ASC'],
        [{ model: Purchase, as: 'Purchases' }, 'fecha_compra', 'DESC']
      ]
    });

    // ✅ CALCULAR: Fechas límite automáticas y estados
    const itemsWithDeadlines = items.map(item => {
      const itemData = item.toJSON();
      
      // Si es ticket y no tiene fecha límite, sugerir 24 horas
      if (item.tipo === 'tickets' && !item.fecha_limite_compra) {
        const suggestedDeadline = new Date();
        suggestedDeadline.setHours(suggestedDeadline.getHours() + 24);
        itemData.fecha_limite_sugerida = suggestedDeadline;
        itemData.is_suggested_deadline = true;
      }

      // Calcular estado de alerta
      itemData.alert_status = calculateAlertStatus(item);

      return itemData;
    });

    // ✅ CALCULAR: Estadísticas del contrato
    const summary = calculateContractSummary(items);

    res.json({
      success: true,
      items: itemsWithDeadlines,
      summary
    });

  } catch (error) {
    console.error('❌ Error obteniendo items con compras:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener items del contrato', 
      error: error.message 
    });
  }
};

// ✅ NUEVA: Subir comprobante con Cloudinary
const uploadPurchaseReceipt = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      proveedor,
      costo,
      fecha_compra,
      fecha_vencimiento_pago,
      tipo_comprobante,
      moneda,
      observaciones
    } = req.body;

    console.log('📎 Subiendo comprobante para item:', itemId);
    console.log('📎 Datos recibidos:', {
      proveedor,
      costo,
      fecha_compra,
      fecha_vencimiento_pago,
      tipo_comprobante,
      moneda,
      observaciones
    });

    // ✅ VALIDAR Y CONVERTIR FECHAS
    let fechaCompraFinal = fecha_compra;
    let fechaVencimientoFinal = fecha_vencimiento_pago;

    // Validar fecha_compra
    if (fecha_compra) {
      const fechaCompraDate = new Date(fecha_compra);
      if (isNaN(fechaCompraDate.getTime())) {
        console.warn('⚠️ fecha_compra inválida, usando fecha actual');
        fechaCompraFinal = new Date();
      } else {
        fechaCompraFinal = fechaCompraDate;
      }
    } else {
      fechaCompraFinal = new Date();
    }

    // Validar fecha_vencimiento_pago
    if (fecha_vencimiento_pago) {
      const fechaVencimientoDate = new Date(fecha_vencimiento_pago);
      if (isNaN(fechaVencimientoDate.getTime())) {
        console.warn('⚠️ fecha_vencimiento_pago inválida, usando null');
        fechaVencimientoFinal = null;
      } else {
        fechaVencimientoFinal = fechaVencimientoDate;
      }
    } else {
      fechaVencimientoFinal = null;
    }

    console.log('📅 Fechas procesadas:', {
      fechaCompraFinal,
      fechaVencimientoFinal
    });
    
    // 🐛 DEBUG DETALLADO: Analizar el archivo de Cloudinary
    if (req.file) {
      console.log('🔍 Cloudinary File Details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        public_id: req.file.public_id,
        filename: req.file.filename,
        format: req.file.format,
        resource_type: req.file.resource_type,
        secure_url: req.file.secure_url
      });
    }

    // Verificar que se haya subido archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'El comprobante es obligatorio'
      });
    }

    // Verificar que el item existe
    const item = await ContractItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // ✅ CALCULAR: Diferencia de precio
    const precioCotizado = parseFloat(item.precio_total || 0);
    const precioReal = parseFloat(costo || 0);
    const diferenciaPrecio = precioReal - precioCotizado;

    // ✅ MEJORAR: URL del comprobante con mejor manejo
    const comprobanteUrl = req.file.secure_url || req.file.path;
    const publicId = req.file.public_id || req.file.filename;
    
    // 🔑 GENERAR URL PÚBLICA para archivos privados
    let finalUrl = comprobanteUrl;
    if (req.file.resource_type === 'raw' && req.file.format === 'pdf') {
      try {
        // Generar URL firmada con acceso público por 7 días
        const cloudinary = require('../config/cloudinaryConfig');
        finalUrl = cloudinary.utils.private_download_url(
          publicId, 
          'pdf',
          {
            resource_type: 'raw',
            expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
          }
        );
        console.log('� Generated signed URL for PDF:', finalUrl);
      } catch (error) {
        console.log('⚠️ Could not generate signed URL, using original:', error.message);
        finalUrl = comprobanteUrl;
      }
    }
    
    console.log('�💾 Saving purchase with:', {
      comprobanteUrl: finalUrl,
      publicId,
      resourceType: req.file.resource_type,
      format: req.file.format
    });

    // Crear la compra
    const purchase = await Purchase.create({
      contract_item_id: itemId,
      proveedor,
      costo: precioReal,
      fecha_compra: fechaCompraFinal,
      fecha_vencimiento_pago: fechaVencimientoFinal,
      comprobante_url: comprobanteUrl, // Usar URL original
      cloudinary_public_id: publicId,
      tipo_comprobante: tipo_comprobante || 'factura',
      moneda: moneda || 'COP',
      diferencia_precio: diferenciaPrecio,
      estado_pago: 'pendiente',
      observaciones
    });

    // ✅ ACTUALIZAR: Status del item
    await item.update({
      status: 'comprado_pendiente',
      costo_proveedor: precioReal
    });

    console.log('✅ Comprobante subido exitosamente:', purchase.id);

    res.json({
      success: true,
      message: 'Comprobante subido exitosamente',
      purchase: await Purchase.findByPk(purchase.id),
      price_difference: {
        cotizado: precioCotizado,
        real: precioReal,
        diferencia: diferenciaPrecio,
        tipo: diferenciaPrecio >= 0 ? 'sobrecosto' : 'ahorro'
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir comprobante',
      error: error.message
    });
  }
};

// ✅ NUEVA: Actualizar fecha límite de compra
const updateItemDeadline = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { fecha_limite_compra } = req.body;

    console.log('📅 Actualizando fecha límite para item:', itemId);

    const item = await ContractItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    await item.update({ fecha_limite_compra });

    res.json({
      success: true,
      message: 'Fecha límite actualizada',
      item: await ContractItem.findByPk(itemId)
    });

  } catch (error) {
    console.error('❌ Error actualizando fecha límite:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar fecha límite',
      error: error.message
    });
  }
};

// ✅ NUEVA: Marcar pago a proveedor como completado
const markPaymentCompleted = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { observaciones } = req.body;

    console.log('💳 Marcando pago completado para compra:', purchaseId);

    const purchase = await Purchase.findByPk(purchaseId, {
      include: [
        {
          model: ContractItem,
          as: 'ContractItem'
        }
      ]
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Actualizar compra y item
    await purchase.update({
      estado_pago: 'pagado',
      observaciones: observaciones || purchase.observaciones
    });

    await purchase.ContractItem.update({
      status: 'comprado_pagado'
    });

    res.json({
      success: true,
      message: 'Pago marcado como completado',
      purchase: await Purchase.findByPk(purchaseId, {
        include: [{ model: ContractItem, as: 'ContractItem' }]
      })
    });

  } catch (error) {
    console.error('❌ Error marcando pago completado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar pago como completado',
      error: error.message
    });
  }
};

// ✅ NUEVA: Obtener estadísticas de compras del contrato
const getContractPurchaseStats = async (req, res) => {
  try {
    const { contractId } = req.params;

    console.log('📊 Obteniendo estadísticas para contrato:', contractId);

    const items = await ContractItem.findAll({
      where: { contract_id: contractId },
      include: [
        {
          model: Purchase,
          as: 'Purchases',
          required: false
        }
      ]
    });

    // Agrupar estadísticas por tipo y status
    const statsByType = items.reduce((acc, item) => {
      const tipo = item.tipo;
      if (!acc[tipo]) {
        acc[tipo] = {
          total: 0,
          pendiente_compra: 0,
          comprado_pendiente: 0,
          comprado_pagado: 0,
          vencido: 0,
          total_cotizado: 0,
          total_comprado: 0
        };
      }

      acc[tipo].total++;
      acc[tipo][item.status]++;
      acc[tipo].total_cotizado += parseFloat(item.precio_total || 0);
      
      if (item.Purchases && item.Purchases.length > 0) {
        acc[tipo].total_comprado += parseFloat(item.Purchases[0].costo || 0);
      }

      return acc;
    }, {});

    res.json({
      success: true,
      stats: statsByType,
      summary: calculateContractSummary(items)
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// ✅ FUNCIÓN AUXILIAR: Calcular estado de alerta
const calculateAlertStatus = (item) => {
  if (!item.requiere_compra) return 'no-required';
  if (item.status === 'comprado_pagado') return 'completed';
  if (item.status === 'vencido') return 'expired';
  
  if (item.fecha_limite_compra) {
    const now = new Date();
    const deadline = new Date(item.fecha_limite_compra);
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'expired';
    if (diffHours < 24) return 'critical';
    if (diffHours < 72) return 'warning';
    return 'normal';
  }
  
  return 'no-deadline';
};

// ✅ FUNCIÓN AUXILIAR: Calcular resumen del contrato
const calculateContractSummary = (items) => {
  return items.reduce((acc, item) => {
    if (item.requiere_compra !== false) {
      acc.total++;
      const status = calculateAlertStatus(item);
      
      switch (status) {
        case 'completed':
          acc.completed++;
          break;
        case 'expired':
          acc.expired++;
          break;
        case 'critical':
          acc.critical++;
          break;
        case 'warning':
          acc.warning++;
          break;
        default:
          acc.pending++;
      }
      
      // Cálculos de precio
      acc.totalCotizado += parseFloat(item.precio_total || 0);
      if (item.Purchases && item.Purchases.length > 0) {
        acc.totalComprado += parseFloat(item.Purchases[0].costo || 0);
      }
    }
    
    return acc;
  }, {
    total: 0,
    completed: 0,
    pending: 0,
    expired: 0,
    critical: 0,
    warning: 0,
    totalCotizado: 0,
    totalComprado: 0
  });
};

// 🔧 NUEVO: Proxy para servir archivos PDF con headers correctos
const servePDFFile = async (req, res) => {
  try {
    const { public_id } = req.params;
    
    console.log('� servePDFFile called with params:', req.params);
    console.log('�📄 Serving PDF file:', public_id);
    console.log('🔗 Full request URL:', req.originalUrl);
    
    // Decodificar el public_id si viene codificado
    const decodedPublicId = decodeURIComponent(public_id);
    console.log('🔓 Decoded public_id:', decodedPublicId);
    
    // 🔧 GENERAR URL DE CLOUDINARY - SIMPLIFICADO
    const cloudinary = require('../config/cloudinaryConfig');
    
    // Construir URL manualmente usando la configuración de cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = `https://res.cloudinary.com/${cloudName}/raw/upload/v1/${decodedPublicId}`;
    
    console.log('📄 Cloudinary URL:', url);
    
    // Hacer request del archivo desde Cloudinary usando axios
    const axios = require('axios');
    const response = await axios.get(url, {
      responseType: 'stream', // Importante: usar stream para archivos binarios
      timeout: 30000 // 30 segundos timeout
    });
    
    console.log('✅ Cloudinary response OK:', response.status);
    console.log('📋 Response headers:', response.headers);
    
    // 🔧 HEADERS OPTIMIZADOS PARA VISUALIZACIÓN EN IFRAME
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Remover X-Frame-Options para permitir iframe desde cualquier origen
    // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    console.log('📤 Setting response headers for PDF viewing in iframe');
    
    // Hacer stream del archivo
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ Error serving PDF:', error.message);
    console.error('❌ Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en Cloudinary',
        public_id: req.params.public_id,
        decoded_public_id: decodeURIComponent(req.params.public_id)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al servir el archivo',
      error: error.message
    });
  }
};

module.exports = {
  // ✅ FUNCIONES EXISTENTES
  createPurchase,
  getPurchasesByItem,
  updatePurchase,
  deletePurchase,
  
  // ✅ NUEVAS FUNCIONES PARA EL DASHBOARD
  getContractItemsWithPurchases,
  uploadPurchaseReceipt,
  updateItemDeadline,
  markPaymentCompleted,
  getContractPurchaseStats,
  
  // 🔧 PROXY PARA SERVIR PDFs
  servePDFFile
};
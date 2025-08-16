const { Payment, Purchase, Contract, ContractItem, Quote, User, conn: sequelize } = require('../db');
const { Op } = require('sequelize');

const financialController = {
  
  // 📊 RESUMEN FINANCIERO GENERAL
  getFinancialSummary: async (req, res) => {
    try {
      const { start_date, end_date, contract_id } = req.query;
      
      console.log('📊 Obteniendo resumen financiero:', { start_date, end_date, contract_id });
      
      // ✅ CONSTRUIR FILTROS DE FECHA
      const dateFilter = {};
      if (start_date) dateFilter[Op.gte] = new Date(start_date);
      if (end_date) dateFilter[Op.lte] = new Date(end_date);
      
      // ✅ FILTROS PARA PAGOS
      const paymentFilters = {};
      if (Object.keys(dateFilter).length > 0) {
        paymentFilters.fecha_pago = dateFilter;
      }
      if (contract_id) {
        paymentFilters.contract_id = contract_id;
      }
      
      // ✅ FILTROS PARA COMPRAS
      const purchaseFilters = {};
      if (Object.keys(dateFilter).length > 0) {
        purchaseFilters.fecha_compra = dateFilter;
      }
      
      // ✅ OBTENER PAGOS TOTALES
      const paymentsData = await Payment.findAll({
        where: paymentFilters,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('monto')), 'total_ingresos'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_pagos']
        ],
        raw: true
      });
      
      // ✅ OBTENER COMPRAS TOTALES
      let purchasesData;
      if (contract_id) {
        // Si hay filtro por contrato, necesitamos unir con contract_items
        purchasesData = await Purchase.findAll({
          include: [
            {
              model: ContractItem,
              as: 'ContractItem',
              required: true,
              where: {
                contract_id: contract_id
              }
            }
          ],
          where: Object.keys(dateFilter).length > 0 ? { fecha_compra: dateFilter } : {},
          attributes: [
            [sequelize.fn('SUM', sequelize.col('costo')), 'total_gastos'],
            [sequelize.fn('COUNT', sequelize.col('purchase.id')), 'total_compras'],
            [sequelize.fn('SUM', sequelize.col('diferencia_precio')), 'diferencia_total']
          ],
          raw: true
        });
      } else {
        purchasesData = await Purchase.findAll({
          where: purchaseFilters,
          attributes: [
            [sequelize.fn('SUM', sequelize.col('costo')), 'total_gastos'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_compras'],
            [sequelize.fn('SUM', sequelize.col('diferencia_precio')), 'diferencia_total']
          ],
          raw: true
        });
      }
      
      // ✅ CALCULAR MÉTRICAS
      const totalIngresos = parseFloat(paymentsData[0]?.total_ingresos || 0);
      const totalGastos = parseFloat(purchasesData[0]?.total_gastos || 0);
      const diferenciaPrecio = parseFloat(purchasesData[0]?.diferencia_total || 0);
      const gananciaOperacional = totalIngresos - totalGastos;
      const gananciaConDiferencia = gananciaOperacional + diferenciaPrecio;
      
      // ✅ OBTENER DATOS POR MES PARA GRÁFICOS
      const monthlyPayments = await Payment.findAll({
        where: paymentFilters,
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago')), 'mes'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'ingresos'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_pagos']
        ],
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_pago')), 'ASC']],
        raw: true
      });

      // ✅ OBTENER GASTOS POR MES PARA GRÁFICOS
      let monthlyPurchases;
      if (contract_id) {
        monthlyPurchases = await Purchase.findAll({
          include: [
            {
              model: ContractItem,
              as: 'ContractItem',
              required: true,
              where: {
                contract_id: contract_id
              }
            }
          ],
          where: Object.keys(dateFilter).length > 0 ? { fecha_compra: dateFilter } : {},
          attributes: [
            [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra')), 'mes'],
            [sequelize.fn('SUM', sequelize.col('costo')), 'gastos'],
            [sequelize.fn('COUNT', sequelize.col('purchase.id')), 'cantidad_compras']
          ],
          group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra'))],
          order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra')), 'ASC']],
          raw: true
        });
      } else {
        monthlyPurchases = await Purchase.findAll({
          where: purchaseFilters,
          attributes: [
            [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra')), 'mes'],
            [sequelize.fn('SUM', sequelize.col('costo')), 'gastos'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad_compras']
          ],
          group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra'))],
          order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_compra')), 'ASC']],
          raw: true
        });
      }

      // ✅ COMBINAR DATOS MENSUALES
      const monthsMap = new Map();
      
      // Agregar ingresos por mes
      monthlyPayments.forEach(payment => {
        const month = payment.mes;
        monthsMap.set(month, {
          mes: month,
          ingresos: parseFloat(payment.ingresos || 0),
          gastos: 0,
          cantidad_pagos: parseInt(payment.cantidad_pagos || 0),
          cantidad_compras: 0
        });
      });

      // Agregar gastos por mes
      monthlyPurchases.forEach(purchase => {
        const month = purchase.mes;
        if (monthsMap.has(month)) {
          monthsMap.get(month).gastos = parseFloat(purchase.gastos || 0);
          monthsMap.get(month).cantidad_compras = parseInt(purchase.cantidad_compras || 0);
        } else {
          monthsMap.set(month, {
            mes: month,
            ingresos: 0,
            gastos: parseFloat(purchase.gastos || 0),
            cantidad_pagos: 0,
            cantidad_compras: parseInt(purchase.cantidad_compras || 0)
          });
        }
      });

      // Convertir a array y ordenar
      const monthlyData = Array.from(monthsMap.values()).sort((a, b) => new Date(a.mes) - new Date(b.mes));
      
      const summary = {
        periodo: {
          inicio: start_date || 'Todos los registros',
          fin: end_date || 'Hasta la fecha'
        },
        contrato_filtrado: contract_id || null,
        metricas: {
          total_ingresos: totalIngresos,
          total_gastos: totalGastos,
          ganancia_operacional: gananciaOperacional,
          diferencia_precios: diferenciaPrecio,
          ganancia_neta: gananciaConDiferencia,
          margen_ganancia: totalIngresos > 0 ? ((gananciaConDiferencia / totalIngresos) * 100).toFixed(2) : 0
        },
        contadores: {
          total_pagos: parseInt(paymentsData[0]?.total_pagos || 0),
          total_compras: parseInt(purchasesData[0]?.total_compras || 0)
        },
        datos_mensuales: monthlyData.map(item => ({
          mes: item.mes,
          ingresos: parseFloat(item.ingresos || 0),
          gastos: parseFloat(item.gastos || 0),
          cantidad_pagos: parseInt(item.cantidad_pagos || 0),
          cantidad_compras: parseInt(item.cantidad_compras || 0)
        }))
      };
      
      console.log('✅ Resumen financiero calculado:', summary.metricas);
      
      res.json({
        success: true,
        summary
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo resumen financiero:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen financiero',
        error: error.message
      });
    }
  },

  // 💰 LISTADO DE PAGOS CON FILTROS
  getPaymentsList: async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        contract_id, 
        page = 1, 
        limit = 20, 
        status,
        tipo_pago 
      } = req.query;
      
      console.log('💰 Obteniendo lista de pagos:', { 
        start_date, end_date, contract_id, page, limit 
      });
      
      // ✅ CONSTRUIR FILTROS
      const filters = {};
      
      if (start_date || end_date) {
        filters.fecha_pago = {};
        if (start_date) filters.fecha_pago[Op.gte] = new Date(start_date);
        if (end_date) filters.fecha_pago[Op.lte] = new Date(end_date);
      }
      
      if (contract_id) filters.contract_id = contract_id;
      if (status) filters.status = status;
      if (tipo_pago) filters.tipo_pago = tipo_pago;
      
      const offset = (page - 1) * limit;
      
      const payments = await Payment.findAndCountAll({
        where: filters,
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['id', 'contract_number'],
            include: [
              {
                model: User,
                as: 'Cliente',
                attributes: ['name', 'email']
              },
              {
                model: Quote,
                as: 'Quote',
                attributes: ['quote_number', 'nombre_cliente', 'destino']
              }
            ]
          }
        ],
        order: [['fecha_pago', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // 🗂️ MAPEAR DATOS PARA EL FRONTEND
      const mappedPayments = payments.rows.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.monto || 0),
        status: payment.status === 'verified' ? 'confirmado' : 
                payment.status === 'pending' ? 'pendiente' : 
                payment.status === 'rejected' ? 'rechazado' : 'en_revision',
        paymentMethod: payment.tipo_pago || 'No especificado',
        paymentType: 'regular', // Se puede expandir según sea necesario
        installmentNumber: null, // Se puede agregar si hay lógica de cuotas
        description: payment.referencia_pago || 'Pago de contrato',
        notes: payment.observaciones || null,
        receiptUrl: payment.comprobante_url,
        paymentDate: payment.fecha_pago,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        Contract: payment.Contract ? {
          contractNumber: payment.Contract.contract_number,
          totalPrice: parseFloat(payment.Contract.Quote?.precio_total || 0),
          User: {
            name: payment.Contract.Cliente?.name || payment.Contract.Quote?.nombre_cliente || 'No especificado',
            email: payment.Contract.Cliente?.email || 'No disponible'
          }
        } : null
      }));
      
      res.json({
        success: true,
        payments: mappedPayments,
        pagination: {
          total: payments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(payments.count / limit)
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo lista de pagos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de pagos',
        error: error.message
      });
    }
  },

  // 🛒 LISTADO DE COMPRAS CON FILTROS
  getPurchasesList: async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        contract_id, 
        page = 1, 
        limit = 20,
        estado_pago 
      } = req.query;
      
      console.log('🛒 Obteniendo lista de compras:', { 
        start_date, end_date, contract_id, page, limit 
      });
      
      // ✅ CONSTRUIR FILTROS
      const filters = {};
      
      if (start_date || end_date) {
        filters.fecha_compra = {};
        if (start_date) filters.fecha_compra[Op.gte] = new Date(start_date);
        if (end_date) filters.fecha_compra[Op.lte] = new Date(end_date);
      }
      
      if (estado_pago) filters.estado_pago = estado_pago;
      
      const includeOptions = [
        {
          model: ContractItem,
          as: 'ContractItem',
          attributes: ['id', 'tipo', 'descripcion', 'cantidad', 'precio_unitario'],
          include: [
            {
              model: Contract,
              as: 'Contract',
              attributes: ['id', 'contract_number'],
              include: [
                {
                  model: Quote,
                  as: 'Quote',
                  attributes: ['quote_number', 'nombre_cliente', 'destino']
                }
              ]
            }
          ]
        }
      ];
      
      // ✅ FILTRO POR CONTRATO (requiere join)
      if (contract_id) {
        includeOptions[0].include[0].where = { id: contract_id };
        includeOptions[0].required = true;
        includeOptions[0].include[0].required = true;
      }
      
      const offset = (page - 1) * limit;
      
      const purchases = await Purchase.findAndCountAll({
        where: filters,
        include: includeOptions,
        order: [['fecha_compra', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // 🗂️ MAPEAR DATOS PARA EL FRONTEND
      const mappedPurchases = purchases.rows.map(purchase => ({
        id: purchase.id,
        amount: parseFloat(purchase.costo || 0),
        status: purchase.estado_pago || 'pendiente',
        category: purchase.ContractItem?.tipo || 'otros',
        supplier: purchase.proveedor || 'No especificado',
        description: purchase.ContractItem?.descripcion || 'Sin descripción',
        paymentMethod: purchase.tipo_comprobante || 'No especificado',
        notes: purchase.observaciones,
        receiptUrl: purchase.comprobante_url,
        purchaseDate: purchase.fecha_compra,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        Contract: purchase.ContractItem?.Contract ? {
          contractNumber: purchase.ContractItem.Contract.contract_number,
          totalPrice: parseFloat(purchase.ContractItem.Contract.Quote?.precio_total || 0),
          User: {
            name: purchase.ContractItem.Contract.Quote?.nombre_cliente || 'No especificado',
            email: 'No disponible' // Este campo no está en Quote, podría agregarse después
          }
        } : null
      }));
      
      res.json({
        success: true,
        purchases: mappedPurchases,
        pagination: {
          total: purchases.count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(purchases.count / limit)
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo lista de compras:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de compras',
        error: error.message
      });
    }
  },

  // 📈 ANÁLISIS DE GANANCIAS POR CONTRATO
  getProfitByContract: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      
      console.log('📈 Obteniendo ganancias por contrato:', { start_date, end_date });
      
      // ✅ CONSTRUIR FILTROS DE FECHA
      const dateFilter = {};
      if (start_date) dateFilter[Op.gte] = new Date(start_date);
      if (end_date) dateFilter[Op.lte] = new Date(end_date);
      
      // ✅ OBTENER CONTRATOS CON SUS PAGOS Y COMPRAS
      const contracts = await Contract.findAll({
        include: [
          {
            model: Quote,
            as: 'Quote',
            attributes: ['quote_number', 'nombre_cliente', 'destino', 'precio_total']
          },
          {
            model: Payment,
            as: 'Payments',
            where: Object.keys(dateFilter).length > 0 ? { fecha_pago: dateFilter } : {},
            required: false,
            attributes: ['id', 'monto', 'fecha_pago']
          },
          {
            model: ContractItem,
            as: 'ContractItems',
            required: false,
            include: [
              {
                model: Purchase,
                as: 'Purchases',
                where: Object.keys(dateFilter).length > 0 ? { fecha_compra: dateFilter } : {},
                required: false,
                attributes: ['id', 'costo', 'diferencia_precio', 'fecha_compra']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // ✅ CALCULAR GANANCIAS POR CONTRATO
      const contractProfits = contracts.map(contract => {
        const totalPagos = contract.Payments?.reduce((sum, payment) => 
          sum + parseFloat(payment.monto || 0), 0
        ) || 0;
        
        let totalCompras = 0;
        let diferenciasPrecios = 0;
        
        contract.ContractItems?.forEach(item => {
          item.Purchases?.forEach(purchase => {
            totalCompras += parseFloat(purchase.costo || 0);
            diferenciasPrecios += parseFloat(purchase.diferencia_precio || 0);
          });
        });
        
        const gananciaOperacional = totalPagos - totalCompras;
        const gananciaNeta = gananciaOperacional + diferenciasPrecios;
        
        return {
          contrato: {
            id: contract.id,
            numero: contract.contract_number,
            cliente: contract.Quote?.nombre_cliente || 'N/A',
            destino: contract.Quote?.destino || 'N/A',
            precio_total: parseFloat(contract.Quote?.precio_total || 0)
          },
          financiero: {
            total_pagos: totalPagos,
            total_compras: totalCompras,
            diferencia_precios: diferenciasPrecios,
            ganancia_operacional: gananciaOperacional,
            ganancia_neta: gananciaNeta,
            margen_ganancia: totalPagos > 0 ? ((gananciaNeta / totalPagos) * 100).toFixed(2) : 0
          },
          cantidad_transacciones: {
            pagos: contract.Payments?.length || 0,
            compras: contract.ContractItems?.reduce((sum, item) => 
              sum + (item.Purchases?.length || 0), 0
            ) || 0
          }
        };
      }).filter(item => 
        // Solo incluir contratos con transacciones en el período
        item.cantidad_transacciones.pagos > 0 || item.cantidad_transacciones.compras > 0
      );
      
      res.json({
        success: true,
        contract_profits: contractProfits,
        totals: {
          contratos_analizados: contractProfits.length,
          ganancia_total: contractProfits.reduce((sum, item) => 
            sum + item.financiero.ganancia_neta, 0
          ),
          ingresos_totales: contractProfits.reduce((sum, item) => 
            sum + item.financiero.total_pagos, 0
          ),
          gastos_totales: contractProfits.reduce((sum, item) => 
            sum + item.financiero.total_compras, 0
          )
        }
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo ganancias por contrato:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener ganancias por contrato',
        error: error.message
      });
    }
  }
};

module.exports = financialController;

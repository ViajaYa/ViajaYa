// Test para validar el sistema de cuotas
const express = require('express');
const { conn: sequelize, Purchase, PurchaseInstallment, ContractItem } = require('./src/db');

async function testInstallmentSystem() {
  console.log('🧪 Iniciando pruebas del sistema de cuotas...\n');

  try {
    // Sincronizar la base de datos
    await sequelize.sync({ force: false });
    console.log('✅ Base de datos sincronizada');

    // Obtener un contractItem de prueba
    const contractItem = await ContractItem.findOne();
    if (!contractItem) {
      console.log('❌ No hay items de contrato para probar');
      return;
    }

    console.log(`📋 Usando ContractItem: ${contractItem.id}`);

    // Prueba 1: Crear compra con cuotas
    console.log('\n🔍 Prueba 1: Crear compra con 3 cuotas...');
    
    const purchaseData = {
      contract_item_id: contractItem.id,
      costo: 300000,
      tipo_pago: 'cuotas',
      numero_cuotas: 3,
      fecha_primera_cuota: new Date(),
      intervalo_cuotas: 30, // días
      observaciones: 'Prueba de compra en cuotas'
    };

    // Simular creación con transacción
    const transaction = await sequelize.transaction();
    
    try {
      // Crear la compra
      const purchase = await Purchase.create({
        contract_item_id: purchaseData.contract_item_id,
        costo: purchaseData.costo,
        fecha_compra: new Date(),
        estado_pago: 'pendiente',
        tipo_pago: purchaseData.tipo_pago,
        numero_cuotas: purchaseData.numero_cuotas,
        cuotas_pagadas: 0,
        saldo_pendiente: purchaseData.costo,
        observaciones: purchaseData.observaciones
      }, { transaction });

      console.log(`✅ Compra creada: ${purchase.id}`);

      // Crear las cuotas
      const montoCuota = Math.round(purchaseData.costo / purchaseData.numero_cuotas);
      
      for (let i = 1; i <= purchaseData.numero_cuotas; i++) {
        const fechaVencimiento = new Date(purchaseData.fecha_primera_cuota);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + (i - 1) * purchaseData.intervalo_cuotas);

        const installment = await PurchaseInstallment.create({
          purchase_id: purchase.id,
          numero_cuota: i,
          monto_cuota: i === purchaseData.numero_cuotas ? 
            purchaseData.costo - (montoCuota * (purchaseData.numero_cuotas - 1)) : montoCuota,
          fecha_vencimiento: fechaVencimiento,
          estado: 'pendiente'
        }, { transaction });

        console.log(`  📄 Cuota ${i}: $${installment.monto_cuota} - Vence: ${fechaVencimiento.toLocaleDateString()}`);
      }

      await transaction.commit();
      console.log('✅ Compra con cuotas creada exitosamente');

      // Prueba 2: Pagar una cuota (SIN transacción porque ya se commitió)
      console.log('\n🔍 Prueba 2: Pagar la primera cuota...');
      
      const firstInstallment = await PurchaseInstallment.findOne({
        where: { purchase_id: purchase.id, numero_cuota: 1 }
      });

      if (firstInstallment) {
        await firstInstallment.update({
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'transferencia',
          observaciones: 'Pago de prueba'
        });

        // Actualizar la compra
        await purchase.reload();
        await purchase.update({
          cuotas_pagadas: 1,
          saldo_pendiente: purchase.saldo_pendiente - firstInstallment.monto_cuota
        });

        console.log(`✅ Cuota 1 pagada: $${firstInstallment.monto_cuota}`);
        console.log(`💰 Saldo pendiente: $${purchase.saldo_pendiente - firstInstallment.monto_cuota}`);
      }

      // Prueba 3: Consultar estado de la compra (SIN transacción)
      console.log('\n🔍 Prueba 3: Consultar estado completo...');
      
      const purchaseWithInstallments = await Purchase.findByPk(purchase.id, {
        include: [{
          model: PurchaseInstallment,
          as: 'Installments'
        }]
      });

      console.log(`📊 Estado de la compra:`);
      console.log(`  - Total: $${purchaseWithInstallments.costo}`);
      console.log(`  - Tipo: ${purchaseWithInstallments.tipo_pago}`);
      console.log(`  - Cuotas totales: ${purchaseWithInstallments.numero_cuotas}`);
      console.log(`  - Cuotas pagadas: ${purchaseWithInstallments.cuotas_pagadas}`);
      console.log(`  - Saldo pendiente: $${purchaseWithInstallments.saldo_pendiente}`);
      
      console.log(`\n📋 Detalle de cuotas:`);
      for (const installment of purchaseWithInstallments.Installments) {
        console.log(`  Cuota ${installment.numero_cuota}: $${installment.monto_cuota} - ${installment.estado} - Vence: ${installment.fecha_vencimiento.toLocaleDateString()}`);
      }

      console.log('\n🎉 Todas las pruebas completadas exitosamente');

    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await sequelize.close();
  }
}

// Función para limpiar datos de prueba
async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    await PurchaseInstallment.destroy({
      where: {
        observaciones: 'Pago de prueba'
      }
    });

    await Purchase.destroy({
      where: {
        observaciones: 'Prueba de compra en cuotas'
      }
    });

    console.log('✅ Datos de prueba eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  }
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    cleanTestData()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    testInstallmentSystem()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = { testInstallmentSystem, cleanTestData };

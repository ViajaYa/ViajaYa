const { sequelize, User, Quote, QuoteCalculation, Contract } = require('../src/db');

async function createInvoiceTestData() {
  try {
    console.log('🚀 Creando datos de prueba para el sistema de facturas...');

    // 1. Crear usuario de prueba
    const testUser = await User.findOrCreate({
      where: { email: 'cliente.prueba@viajaya.com' },
      defaults: {
        name: 'Juan Carlos',
        lastname: 'Pérez García',
        email: 'cliente.prueba@viajaya.com',
        phone: '3001234567',
        password: 'test123',
        role: 'customer',
        isActive: true
      }
    });

    console.log('✅ Usuario de prueba creado:', testUser[0].name);

    // 2. Crear cotización de prueba
    const testQuote = await Quote.create({
      user_id: testUser[0].id,
      origen: 'Bogotá',
      destino: 'Cartagena',
      fecha_inicio: new Date('2024-12-01'),
      fecha_fin: new Date('2024-12-05'),
      numero_personas: 2,
      status: 'approved',
      observaciones: 'Viaje de aniversario - datos de prueba'
    });

    console.log('✅ Cotización de prueba creada:', testQuote.id);

    // 3. Crear cálculo de cotización
    const testCalculation = await QuoteCalculation.create({
      user_id: testUser[0].id,
      quote_id: testQuote.id,
      costo_base: 2000000,
      total_comisiones: 300000,
      total_ganancia: 200000,
      precio_final_total: 2500000
    });

    console.log('✅ Cálculo de cotización creado');

    // 4. Crear contrato completado (listo para facturar)
    const testContract = await Contract.create({
      quote_id: testQuote.id,
      fecha_inicio: new Date('2024-12-01'),
      fecha_fin: new Date('2024-12-05'),
      fecha_fin_viaje: new Date('2024-12-05'), // Viaje ya terminado
      status: 'completed',
      total_amount: 2500000,
      observaciones: 'Contrato de prueba completado - listo para facturar'
    });

    console.log('✅ Contrato completado creado:', testContract.id);

    // 5. Crear otro contrato para más variedad
    const testQuote2 = await Quote.create({
      user_id: testUser[0].id,
      origen: 'Medellín',
      destino: 'San Andrés',
      fecha_inicio: new Date('2024-11-15'),
      fecha_fin: new Date('2024-11-20'),
      numero_personas: 4,
      status: 'approved',
      observaciones: 'Viaje familiar - datos de prueba'
    });

    const testCalculation2 = await QuoteCalculation.create({
      user_id: testUser[0].id,
      quote_id: testQuote2.id,
      costo_base: 4000000,
      total_comisiones: 600000,
      total_ganancia: 400000,
      precio_final_total: 5000000
    });

    const testContract2 = await Contract.create({
      quote_id: testQuote2.id,
      fecha_inicio: new Date('2024-11-15'),
      fecha_fin: new Date('2024-11-20'),
      fecha_fin_viaje: new Date('2024-11-20'), // Viaje ya terminado
      status: 'completed',
      total_amount: 5000000,
      observaciones: 'Segundo contrato de prueba completado'
    });

    console.log('✅ Segundo contrato completado creado:', testContract2.id);

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📝 Resumen:');
    console.log(`   👤 Usuario: ${testUser[0].name} ${testUser[0].lastname}`);
    console.log(`   📋 Contratos completados: 2`);
    console.log(`   💰 Total pendiente de facturar: $7,500,000`);
    console.log('\n🔍 Ahora puedes probar:');
    console.log('   GET /invoices/pending - Ver contratos pendientes');
    console.log('   POST /invoices/generate/:contractId - Generar facturas');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await sequelize.close();
  }
}

createInvoiceTestData();

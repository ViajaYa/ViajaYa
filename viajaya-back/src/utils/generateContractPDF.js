const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 🎨 Colores del contrato
const COLORS = {
  azulTitulo: "#1e40af",
  textoNormal: "#000000",
  textoSecundario: "#374151",
  bordeTabla: "#9ca3af",
  fondoTabla: "#f9fafb"
};

// ✅ Asegurar que el directorio de PDFs existe
const ensurePDFDirectory = () => {
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

// ✅ Función para formatear fechas en español
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// ✅ Función para formatear moneda colombiana
const formatearMoneda = (monto) => {
  return `$${Math.round(monto).toLocaleString('es-CO')}`;
};

// ✅ Función para convertir número a letras
const numeroALetras = (numero) => {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  
  if (numero === 0) return 'CERO';
  if (numero === 1000000) return 'UN MILLÓN';
  
  let resultado = '';
  
  // Millones
  if (numero >= 1000000) {
    const millones = Math.floor(numero / 1000000);
    if (millones === 1) {
      resultado += 'UN MILLÓN ';
    } else {
      resultado += numeroALetras(millones) + ' MILLONES ';
    }
    numero = numero % 1000000;
  }
  
  // Miles
  if (numero >= 1000) {
    const miles = Math.floor(numero / 1000);
    if (miles === 1) {
      resultado += 'MIL ';
    } else {
      resultado += numeroALetras(miles) + ' MIL ';
    }
    numero = numero % 1000;
  }
  
  // Centenas
  if (numero >= 100) {
    if (numero === 100) {
      resultado += 'CIEN ';
    } else {
      resultado += centenas[Math.floor(numero / 100)] + ' ';
    }
    numero = numero % 100;
  }
  
  // Decenas y unidades
  if (numero >= 20) {
    resultado += decenas[Math.floor(numero / 10)];
    if (numero % 10 > 0) {
      resultado += ' Y ' + unidades[numero % 10];
    }
  } else if (numero >= 10) {
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    resultado += especiales[numero - 10];
  } else if (numero > 0) {
    resultado += unidades[numero];
  }
  
  return resultado.trim();
};

// ✅ Función principal para generar el PDF del contrato
const generateContractPDF = async (contractData, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF de contrato:', contractData.contract_number);
    
    // Crear el documento PDF
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    // Si se debe guardar como archivo
    let stream;
    if (saveToFile) {
      const pdfDir = ensurePDFDirectory();
      const filename = `contrato-${contractData.contract_number}.pdf`;
      const filepath = path.join(pdfDir, filename);
      stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
    }

    // ✅ PÁGINA 1 - HEADER Y DATOS PRINCIPALES
    let yPosition = margin;

    // ✅ TÍTULO PRINCIPAL
    doc.fontSize(14)
       .fillColor(COLORS.azulTitulo)
       .font('Helvetica-Bold')
       .text('CONTRATO DE PRESTACIÓN DE SERVICIOS Y/O PRODUCTOS TURÍSTICOS DE:', margin, yPosition, {
         width: contentWidth,
         align: 'center'
       });
    
    yPosition += 20;

    doc.fontSize(12)
       .text('OPERADOR TURISTICO Y AGENCIA DE VIAJES VIAJA YA RNT 122035', margin, yPosition, {
         width: contentWidth,
         align: 'center'
       });
    
    yPosition += 30;

    // ✅ CLÁUSULA PRIMERA - PARTES
    doc.fontSize(11)
       .fillColor(COLORS.textoNormal)
       .font('Helvetica-Bold')
       .text('CLÁUSULA PRIMERA. PARTES:', margin, yPosition);
    
    yPosition += 15;

    const clausulaPrimera = `El presente contrato será suscrito entre MAYERLY ALEJANDRA HENAO HIGUERA Identificado con número de cedula ciudadanía No 1032406128 quien funciona bajo el nombre comercial "OPERADOR TURISTICO Y AGENCIA DE VIAJES VIAJA YA", con domicilio en Bogotá DC, en la Oficina Principal Centro Comercial Plaza En sueño 2 PISO, con NIT 1032406128 y Registro Nacional de Turismo N°122035, que en adelante será denominado VENDEDOR. Por otra parte, el COMPRADOR, quien se encuentra debidamente identificado en los datos de la reserva y en el capítulo correspondiente del presente contrato.`;

    doc.fontSize(9)
       .fillColor(COLORS.textoNormal)
       .font('Helvetica')
       .text(clausulaPrimera, margin, yPosition, {
         width: contentWidth,
         align: 'justify',
         lineGap: 2
       });
    
    yPosition += 60;

    // ✅ PARÁGRAFO PRIMERO
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('PARÁGRAFO PRIMERO:', margin, yPosition);
    
    yPosition += 12;

    const paragrafoPrimero = `EL OPERADOR TURISTICO Y AGENCIA DE VIAJES – VIAJAYA es una agencia de viajes y turismo dedicada a la comercialización y venta de productos y servicios turísticos, entre otros, conforme se señala en el Certificado de Existencia y Representación Legal, y en el Registro Nacional de Turismo RNT regulado por FONTUR`;

    doc.fontSize(9)
       .font('Helvetica')
       .text(paragrafoPrimero, margin, yPosition, {
         width: contentWidth,
         align: 'justify',
         lineGap: 2
       });
    
    yPosition += 40;

    // ✅ CLÁUSULA SEGUNDA - OBJETO
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('CLAUSULA SEGUNDA. Objeto:', margin, yPosition);
    
    yPosition += 15;

    const clausulaSegunda = `EL COMPRADOR a través de este contrato acuerda con EL VENDEDOR la compra de un paquete turístico a cambio de un precio y conforme a las especificaciones que a continuación se detallan:`;

    doc.fontSize(9)
       .font('Helvetica')
       .text(clausulaSegunda, margin, yPosition, {
         width: contentWidth,
         align: 'justify',
         lineGap: 2
       });
    
    yPosition += 40;

    // ✅ DATOS DE LA RESERVA
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('FECHA DE RESERVA:', margin, yPosition);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(formatearFecha(contractData.fecha_firma || new Date()), margin + 120, yPosition);
    
    yPosition += 15;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('NUMERO DE CONTRATO:', margin, yPosition);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(contractData.contract_number, margin + 140, yPosition);
    
    yPosition += 25;

    // ✅ NUEVA PÁGINA PARA DATOS PERSONALES
    doc.addPage();
    yPosition = margin;

    // ✅ DATOS PERSONALES DEL TITULAR
    doc.fontSize(12)
       .fillColor(COLORS.azulTitulo)
       .font('Helvetica-Bold')
       .text('DATOS RESERVA Y DATOS PERSONALES DEL TITULAR DEL CONTRATO', margin, yPosition, {
         width: contentWidth,
         align: 'center'
       });
    
    yPosition += 25;

    // Datos del titular
    const datosPersonales = [
      { label: 'Nombre completo del Titular del contrato:', valor: `${contractData.Cliente?.name || ''} ${contractData.Cliente?.lastname || ''}` },
      { label: 'Numero Cedula:', valor: contractData.Cliente?.documento_identidad || '' },
      { label: 'Numero de Celular:', valor: contractData.Cliente?.phone || '' },
      { label: 'Correo:', valor: contractData.Cliente?.email || '' },
      { label: 'Dirección:', valor: contractData.cliente_direccion || '' },
      { label: 'Ciudad:', valor: `${contractData.cliente_ciudad || ''} D.C` }
    ];

    doc.fontSize(10)
       .fillColor(COLORS.textoNormal)
       .font('Helvetica');

    datosPersonales.forEach(dato => {
      doc.font('Helvetica-Bold')
         .text(dato.label, margin, yPosition);
      doc.font('Helvetica')
         .text(dato.valor, margin, yPosition + 12);
      yPosition += 30;
    });

    yPosition += 10;

    // ✅ DATOS DEL VIAJE
    const datosViaje = [
      { label: 'Origen:', valor: contractData.Quote?.origen || '' },
      { label: 'Destino:', valor: contractData.Quote?.destino || '' },
      { label: 'Cantidad de Pasajeros:', valor: contractData.Quote?.numero_personas || '' },
      { label: 'Cantidad de infantes (0-23 meses):', valor: '0' },
      { label: 'Fecha de salida:', valor: formatearFecha(contractData.fecha_inicio_viaje) },
      { label: 'Fecha de regreso:', valor: formatearFecha(contractData.fecha_fin_viaje) }
    ];

    datosViaje.forEach(dato => {
      doc.font('Helvetica-Bold')
         .text(dato.label, margin, yPosition);
      doc.font('Helvetica')
         .text(dato.valor, margin, yPosition + 12);
      yPosition += 30;
    });

    // ✅ SERVICIOS INCLUIDOS
    yPosition += 10;

    const servicios = [
      { label: 'TRASLADOS:', valor: 'aeropuerto hotel - hotel aeropuerto APLICA SI: X NO:_' },
      { label: 'TIQUETES:', valor: 'ida y regreso' },
      { label: 'DIMENSIONES DE EQUIPAJE:', valor: '40*35*25 tipo morral-mochila 8 a 10° kilos de peso la -mochila debe ir bajo asientos aéreos (No se asegura silla continua dependemos de aerolínea) EL QR de sus check in se entregará 24 horas antes – APLICA ley aérea' }
    ];

    servicios.forEach(servicio => {
      doc.font('Helvetica-Bold')
         .text(servicio.label, margin, yPosition);
      yPosition += 12;
      doc.font('Helvetica')
         .text(servicio.valor, margin, yPosition, {
           width: contentWidth,
           lineGap: 2
         });
      yPosition += 25;
    });

    // ✅ ALOJAMIENTO
    yPosition += 10;

    doc.font('Helvetica-Bold')
       .text('ALOJAMIENTO:', margin, yPosition);
    yPosition += 15;

    const noches = Math.ceil((new Date(contractData.fecha_fin_viaje) - new Date(contractData.fecha_inicio_viaje)) / (1000 * 60 * 60 * 24));

    const alojamiento = [
      { label: 'Nombre de Hotel:', valor: contractData.Quote?.hotel || 'Hotel Vista Sol' },
      { label: 'Acomodación:', valor: contractData.Quote?.tipo_habitacion || 'Doble' },
      { label: 'No de Noches:', valor: noches.toString() },
      { label: 'Tipo Alimentación:', valor: contractData.Quote?.alimentacion || 'Desayuno, almuerzo y cena' }
    ];

    alojamiento.forEach(item => {
      doc.font('Helvetica-Bold')
         .text(item.label, margin, yPosition);
      doc.font('Helvetica')
         .text(item.valor, margin + 120, yPosition);
      yPosition += 15;
    });

    yPosition += 5;

    doc.font('Helvetica')
       .text('Check in: Primer día 3 pm con cena y Check out: Último día con desayuno.', margin, yPosition, {
         width: contentWidth,
         lineGap: 2
       });
    yPosition += 12;
    doc.text('Seguro Hotelero Incluido. Bebidas y Licores. Snacks pm', margin, yPosition);
    
    yPosition += 25;

    // ✅ DESCRIPCIÓN DEL SERVICIO
    doc.font('Helvetica-Bold')
       .text('DESCRIPCIÓN DEL SERVICIO', margin, yPosition);
    yPosition += 15;

    const descripcionServicio = [
      { label: 'Concepto:', valor: `PLAN ESTANDAR ${contractData.Quote?.destino?.toUpperCase() || 'DESTINO'} - Aplica penalidades por cambios y cancelaciones` },
      { label: 'Actividades Adicionales:', valor: 'NO APLICA' },
      { label: 'Garantías (VENDEDOR Y COMPRADOR):', valor: 'Aplican' },
      { label: 'Seguro Hotelero:', valor: 'aplica según hotel' },
      { label: 'Asistencia médica:', valor: 'SI Aplica (se entrega un día antes de su fecha de viaje y verifique su cobertura) y Seguro Internacional' }
    ];

    descripcionServicio.forEach(item => {
      doc.font('Helvetica-Bold')
         .text(item.label, margin, yPosition);
      yPosition += 12;
      doc.font('Helvetica')
         .text(item.valor, margin, yPosition, {
           width: contentWidth,
           lineGap: 2
         });
      yPosition += 20;
    });

    // ✅ NUEVA PÁGINA PARA DATOS DE VIAJEROS Y PRECIOS
    doc.addPage();
    yPosition = margin;

    // ✅ DATOS DE LOS VIAJEROS
    doc.fontSize(12)
       .fillColor(COLORS.azulTitulo)
       .font('Helvetica-Bold')
       .text('DATOS DE LOS VIAJEROS', margin, yPosition);
    
    yPosition += 20;

    // Viajero principal (titular)
    doc.fontSize(10)
       .fillColor(COLORS.textoNormal)
       .font('Helvetica-Bold')
       .text(`${contractData.Cliente?.name || ''} ${contractData.Cliente?.lastname || ''}:`, margin, yPosition);
    yPosition += 15;

    const datosViajero1 = [
      `${contractData.Cliente?.tipo_documento?.toUpperCase() || 'CC'}. ${contractData.Cliente?.documento_identidad || ''}`,
      `Celular: ${contractData.Cliente?.phone || ''}`,
      `Fecha de nacimiento: ${contractData.cliente_fecha_nacimiento ? new Date(contractData.cliente_fecha_nacimiento).toLocaleDateString('es-ES') : ''}`
    ];

    doc.font('Helvetica');
    datosViajero1.forEach(dato => {
      doc.text(dato, margin, yPosition);
      yPosition += 12;
    });

    yPosition += 15;

    // Segundo viajero (si existe y hay más de 1 persona)
    if (parseInt(contractData.Quote?.numero_personas) > 1) {
      doc.font('Helvetica-Bold')
         .text('Acompañante:', margin, yPosition);
      yPosition += 15;

      const datosViajero2 = [
        'TI. [Documento del acompañante]',
        'Celular: [Teléfono del acompañante]',
        'Fecha de nacimiento: [Fecha del acompañante]'
      ];

      doc.font('Helvetica');
      datosViajero2.forEach(dato => {
        doc.text(dato, margin, yPosition);
        yPosition += 12;
      });
    }

    yPosition += 25;

    // ✅ INFORMACIÓN DE PRECIOS
    doc.fontSize(12)
       .fillColor(COLORS.azulTitulo)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE PRECIOS', margin, yPosition);
    
    yPosition += 20;

    const precioPorPersona = contractData.precio_total / (contractData.Quote?.numero_personas || 1);

    const datosPrecios = [
      { label: 'VALOR PRECIO POR PERSONA:', valor: formatearMoneda(precioPorPersona) },
      { label: 'Número de pasajeros:', valor: `${contractData.Quote?.numero_personas || 1} Pasajeros` },
      { label: 'VALOR PRECIO TOTAL CONTRATO:', valor: formatearMoneda(contractData.precio_total) },
      { label: 'VALOR TOTAL DEL CONTRATO EN LETRA:', valor: `${numeroALetras(contractData.precio_total)} (pesos M/CTE)` }
    ];

    doc.fontSize(10)
       .fillColor(COLORS.textoNormal);

    datosPrecios.forEach(dato => {
      doc.font('Helvetica-Bold')
         .text(dato.label, margin, yPosition);
      yPosition += 12;
      doc.font('Helvetica')
         .text(dato.valor, margin, yPosition);
      yPosition += 20;
    });

    // ✅ FORMA DE PAGO
    if (contractData.forma_pago === 'cuotas' && contractData.tiene_cuota_inicial) {
      const cuotaInicialTexto = [
        { label: 'CUOTA INICIAL:', valor: formatearMoneda(contractData.cuota_inicial_monto) },
        { label: 'SALDO:', valor: formatearMoneda(contractData.monto_restante) },
        { label: 'No cuotas:', valor: contractData.numero_cuotas_restantes.toString() },
        { label: 'Valor de cuotas:', valor: `${formatearMoneda(contractData.valor_cuota_restante)} —VER ACUERDO DE PAGO –(siguiente página confirmas fechas)` }
      ];

      cuotaInicialTexto.forEach(dato => {
        doc.font('Helvetica-Bold')
           .text(dato.label, margin, yPosition);
        doc.font('Helvetica')
           .text(dato.valor, margin + 100, yPosition);
        yPosition += 15;
      });
    }

    // ✅ NUEVA PÁGINA PARA ACUERDO DE PAGO
    if (contractData.forma_pago === 'cuotas') {
      doc.addPage();
      yPosition = margin;

      // ✅ ACUERDO DE PAGO
      doc.fontSize(14)
         .fillColor(COLORS.azulTitulo)
         .font('Helvetica-Bold')
         .text('ACUERDO DE PAGO', margin, yPosition, {
           width: contentWidth,
           align: 'center'
         });
      
      yPosition += 30;

      const textoAcuerdo = `Nos permitimos informarle que 30 días antes de su fecha de viaje debe estar a paz y salvo con el valor total de su reserva; quedan pactadas las cuotas en este acuerdo. Tenga en cuenta consignar a las cuentas bancarias autorizadas y enviar sus soportes de pago al siguiente correo: soportedepagosviajaya@gmail.com para evitar cambios o cancelaciones de sus servicios, foto legible donde se puede evidenciar fecha, numero de aprobación y valor cancelado. Es de responsabilidad del titular enviar e informar sus pagos mensuales`;

      doc.fontSize(9)
         .fillColor(COLORS.textoNormal)
         .font('Helvetica')
         .text(textoAcuerdo, margin, yPosition, {
           width: contentWidth,
           align: 'justify',
           lineGap: 3
         });
      
      yPosition += 80;

      // ✅ CLÁUSULA TERCERA - TABLA DE PAGOS
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('CLAUSULA TERCERA', margin, yPosition);
      
      yPosition += 20;

      // Header de la tabla
      const tableStartY = yPosition;
      const colWidths = [120, 120, 120, 120];
      const headers = ['PRECIO PAGO', 'VALOR', 'FECHA DE PAGO', ''];

      // Dibujar header de tabla
      let currentX = margin;
      headers.forEach((header, index) => {
        doc.rect(currentX, tableStartY, colWidths[index], 25)
           .fillColor(COLORS.fondoTabla)
           .fill()
           .strokeColor(COLORS.bordeTabla)
           .stroke();
        
        doc.fontSize(9)
           .fillColor(COLORS.textoNormal)
           .font('Helvetica-Bold')
           .text(header, currentX + 5, tableStartY + 8, {
             width: colWidths[index] - 10,
             align: 'center'
           });
        
        currentX += colWidths[index];
      });

      yPosition += 25;

      // Datos de la tabla
      const pagos = [];
      
      // Pago inicial
      if (contractData.tiene_cuota_inicial) {
        pagos.push({
          concepto: 'PAGO INICIAL',
          valor: formatearMoneda(contractData.cuota_inicial_monto),
          fecha: formatearFecha(contractData.fecha_vencimiento_inicial)
        });
      }

      // Cuotas
      if (contractData.fechas_vencimiento_cuotas && contractData.fechas_vencimiento_cuotas.length > 0) {
        contractData.fechas_vencimiento_cuotas.forEach((fecha, index) => {
          const esUltimaCuota = index === contractData.fechas_vencimiento_cuotas.length - 1;
          const valorCuota = esUltimaCuota ? 
            contractData.monto_restante - (contractData.valor_cuota_restante * (contractData.numero_cuotas_restantes - 1)) :
            contractData.valor_cuota_restante;

          pagos.push({
            concepto: `CUOTA ${index + 1}`,
            valor: formatearMoneda(valorCuota),
            fecha: formatearFecha(fecha)
          });
        });
      }

      // Dibujar filas de la tabla
      pagos.forEach((pago, rowIndex) => {
        currentX = margin;
        const rowY = yPosition + (rowIndex * 25);

        [pago.concepto, pago.valor, pago.fecha, ''].forEach((cell, colIndex) => {
          doc.rect(currentX, rowY, colWidths[colIndex], 25)
             .fillColor('white')
             .fill()
             .strokeColor(COLORS.bordeTabla)
             .stroke();

          doc.fontSize(8)
             .fillColor(COLORS.textoNormal)
             .font('Helvetica')
             .text(cell, currentX + 5, rowY + 8, {
               width: colWidths[colIndex] - 10,
               align: 'center'
             });

          currentX += colWidths[colIndex];
        });
      });

      yPosition += (pagos.length * 25) + 30;
    }

    // ✅ CLÁUSULAS ADICIONALES (NUEVA PÁGINA)
    doc.addPage();
    yPosition = margin;

    // ✅ TEXTO FIJO DE CLÁUSULAS
    const clausulasTexto = [
      {
        titulo: 'PARÁGRAFO SEGUNDO: INFANTE Y NIÑO:',
        contenido: 'Entiéndase por infante, todo aquel que no ha cumplido 2 años de edad a la fecha de regreso del viaje; niño(a) el mayor a 2 años y que no ha cumplido 12 años de edad a la fecha de regreso del viaje; pasajero mayor todo aquel mayor de 12 años que no ha cumplido 65 años a la fecha de regreso del viaje; pasajero tercera edad todo aquel mayor a 65 años. El ingreso de infantes y niños a los hoteles y vuelos se encuentra restringido si no cuenta con la presencia del guardián legal, padre, tutor o carta de permiso del mismo. (Sujeto a condiciones de Migración Colombia y cada una de las aerolíneas).'
      },
      {
        titulo: 'CLÁUSULA SEPTIMA. CAMBIOS Y CANCELACIONES:',
        contenido: 'EL COMPRADOR podrá cambiar o cancelar el paquete turístico o viaje, en cuyo caso deberá pagar la mayor diferencia resultante o solicitar la devolución de la diferencia en servicios y/o receptivos ofrecidos por la compañía si el cambio o variación del servicio es imputable AL COMPRADOR; o en dinero si la variación o cambio en el servicio es atribuible AL VENDEDOR, exceptuando las modificaciones que en virtud de la cláusula de responsabilidad se puedan efectuar. Cualquier cambio en la reserva del paquete turístico, desarrollo del producto y/o servicio adquirido y demás condiciones o cancelaciones, los podrá realizar EL COMPRADOR mediante escrito físico ante las oficinas de EL VENDEDOR o al correo electrónico: mayordomodeviajesviajaya@gmail.com teniendo en cuenta que serán aplicables las condiciones de la tabla de penalidades de la cláusula décima segunda (12) y el reajuste de tarifa por cambios o demás adiciones, que en su momento se liquidarán a EL COMPRADOR y serán de pago inmediato y total.'
      }
    ];

    clausulasTexto.forEach(clausula => {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 150) {
        doc.addPage();
        yPosition = margin;
      }

      doc.fontSize(10)
         .fillColor(COLORS.textoNormal)
         .font('Helvetica-Bold')
         .text(clausula.titulo, margin, yPosition);
      
      yPosition += 15;

      doc.fontSize(9)
         .font('Helvetica')
         .text(clausula.contenido, margin, yPosition, {
           width: contentWidth,
           align: 'justify',
           lineGap: 2
         });
      
      yPosition += 60;
    });

    // ✅ SECCIÓN DE FIRMAS (ÚLTIMA PÁGINA)
    doc.addPage();
    yPosition = pageHeight - 200;

    // Datos bancarios
    doc.fontSize(10)
       .fillColor(COLORS.textoNormal)
       .font('Helvetica')
       .text('Para evitar que la reserva inicial cambie de su estado por favor cancelar sus acuerdos de pago a las siguientes cuentas bancarias:', margin, yPosition, {
         width: contentWidth,
         align: 'justify',
         lineGap: 2
       });
    
    yPosition += 30;

    doc.font('Helvetica-Bold')
       .text('Bancolombia de ahorros No 846-772-51165 cedula representante legal 1032406128', margin, yPosition);
    
    yPosition += 50;

    // Líneas de firma
    const firmaWidth = (contentWidth - 50) / 2;

    // Línea firma vendedor
    doc.moveTo(margin, yPosition)
       .lineTo(margin + firmaWidth, yPosition)
       .strokeColor(COLORS.textoNormal)
       .stroke();

    // Línea firma comprador
    doc.moveTo(margin + firmaWidth + 50, yPosition)
       .lineTo(pageWidth - margin, yPosition)
       .strokeColor(COLORS.textoNormal)
       .stroke();

    yPosition += 10;

    // Texto de firmas
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('MAYERLY ALEJANDRA HENAO HIGUERA', margin, yPosition, {
         width: firmaWidth,
         align: 'center'
       });

    doc.text('EL COMPRADOR', margin + firmaWidth + 50, yPosition, {
      width: firmaWidth,
      align: 'center'
    });

    yPosition += 12;

    doc.fontSize(8)
       .font('Helvetica')
       .text('OPERADOR TURISTICO Y AGENCIA DE VIAJES VIAJA YA', margin, yPosition, {
         width: firmaWidth,
         align: 'center'
       });

    doc.text(`${contractData.Cliente?.name || ''} ${contractData.Cliente?.lastname || ''}`, margin + firmaWidth + 50, yPosition, {
      width: firmaWidth,
      align: 'center'
    });

    // Finalizar el documento
    doc.end();

    if (saveToFile) {
      // ✅ Esperar a que se complete la escritura
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      
      const pdfDir = ensurePDFDirectory();
      const filename = `contrato-${contractData.contract_number}.pdf`;
      const filepath = path.join(pdfDir, filename);

      console.log('✅ PDF de contrato generado exitosamente:', filepath);
      
      return {
        filepath,
        filename,
        relativePath: `uploads/pdfs/${filename}`,
        buffer: fs.readFileSync(filepath)
      };
    } else {
      // Para vista previa, retornar solo el buffer
      return new Promise((resolve, reject) => {
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            filename: `contrato-${contractData.contract_number}.pdf`
          });
        });
        doc.on('error', reject);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generando PDF de contrato:', error);
    throw new Error(`Error generando PDF de contrato: ${error.message}`);
  }
};

module.exports = {
  generateContractPDF,
  ensurePDFDirectory,
  formatearFecha,
  formatearMoneda,
  numeroALetras
};
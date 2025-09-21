// Estructura de datos para guías contextuales por rol y componente
export const HELP_GUIDES = {
  // ===== CLIENTE =====
  CLIENTE: {
    '/': {
      title: 'Página Principal - Cliente',
      description: 'Cómo solicitar una cotización y navegar en ViajaYa',
      steps: [
        {
          title: 'Solicitar Cotización Online',
          content: 'Completa el formulario de cotización con tus datos de viaje. Incluye destino, fechas y número de pasajeros.',
          action: 'Haz clic en "Solicitar Cotización" en la página principal',
          tip: 'Asegúrate de proporcionar un email válido para recibir tu cotización'
        },
        {
          title: 'Esperar Respuesta',
          content: 'Recibirás un email con tu cotización personalizada en un plazo de 24-48 horas.',
          action: 'Revisa tu email (incluyendo spam)',
          tip: 'El email incluirá un enlace único para aprobar o solicitar cambios'
        }
      ]
    },
    '/userReservas': {
      title: 'Mis Reservas',
      description: 'Gestiona tus reservas y contratos activos',
      steps: [
        {
          title: 'Ver Estado de Reservas',
          content: 'Aquí puedes ver todas tus reservas: cotizaciones pendientes, contratos activos y viajes completados.',
          action: 'Revisa el estado de cada reserva',
          tip: 'Los estados son: Cotización → Aprobada → Contrato → Completada'
        }
      ]
    },
    '/quote-approval': {
      title: 'Aprobar Cotización',
      description: 'Cómo aprobar una cotización y proporcionar datos de pasajeros',
      steps: [
        {
          title: 'Revisar Cotización',
          content: 'Revisa cuidadosamente todos los detalles: destino, fechas, servicios incluidos y precio total.',
          action: 'Lee toda la información proporcionada',
          tip: 'Si algo no está claro, puedes solicitar aclaraciones antes de aprobar'
        },
        {
          title: 'Aprobar o Rechazar',
          content: 'Si estás de acuerdo con la cotización, haz clic en "Aprobar". Si necesitas cambios, selecciona "Solicitar Modificaciones".',
          action: 'Selecciona tu opción preferida',
          tip: 'Al aprobar, pasarás automáticamente al paso de datos de pasajeros'
        },
        {
          title: 'Completar Datos de Pasajeros',
          content: 'Proporciona la información completa de todos los viajeros: nombres, documentos, fechas de nacimiento.',
          action: 'Completa todos los campos obligatorios',
          tip: 'Esta información es necesaria para generar el contrato y los documentos de viaje'
        }
      ]
    }
  },

  // ===== ASESOR =====
  ASESOR: {
    '/profile': {
      title: 'Panel Asesor',
      description: 'Tu centro de control como asesor de ventas',
      steps: [
        {
          title: 'Dashboard Personal',
          content: 'Revisa tu resumen de ventas, comisiones del mes y objetivos pendientes.',
          action: 'Analiza tus métricas de desempeño',
          tip: 'Mantén un seguimiento semanal de tus indicadores'
        },
        {
          title: 'Crear Nueva Cotización',
          content: 'Usa el botón "Nueva Cotización" para crear propuestas para tus clientes.',
          action: 'Haz clic en "Nueva Cotización"',
          tip: 'Asegúrate de tener todos los datos del cliente antes de empezar'
        }
      ]
    },
    '/quotesList': {
      title: 'Gestión de Cotizaciones',
      description: 'Administra todas tus cotizaciones y su seguimiento',
      steps: [
        {
          title: 'Crear Nueva Cotización',
          content: 'Completa todos los datos del cliente y del viaje. El sistema calculará automáticamente precios y comisiones.',
          action: 'Completa el formulario paso a paso',
          tip: 'Guarda borradores para cotizaciones complejas que requieren investigación'
        },
        {
          title: 'Enviar Cotización',
          content: 'Una vez completada, envía la cotización por email al cliente usando el sistema integrado.',
          action: 'Usa el botón "Enviar" en la cotización',
          tip: 'El cliente recibirá un enlace único para responder'
        },
        {
          title: 'Seguimiento',
          content: 'Monitorea el estado: Enviada → Visualizada → Aprobada/Rechazada → Datos Completados.',
          action: 'Revisa regularmente el estado de tus cotizaciones',
          tip: 'Contacta al cliente si no responde en 3-5 días'
        }
      ]
    },
    '/my-commissions': {
      title: 'Mis Comisiones',
      description: 'Seguimiento de tus comisiones generadas y pagos',
      steps: [
        {
          title: 'Ver Comisiones Generadas',
          content: 'Aquí se muestran todas las comisiones de tus contratos completados.',
          action: 'Revisa el listado de comisiones',
          tip: 'Las comisiones se generan cuando el contrato se marca como "Completado"'
        },
        {
          title: 'Solicitar Pago',
          content: 'Para comisiones aprobadas, puedes solicitar el pago proporcionando tus datos bancarios.',
          action: 'Haz clic en "Solicitar Pago"',
          tip: 'Asegúrate de tener tu documentación completa para evitar retrasos'
        },
        {
          title: 'Subir Documentos',
          content: 'Mantén actualizada tu documentación: cédula, datos bancarios, firma digital.',
          action: 'Ve a "Gestionar Documentos"',
          tip: 'Los documentos deben estar aprobados para recibir pagos'
        }
      ]
    }
  },

  // ===== LÍDER =====
  LIDER: {
    '/quotesList': {
      title: 'Gestión de Equipo - Cotizaciones',
      description: 'Supervisa las cotizaciones de tu equipo de asesores',
      steps: [
        {
          title: 'Supervisar Cotizaciones del Equipo',
          content: 'Puedes ver todas las cotizaciones de los asesores bajo tu supervisión.',
          action: 'Usa los filtros para ver por asesor específico',
          tip: 'Enfócate en cotizaciones que llevan más de 5 días sin respuesta'
        },
        {
          title: 'Aprobar Cotizaciones Especiales',
          content: 'Tienes autorización para aprobar cotizaciones con descuentos hasta 15%.',
          action: 'Revisa y aprueba cotizaciones pendientes',
          tip: 'Verifica que los descuentos estén justificados'
        },
        {
          title: 'Coaching del Equipo',
          content: 'Identifica asesores que necesitan apoyo en su proceso de ventas.',
          action: 'Analiza las métricas de conversión por asesor',
          tip: 'Programa sesiones semanales con asesores de bajo rendimiento'
        }
      ]
    },
    '/organization-view': {
      title: 'Vista Organizacional',
      description: 'Gestión y seguimiento de tu equipo',
      steps: [
        {
          title: 'Estructura del Equipo',
          content: 'Visualiza la estructura completa de tu equipo y sus asignaciones.',
          action: 'Revisa la jerarquía y distribución de clientes',
          tip: 'Redistribuye clientes si algún asesor está sobrecargado'
        }
      ]
    }
  },

  // ===== GERENTE =====
  GERENTE: {
    '/financial-dashboard': {
      title: 'Dashboard Financiero',
      description: 'Métricas y reportes de rendimiento de múltiples equipos',
      steps: [
        {
          title: 'Análisis de Performance',
          content: 'Revisa métricas consolidadas de todos los equipos bajo tu gestión.',
          action: 'Analiza tendencias mensuales y trimestrales',
          tip: 'Identifica equipos con oportunidades de mejora'
        }
      ]
    },
    '/monthly-limits': {
      title: 'Gestión de Límites Mensuales',
      description: 'Configurar y monitorear límites de comisiones',
      steps: [
        {
          title: 'Configurar Límites',
          content: 'Establece límites mensuales de comisiones por vendedor según objetivos.',
          action: 'Ajusta límites basándote en performance histórica',
          tip: 'Considera la estacionalidad del turismo'
        }
      ]
    }
  },

  // ===== ADMIN =====
  ADMIN: {
    '/panel': {
      title: 'Panel de Administración',
      description: 'Control total del sistema ViajaYa',
      steps: [
        {
          title: 'Gestión de Usuarios',
          content: 'Crea y administra cuentas de usuarios, asigna roles y equipos.',
          action: 'Ve a "Gestión de Usuarios"',
          tip: 'Siempre asigna un gerente a los nuevos usuarios'
        },
        {
          title: 'Configuración de Paquetes',
          content: 'Crea y mantén actualizado el catálogo de destinos y paquetes.',
          action: 'Ve a "Gestión de Paquetes"',
          tip: 'Actualiza precios según temporada alta/baja'
        }
      ]
    },
    '/contractsList': {
      title: 'Gestión de Contratos',
      description: 'Administra el flujo completo de contratos desde cotización hasta comisiones',
      steps: [
        {
          title: 'Convertir Cotización a Contrato',
          content: 'Cuando una cotización es aprobada y tiene datos completos, conviértela a contrato.',
          action: 'Usa el botón "Convertir a Contrato"',
          tip: 'Verifica que todos los datos de pasajeros estén completos'
        },
        {
          title: 'Gestionar Compras de Items',
          content: 'Supervisa y ejecuta la compra de todos los items necesarios para el viaje.',
          action: 'Accede al "Gestor de Compras" de cada contrato',
          tip: 'Prioriza tickets aéreos - tienen fechas límite críticas'
        },
        {
          title: 'Monitorear Progreso del Contrato',
          content: 'Revisa el estado general y resuelve items vencidos o críticos.',
          action: 'Usa filtros por estado y dashboard de alertas',
          tip: 'Items completados automáticamente generan comisiones'
        }
      ]
    },
    '/contract-purchase-manager': {
      title: 'Gestor de Compras de Contrato',
      description: 'Sistema integral para gestionar todas las compras de items de un contrato',
      steps: [
        {
          title: 'Dashboard de Prioridades',
          content: 'Visualiza items por urgencia: Tickets (máxima) → Alojamiento → Traslados → Otros.',
          action: 'Enfócate primero en alertas rojas (críticas <12h)',
          tip: 'El sistema calcula automáticamente niveles de urgencia'
        },
        {
          title: 'Configurar Fechas Límite',
          content: 'Establece deadlines realistas considerando tiempo de gestión con proveedores.',
          action: 'Usa "Actualizar Fecha Límite" para items sin fecha',
          tip: 'Considera días no laborables y tiempos de respuesta'
        },
        {
          title: 'Subir Comprobantes de Compra',
          content: 'Registra cada compra con factura del proveedor y datos completos.',
          action: 'Click "Subir Comprobante" → Completa todos los campos',
          tip: 'Sistema alertará si costo difiere del cotizado'
        },
        {
          title: 'Sistema de Pagos en Cuotas',
          content: 'Para items >$2M, configura planes de pago en cuotas (2-12 cuotas).',
          action: 'Click "Pagar en Cuotas" → Distribuye montos y fechas',
          tip: 'Ideal para alojamientos prolongados y paquetes premium'
        },
        {
          title: 'Gestionar Cuotas Individuales',
          content: 'Monitorea vencimientos y marca cuotas como pagadas individualmente.',
          action: 'Usa "Ver Cuotas" → Marca pagos según se procesen',
          tip: 'Dashboard muestra: Total, Pagado, Pendiente, Vencido'
        },
        {
          title: 'Confirmar Pagos Completados',
          content: 'Marca items como totalmente pagados tras confirmar transferencias.',
          action: 'Usa "Marcar como Pagado" después de confirmar pago',
          tip: 'Items completos contribuyen al cálculo de comisiones'
        }
      ]
    },
    '/commissionsList': {
      title: 'Gestión de Comisiones',
      description: 'Administra el sistema completo de comisiones',
      steps: [
        {
          title: 'Revisar Comisiones Generadas',
          content: 'Revisa todas las comisiones generadas automáticamente por contratos completados.',
          action: 'Filtra por estado y período',
          tip: 'Prioriza comisiones con documentación completa'
        },
        {
          title: 'Aprobar Comisiones',
          content: 'Aprueba comisiones que tengan toda la documentación en orden.',
          action: 'Usa el botón "Aprobar" después de verificar documentos',
          tip: 'Verifica que los datos bancarios sean correctos'
        },
        {
          title: 'Procesar Pagos',
          content: 'Para comisiones aprobadas, registra el pago y sube el comprobante.',
          action: 'Usa "Marcar como Pagada" y sube comprobante',
          tip: 'Guarda una copia de todos los comprobantes de pago'
        }
      ]
    },
    '/commission-config': {
      title: 'Configuración de Comisiones',
      description: 'Define las reglas de cálculo de comisiones',
      steps: [
        {
          title: 'Configurar Porcentajes por Rol',
          content: 'Define los porcentajes de comisión para cada rol (Asesor, Líder, Gerente).',
          action: 'Crea configuraciones por tipo de viaje',
          tip: 'Diferencia entre viajes nacionales e internacionales'
        },
        {
          title: 'Tipos de Cálculo',
          content: 'Elige entre monto fijo por persona, porcentaje del total, o monto fijo total.',
          action: 'Selecciona el método más apropiado por tipo de producto',
          tip: 'Los montos fijos son mejores para productos estandarizados'
        }
      ]
    }
  },

  // ===== OWNER =====
  OWNER: {
    '/financial-dashboard': {
      title: 'Dashboard Ejecutivo',
      description: 'Vista completa del negocio y métricas clave',
      steps: [
        {
          title: 'Métricas Globales',
          content: 'Revisa ingresos totales, conversión de ventas, y performance por equipo.',
          action: 'Analiza tendencias y patrones estacionales',
          tip: 'Enfócate en métricas de rentabilidad y crecimiento'
        }
      ]
    },
    '/contractsList': {
      title: 'Gestión Estratégica de Contratos',
      description: 'Vista ejecutiva del flujo completo de contratos y su impacto en el negocio',
      steps: [
        {
          title: 'Supervisión de Conversión',
          content: 'Monitorea la conversión de cotizaciones a contratos y su rentabilidad.',
          action: 'Revisa métricas de conversión por asesor y período',
          tip: 'Identifica patrones de éxito para replicar en todo el equipo'
        },
        {
          title: 'Optimización de Compras',
          content: 'Supervisa la eficiencia del proceso de compras y margins reales.',
          action: 'Accede a "Gestor de Compras" para revisar costos vs cotizados',
          tip: 'Diferencias consistentes indican necesidad de ajustar precios'
        },
        {
          title: 'Control de Rentabilidad',
          content: 'Analiza márgenes reales después de todas las compras completadas.',
          action: 'Compara costos finales vs precios de venta',
          tip: 'Usa esta data para mejorar futuras cotizaciones'
        }
      ]
    },
    '/contract-purchase-manager': {
      title: 'Supervisión Ejecutiva de Compras',
      description: 'Vista estratégica del sistema de compras y su impacto en márgenes',
      steps: [
        {
          title: 'Análisis de Performance de Compras',
          content: 'Revisa eficiencia del equipo en completar compras dentro de plazos.',
          action: 'Monitorea métricas de items vencidos vs completados a tiempo',
          tip: 'Items vencidos impactan satisfacción del cliente'
        },
        {
          title: 'Control de Márgenes Reales',
          content: 'Compara costos reales de proveedores vs precios cotizados.',
          action: 'Identifica categorías con mayores desviaciones',
          tip: 'Ajusta estrategia de pricing basada en datos reales'
        },
        {
          title: 'Optimización de Proveedores',
          content: 'Analiza performance y costos de diferentes proveedores.',
          action: 'Identifica proveedores más eficientes por categoría',
          tip: 'Negocia contratos marco con proveedores frecuentes'
        },
        {
          title: 'Gestión de Flujo de Caja',
          content: 'Supervisa el sistema de cuotas y su impacto en flujo de caja.',
          action: 'Revisa balance entre cuotas por pagar y ingresos recibidos',
          tip: 'Sistema de cuotas mejora flujo de caja pero requiere seguimiento'
        }
      ]
    },
    '/facturas-pendientes': {
      title: 'Gestión de Facturación',
      description: 'Control de facturación y aspectos legales',
      steps: [
        {
          title: 'Generar Facturas',
          content: 'Genera facturas oficiales para contratos completados.',
          action: 'Selecciona contratos y genera facturas masivamente',
          tip: 'Mantén al día la facturación para cumplir obligaciones tributarias'
        }
      ]
    }
  }
};

// Tooltips contextuales para elementos específicos de la UI
export const CONTEXTUAL_TOOLTIPS = {
  // === TOOLTIPS GENERALES ===
  'nueva-cotizacion-btn': {
    roles: ['ASESOR', 'LIDER', 'GERENTE', 'ADMIN', 'OWNER'],
    title: 'Nueva Cotización',
    content: 'Crea una cotización personalizada para un cliente potencial',
    action: 'Click para acceder al formulario de cotización'
  },
  'aprobar-cotizacion-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Aprobar Cotización',
    content: 'Marca la cotización como aprobada y lista para envío al cliente',
    action: 'Solo cotizaciones completas pueden ser aprobadas'
  },

  // === TOOLTIPS ESPECÍFICOS DE COMPRAS DE CONTRATOS ===
  'contract-purchase-manager-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Gestor de Compras del Contrato',
    content: 'Accede al sistema completo de gestión de compras de items del contrato',
    action: 'Administra todas las compras necesarias para completar el viaje'
  },
  'subir-comprobante-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Subir Comprobante de Compra',
    content: 'Registra la compra de este item subiendo la factura del proveedor',
    action: 'Completa: proveedor, costo, fecha y adjunta el archivo'
  },
  'pagar-en-cuotas-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Sistema de Pagos en Cuotas',
    content: 'Para items de alto valor (>$2M), configura un plan de pagos en cuotas',
    action: 'Ideal para alojamientos, paquetes completos y servicios premium'
  },
  'actualizar-fecha-limite-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Actualizar Fecha Límite',
    content: 'Modifica la fecha límite de compra considerando tiempo de gestión',
    action: 'Establecer fechas realistas evita alertas innecesarias'
  },
  'marcar-como-pagado-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Marcar como Pagado',
    content: 'Confirma que el pago al proveedor fue procesado exitosamente',
    action: 'Solo usar después de confirmar la transferencia'
  },
  'ver-cuotas-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Gestionar Cuotas del Item',
    content: 'Accede al detalle de todas las cuotas: pagadas, pendientes y vencidas',
    action: 'Marca cuotas individuales como pagadas según se procesen'
  },
  'priority-filter-tickets': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Tickets Aéreos - PRIORIDAD MÁXIMA',
    content: 'Los tickets tienen fechas límite estrictas y requieren compra inmediata',
    action: 'Alerta crítica: menos de 12 horas para vencimiento'
  },
  'priority-filter-accommodation': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Alojamiento - ALTA PRIORIDAD',
    content: 'Reservas de hotel pueden requerir pagos anticipados significativos',
    action: 'Considerar sistema de cuotas para montos altos'
  },
  'priority-filter-transport': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Traslados - PRIORIDAD MEDIA',
    content: 'Servicios de transporte local y traslados aeropuerto-hotel',
    action: 'Coordinar fechas con llegadas y salidas'
  },
  'purchase-difference-alert': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Diferencia de Precio Detectada',
    content: 'El costo real difiere del cotizado - revisa el impacto en márgenes',
    action: 'Considera ajustar precios futuros si la diferencia es significativa'
  },
  'installment-due-soon': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Cuota Próxima a Vencer',
    content: 'Esta cuota vence en menos de 48 horas',
    action: 'Procesa el pago urgentemente para evitar penalizaciones'
  },
  'installment-overdue': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Cuota Vencida',
    content: 'Esta cuota ya pasó su fecha de vencimiento',
    action: 'Contacta al proveedor y procesa el pago inmediatamente'
  },

  // === TOOLTIPS DE COMISIONES ===
  'aprobar-comision-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Aprobar Comisión',
    content: 'Aprueba esta comisión después de verificar documentación completa',
    action: 'Verifica: datos bancarios, documentos de identidad, facturas'
  },
  'pagar-comision-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Marcar Comisión como Pagada',
    content: 'Registra que el pago de comisión fue transferido exitosamente',
    action: 'Solo marcar después de confirmar la transferencia bancaria'
  },
  'nueva-comision-manual-btn': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Crear Comisión Manual',
    content: 'Crea comisiones especiales fuera del flujo automático',
    action: 'Para bonos, incentivos o ajustes especiales'
  },

  // === TOOLTIPS DE ESTADO ===
  'status-pendiente-compra': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Estado: Pendiente de Compra',
    content: 'Este item aún no ha sido comprado - requiere acción',
    action: 'Proceder con la compra lo antes posible'
  },
  'status-comprado-pendiente-pago': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Estado: Comprado, Pendiente de Pago',
    content: 'Item comprado pero el pago al proveedor está pendiente',
    action: 'Procesar pago según términos acordados con proveedor'
  },
  'status-comprado-pagado': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Estado: Comprado y Pagado',
    content: 'Item completamente procesado - no requiere más acción',
    action: 'Item contribuye al cálculo de completitud del contrato'
  },
  'status-vencido': {
    roles: ['ADMIN', 'OWNER'],
    title: 'Estado: VENCIDO',
    content: 'URGENTE: Este item pasó su fecha límite de compra',
    action: 'Contactar al cliente para evaluar opciones alternativas'
  }
};

// Flujos de trabajo paso a paso
export const WORKFLOW_GUIDES = {
  'cotizacion-completa': {
    title: 'Flujo Completo: De Cotización a Comisión',
    description: 'El proceso completo desde que un cliente solicita hasta que se pagan las comisiones',
    roles: ['ADMIN', 'OWNER'],
    steps: [
      {
        step: 1,
        actor: 'Cliente',
        action: 'Solicita cotización online',
        description: 'El cliente completa el formulario web con sus datos de viaje',
        component: 'Landing/Contact Form',
        nextStep: 'El sistema crea una cotización externa pendiente de asignación'
      },
      {
        step: 2,
        actor: 'Admin/Owner',
        action: 'Asigna cotización a asesor',
        description: 'Revisa cotizaciones externas y asigna a asesor apropiado',
        component: 'QuotesList (External Quotes)',
        nextStep: 'El asesor recibe notificación de nueva asignación'
      },
      {
        step: 3,
        actor: 'Asesor',
        action: 'Completa y envía cotización',
        description: 'Elabora propuesta detallada y la envía al cliente',
        component: 'QuoteEdit',
        nextStep: 'Cliente recibe email con enlace único'
      },
      {
        step: 4,
        actor: 'Cliente',
        action: 'Aprueba cotización',
        description: 'Revisa propuesta y la aprueba a través del enlace',
        component: 'Client Quote Approval',
        nextStep: 'Sistema solicita datos de pasajeros'
      },
      {
        step: 5,
        actor: 'Cliente',
        action: 'Completa datos de pasajeros',
        description: 'Proporciona información completa de todos los viajeros',
        component: 'PassengerForm',
        nextStep: 'Cotización queda lista para conversión'
      },
      {
        step: 6,
        actor: 'Admin/Owner',
        action: 'Convierte cotización a contrato',
        description: 'Transforma la cotización aprobada en contrato formal',
        component: 'ContractSet',
        nextStep: 'Se crean automáticamente los items de compra'
      },
      {
        step: 7,
        actor: 'Admin/Owner',
        action: 'Gestiona compras de items',
        description: 'Supervisa y ejecuta la compra de todos los items del contrato',
        component: 'ContractPurchaseManager',
        nextStep: 'Items se marcan como comprados al subir comprobantes'
      },
      {
        step: 8,
        actor: 'Sistema',
        action: 'Genera comisiones automáticamente',
        description: 'Al completar todas las compras, se calculan las comisiones multinivel',
        component: 'Auto Commission Generation',
        nextStep: 'Comisiones quedan pendientes de aprobación'
      },
      {
        step: 9,
        actor: 'Admin',
        action: 'Aprueba y paga comisiones',
        description: 'Revisa documentación y procesa los pagos correspondientes',
        component: 'CommissionsList',
        nextStep: 'Ciclo completo finalizado'
      }
    ]
  },

  'gestion-compras-contrato': {
    title: 'Flujo de Compras de Items de Contrato',
    description: 'Proceso detallado para gestionar las compras de todos los items de un contrato',
    roles: ['ADMIN', 'OWNER'],
    steps: [
      {
        step: 1,
        actor: 'Admin/Owner',
        action: 'Accede al gestor de compras',
        description: 'Desde la lista de contratos, accede al gestor de compras del contrato específico',
        component: 'ContractsList → ContractPurchaseManager',
        nextStep: 'Se muestra dashboard con todos los items pendientes'
      },
      {
        step: 2,
        actor: 'Admin/Owner',
        action: 'Prioriza items por urgencia',
        description: 'Revisa alertas de tiempo y prioriza: 1)Tickets, 2)Alojamiento, 3)Traslados, 4)Otros',
        component: 'ContractPurchaseManager (Priority Dashboard)',
        nextStep: 'Items críticos aparecen destacados en rojo'
      },
      {
        step: 3,
        actor: 'Admin/Owner',
        action: 'Configura fechas límite',
        description: 'Para items sin fecha, establece deadline realista considerando tiempo de gestión',
        component: 'DeadlineUpdateModal',
        nextStep: 'Sistema calcula alertas automáticas'
      },
      {
        step: 4,
        actor: 'Admin/Owner',
        action: 'Ejecuta compra con proveedor',
        description: 'Contacta proveedores, negocia precios y ejecuta la compra real',
        component: 'External Process',
        nextStep: 'Obtiene factura/comprobante del proveedor'
      },
      {
        step: 5,
        actor: 'Admin/Owner',
        action: 'Carga comprobante en sistema',
        description: 'Sube factura con datos completos: proveedor, costo, fecha, tipo de comprobante',
        component: 'PurchaseUploadModal',
        nextStep: 'Item queda registrado como comprado pero pendiente de pago'
      },
      {
        step: 6,
        actor: 'Admin/Owner',
        action: 'Procesa pago al proveedor',
        description: 'Realiza transferencia/pago al proveedor según términos acordados',
        component: 'External Process',
        nextStep: 'Confirma pago en el sistema'
      },
      {
        step: 7,
        actor: 'Admin/Owner',
        action: 'Marca como pagado en sistema',
        description: 'Confirma que el pago al proveedor fue procesado exitosamente',
        component: 'ItemCard (Mark as Paid)',
        nextStep: 'Item queda completamente procesado'
      },
      {
        step: 8,
        actor: 'Sistema',
        action: 'Valida completitud del contrato',
        description: 'Verifica si todos los items están comprados y pagados para generar comisiones',
        component: 'Contract Status Validation',
        nextStep: 'Si está completo, se generan comisiones automáticamente'
      }
    ]
  },

  'sistema-cuotas-compras': {
    title: 'Sistema de Cuotas para Compras de Alto Valor',
    description: 'Flujo para gestionar compras grandes usando el sistema de pagos en cuotas',
    roles: ['ADMIN', 'OWNER'],
    steps: [
      {
        step: 1,
        actor: 'Admin/Owner',
        action: 'Identifica item de alto valor',
        description: 'Detecta items >$2,000,000 COP que justifican sistema de cuotas',
        component: 'ContractPurchaseManager',
        nextStep: 'Evalúa si conviene pago único o cuotas'
      },
      {
        step: 2,
        actor: 'Admin/Owner',
        action: 'Negocia términos con proveedor',
        description: 'Acuerda plan de pagos en cuotas con el proveedor (2-12 cuotas)',
        component: 'External Process',
        nextStep: 'Define fechas y montos específicos'
      },
      {
        step: 3,
        actor: 'Admin/Owner',
        action: 'Crea plan de cuotas en sistema',
        description: 'Usa "Pagar en Cuotas" para configurar plan de pagos personalizado',
        component: 'CreateInstallmentsModal',
        nextStep: 'Sistema crea cuotas individuales con fechas de vencimiento'
      },
      {
        step: 4,
        actor: 'Admin/Owner',
        action: 'Monitorea vencimientos',
        description: 'Revisa dashboard de cuotas para identificar próximos vencimientos',
        component: 'InstallmentsManagementModal',
        nextStep: 'Recibe alertas automáticas de cuotas próximas a vencer'
      },
      {
        step: 5,
        actor: 'Admin/Owner',
        action: 'Procesa pago de cuota',
        description: 'Ejecuta transferencia individual para cuota específica',
        component: 'External Process',
        nextStep: 'Marca cuota como pagada en el sistema'
      },
      {
        step: 6,
        actor: 'Admin/Owner',
        action: 'Registra pago de cuota',
        description: 'Usa "Marcar como Pagada" en la cuota específica con observaciones',
        component: 'InstallmentsManagementModal',
        nextStep: 'Cuota se marca como pagada, se actualiza el balance'
      },
      {
        step: 7,
        actor: 'Sistema',
        action: 'Actualiza estado general del item',
        description: 'Cuando todas las cuotas están pagadas, marca el item como completamente pagado',
        component: 'Auto Status Update',
        nextStep: 'Item contribuye al cálculo de completitud del contrato'
      }
    ]
  }
};
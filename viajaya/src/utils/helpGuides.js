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
      description: 'Administra el flujo completo de contratos',
      steps: [
        {
          title: 'Convertir Cotización a Contrato',
          content: 'Cuando una cotización es aprobada y tiene datos completos, conviértela a contrato.',
          action: 'Usa el botón "Convertir a Contrato"',
          tip: 'Verifica que todos los datos de pasajeros estén completos'
        },
        {
          title: 'Gestión de Pagos',
          content: 'Configura planes de pago y registra los pagos recibidos.',
          action: 'Ve a "Gestión de Compras" en el contrato',
          tip: 'Documenta todos los pagos con comprobantes'
        },
        {
          title: 'Completar Contrato y Generar Comisiones',
          content: 'Al marcar un contrato como "Completado", se generan automáticamente las comisiones.',
          action: 'Cambia estado a "Completado" cuando el viaje termine',
          tip: 'Solo marca como completado tras confirmar satisfacción del cliente'
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

// Configuración de tooltips contextuales para elementos específicos
export const CONTEXTUAL_TOOLTIPS = {
  // Botones principales
  'nueva-cotizacion-btn': {
    ASESOR: 'Crea una nueva propuesta de viaje para un cliente. Asegúrate de tener todos sus datos antes de empezar.',
    LIDER: 'Crea cotizaciones directas o supervisa las de tu equipo.',
    ADMIN: 'Crea cotizaciones para cualquier cliente del sistema.'
  },
  
  'enviar-cotizacion-btn': {
    ASESOR: 'Envía la cotización por email al cliente. Se generará un enlace único para su respuesta.',
    LIDER: 'Envía cotizaciones aprobadas a los clientes.',
    ADMIN: 'Envía cotizaciones con autorización total.'
  },

  'convertir-contrato-btn': {
    ADMIN: 'Convierte esta cotización aprobada en un contrato oficial. Verifica que todos los datos estén completos.',
    OWNER: 'Convierte cotizaciones a contratos y gestiona el flujo completo.'
  },

  'generar-comisiones-btn': {
    ADMIN: 'Al completar un contrato, se generan automáticamente las comisiones para toda la cadena de ventas.',
    OWNER: 'Controla el proceso completo de generación de comisiones.'
  },

  'aprobar-comision-btn': {
    ADMIN: 'Aprueba esta comisión después de verificar la documentación del vendedor.',
    OWNER: 'Aprueba comisiones con autorización total.'
  },

  'pagar-comision-btn': {
    ADMIN: 'Registra el pago de esta comisión y sube el comprobante de transferencia.',
    OWNER: 'Procesa pagos de comisiones y mantén el registro financiero.'
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
        action: 'Convierte a contrato',
        description: 'Crea contrato oficial basado en cotización aprobada',
        component: 'ContractsList',
        nextStep: 'Se genera contrato con plan de pagos'
      },
      {
        step: 7,
        actor: 'Admin/Owner',
        action: 'Gestiona pagos',
        description: 'Registra pagos del cliente según plan establecido',
        component: 'ContractPaymentsManager',
        nextStep: 'Contrato avanza según pagos recibidos'
      },
      {
        step: 8,
        actor: 'Admin/Owner',
        action: 'Completa contrato',
        description: 'Marca contrato como completado tras finalizar viaje',
        component: 'ContractsList',
        nextStep: 'Sistema genera automáticamente comisiones'
      },
      {
        step: 9,
        actor: 'Sistema',
        action: 'Genera comisiones',
        description: 'Calcula y crea comisiones para toda la cadena de ventas',
        component: 'Auto-generation',
        nextStep: 'Comisiones quedan pendientes de documentación'
      },
      {
        step: 10,
        actor: 'Vendedores',
        action: 'Completan documentación',
        description: 'Suben documentos requeridos y datos bancarios',
        component: 'MyCommissions',
        nextStep: 'Comisiones quedan listas para aprobación'
      },
      {
        step: 11,
        actor: 'Admin/Owner',
        action: 'Aprueba comisiones',
        description: 'Revisa documentación y aprueba comisiones válidas',
        component: 'CommissionsList',
        nextStep: 'Comisiones quedan listas para pago'
      },
      {
        step: 12,
        actor: 'Admin/Owner',
        action: 'Procesa pagos',
        description: 'Realiza transferencias y registra comprobantes',
        component: 'CommissionsList',
        nextStep: 'Ciclo completo terminado'
      }
    ]
  }
};
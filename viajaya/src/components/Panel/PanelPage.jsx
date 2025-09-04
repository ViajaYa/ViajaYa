import { Link } from "react-router-dom";
import NavBar from "../layout/NavBar/NavBar";

const PanelPage = () => {
  const dashboardSections = [
  
    {
      title: "Operaciones de Viaje",
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      borderColor: "border-emerald-200",
      hoverColor: "hover:from-emerald-100 hover:to-emerald-200",
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-700",
      icon: "✈️",
      items: [
        {
          title: "Gestionar Paquetes",
          description: "Administra tus paquetes, edita y agrega nuevos",
          link: "/panel/pack",
          icon: "📦"
        },
        {
          title: "Gestionar Reservas",
          description: "Listar y editar reservas de clientes",
          link: "/panel/reservas",
          icon: "📅"
        },
        {
          title: "Gestionar Cotizaciones",
          description: "Gestión completa de cotizaciones",
          link: "/quotesList",
          icon: "💰"
        },
        {
          title: "Gestionar Contratos",
          description: "Administración de contratos de viaje",
          link: "/contractsList",
          icon: "📄"
        }
      ]
    },
    {
      title: "Finanzas y Pagos",
      color: "bg-gradient-to-br from-amber-50 to-amber-100",
      borderColor: "border-amber-200",
      hoverColor: "hover:from-amber-100 hover:to-amber-200",
      iconColor: "text-amber-600",
      titleColor: "text-amber-700",
      icon: "💳",
      items: [
        {
          title: "Gestionar Comisiones",
          description: "Administrar y revisar comisiones del equipo",
          link: "/commissionsList",
          icon: "📊"
        },
        {
          title: "Configurar Comisiones",
          description: "Configurar montos globales por rol y tipo de viaje",
          link: "/commission-config",
          icon: "⚙️"
        },
        {
          title: "Gestión de Pagos",
          description: "Carga de comprobantes y gestión de pagos de contratos",
          link: "/contract-payments",
          icon: "💸"
        },
        {
          title: "Gestión de Facturas",
          description: "Generar facturas de contratos completados y gestionar pagos",
          link: "/facturas-pendientes",
          icon: "🧾"
        }
      ]
    },
      {
      title: "Gestión de Clientes",
      color: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      hoverColor: "hover:from-blue-100 hover:to-blue-200",
      iconColor: "text-blue-600",
      titleColor: "text-blue-700",
      icon: "👥",
      items: [
        {
          title: "Listar Usuarios",
          description: "Administra y visualiza los detalles de los clientes",
          link: "/panel/user",
          icon: "📋"
        },
        {
          title: "Gestionar Cuentas",
          description: "Gestión de Staff y cuentas de clientes",
          link: "/createStaff",
          icon: "👤"
        }
      ]
    },
    {
      title: "Administración del Sistema",
      color: "bg-gradient-to-br from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      hoverColor: "hover:from-purple-100 hover:to-purple-200",
      iconColor: "text-purple-600",
      titleColor: "text-purple-700",
      icon: "🔧",
      items: [
        {
          title: "Gestionar Página",
          description: "Crea enlaces, promos, yapaya",
          link: "/panelGestion",
          icon: "🌐"
        },
        {
          title: "Revisar Documentación",
          description: "Aprobar/Rechazar documentos de empleados",
          link: "/panel/documents-review",
          icon: "📋"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      
      {/* Header del Dashboard */}
      <div className="pt-24 pb-8 px-8 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 font-nunito mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600 font-nunito">
            Panel de control para la gestión integral de ViajaYa
          </p>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="space-y-12">
          {dashboardSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              {/* Header de la Sección */}
              <div className="flex items-center space-x-3">
                <span className={`text-3xl ${section.iconColor}`}>
                  {section.icon}
                </span>
                <h2 className={`text-2xl font-bold ${section.titleColor} font-nunito`}>
                  {section.title}
                </h2>
                <div className={`flex-1 h-px ${section.color} opacity-50`}></div>
              </div>

              {/* Cards de la Sección */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.items.map((item, itemIndex) => (
                  <Link
                    key={itemIndex}
                    to={item.link}
                    className={`${section.color} ${section.borderColor} ${section.hoverColor} border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 p-6 flex flex-col items-center text-center group`}
                  >
                    {/* Icono */}
                    <div className="mb-4 p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${section.titleColor} font-nunito mb-2 group-hover:underline`}>
                        {item.title}
                      </h3>
                      <p className="text-gray-600 font-nunito text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Indicador de acción */}
                    <div className={`mt-4 ${section.iconColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer del Dashboard */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 font-nunito text-sm">
              Dashboard Administrativo ViajaYa © 2025
            </p>
            <p className="text-gray-400 font-nunito text-xs mt-1">
              Gestión integral para agencias de viajes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelPage;

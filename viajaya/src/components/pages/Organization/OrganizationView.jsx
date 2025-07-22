import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserTie, 
  faChartLine, 
  faArrowLeft,
  faEye,
  faUserCheck,
  faUserTimes,
  faBuilding,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { useRolePermissions, USER_ROLES } from '../../../redux/hooks/hooks';
import { 
  fetchOrganizationStructure, 
  fetchTeamMetrics,
  selectOrganizationStructure,
  selectTeamMetrics,
  selectOrganizationLoading,
  selectMetricsLoading
} from '../../../redux/slices/userSlice';
import NavBar from '../../layout/NavBar/NavBar';
import LoadingSpinner from '../../LoadingSpinner';

const OrganizationView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useParams();
  const { user } = useSelector(state => state.auth);
  const { canViewOrganization, canViewTeamMetrics, getRoleName } = useRolePermissions();
  
  // Redux state
  const organizationData = useSelector(selectOrganizationStructure);
  const teamMetrics = useSelector(selectTeamMetrics);
  const organizationLoading = useSelector(selectOrganizationLoading);
  const metricsLoading = useSelector(selectMetricsLoading);
  
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // Determinar qué usuario ver (el parámetro de URL o el usuario actual)
  const targetUserId = userId || user?.id;
  const isViewingOwnTeam = !userId || userId === user?.id?.toString();

  const loading = organizationLoading || metricsLoading;

  useEffect(() => {
    if (!canViewOrganization()) {
      toast.error('No tienes permisos para ver esta información');
      navigate('/profile');
      return;
    }

    if (!targetUserId) {
      toast.error('Usuario no válido');
      navigate('/profile');
      return;
    }

    loadOrganizationData();
  }, [targetUserId, selectedPeriod]);

  const loadOrganizationData = async () => {
    try {
      // Cargar estructura organizacional
      await dispatch(fetchOrganizationStructure({
        userId: targetUserId,
        includeCommissions: true,
        period: selectedPeriod
      })).unwrap();

      // Cargar métricas si el usuario tiene permisos
      if (canViewTeamMetrics()) {
        await dispatch(fetchTeamMetrics({
          managerId: targetUserId,
          period: selectedPeriod
        })).unwrap();
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      toast.error('Error al cargar la información del equipo');
    }
  };

  const handleViewTeam = (memberId) => {
    navigate(`/panel/organization/${memberId}`);
  };

  const handleGoBack = () => {
    if (userId) {
      navigate(-1); // Volver a la página anterior si venimos de ver otro equipo
    } else {
      navigate('/profile');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getRoleColor = (role) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',      // Cliente
      2: 'bg-blue-100 text-blue-800',      // Asesor
      3: 'bg-green-100 text-green-800',    // Líder
      4: 'bg-purple-100 text-purple-800',  // Gerente
      5: 'bg-red-100 text-red-800',        // Admin
      6: 'bg-yellow-100 text-yellow-800',  // Contador
      7: 'bg-indigo-100 text-indigo-800'   // Owner
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const MemberCard = ({ member, showViewButton = false, title = null }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faUserTie} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {member.name} {member.lastname}
            </h4>
            <p className="text-sm text-gray-600">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
            {getRoleName(member.role)}
          </span>
          {member.is_active_seller ? (
            <FontAwesomeIcon icon={faUserCheck} className="text-green-500" title="Activo" />
          ) : (
            <FontAwesomeIcon icon={faUserTimes} className="text-red-500" title="Inactivo" />
          )}
        </div>
      </div>
      
      {title && (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>Comisión: {member.commission_percentage || 0}%</span>
          {member.total_asesores !== undefined && (
            <span className="ml-3">Asesores: {member.total_asesores}</span>
          )}
        </div>
        
        {showViewButton && member.role >= 3 && (
          <button
            onClick={() => handleViewTeam(member.id)}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faEye} className="mr-1" />
            Ver Equipo
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!organizationData) {
    return (
      <>
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">No se pudo cargar la información del equipo</p>
            <button 
              onClick={handleGoBack}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Volver
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleGoBack}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isViewingOwnTeam ? 'Mi Equipo' : `Equipo de ${organizationData.manager.name}`}
                  </h1>
                  <p className="text-gray-600">
                    Estructura organizacional y métricas del equipo
                  </p>
                </div>
              </div>
              
              {canViewTeamMetrics() && (
                <div className="flex items-center space-x-4">
                  {/* ✅ Botón para ver todos los equipos (solo Admin/Owner) */}
                  {user?.role >= USER_ROLES.ADMIN && (
                    <button
                      onClick={() => navigate('/panel/all-teams')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium transition-colors hover:bg-purple-700"
                    >
                      <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                      Ver Todos los Equipos
                    </button>
                  )}
                  
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="current_month">Mes Actual</option>
                    <option value="last_month">Mes Anterior</option>
                    <option value="current_quarter">Trimestre Actual</option>
                    <option value="current_year">Año Actual</option>
                  </select>
                  
                  <button
                    onClick={() => setShowMetrics(!showMetrics)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showMetrics 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 border border-gray-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                    {showMetrics ? 'Ocultar Métricas' : 'Ver Métricas'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manager Info */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {organizationData.manager.name} {organizationData.manager.lastname}
                    </h2>
                    <p className="text-gray-600">{organizationData.manager.email}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(organizationData.manager.role)}`}>
                        {getRoleName(organizationData.manager.role)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Comisión: {organizationData.manager.commission_percentage || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {organizationData.manager.total_team_members}
                  </div>
                  <div className="text-sm text-gray-500">
                    Miembros del Equipo
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          {showMetrics && teamMetrics && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(teamMetrics.metrics.total_sales)}
                      </p>
                    </div>
                    <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-xl" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Comisiones</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(teamMetrics.metrics.total_commissions)}
                      </p>
                    </div>
                    <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reservas</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {teamMetrics.metrics.total_orders || 0}
                      </p>
                    </div>
                    <FontAwesomeIcon icon={faUserCheck} className="text-purple-600 text-xl" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activos</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {teamMetrics.metrics.active_members || 0}
                      </p>
                    </div>
                    <FontAwesomeIcon icon={faUserTie} className="text-indigo-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Structure */}
          <div className="space-y-8">
            
            {/* Líderes Directos */}
            {organizationData.hierarchy.lideres_directos.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="mr-2 text-green-600" />
                  Líderes Directos ({organizationData.hierarchy.lideres_directos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizationData.hierarchy.lideres_directos.map(lider => (
                    <MemberCard 
                      key={lider.id} 
                      member={lider} 
                      showViewButton={true}
                      title="Líder"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Asesores Directos */}
            {organizationData.hierarchy.asesores_directos.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUserTie} className="mr-2 text-blue-600" />
                  Asesores Directos ({organizationData.hierarchy.asesores_directos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizationData.hierarchy.asesores_directos.map(asesor => (
                    <MemberCard 
                      key={asesor.id} 
                      member={asesor}
                      title="Asesor Directo"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Asesores Indirectos */}
            {organizationData.hierarchy.asesores_indirectos.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUserTie} className="mr-2 text-purple-600" />
                  Asesores Indirectos ({organizationData.hierarchy.asesores_indirectos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizationData.hierarchy.asesores_indirectos.map(asesor => (
                    <MemberCard 
                      key={asesor.id} 
                      member={asesor}
                      title="Asesor Indirecto"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {organizationData.manager.total_team_members === 0 && (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-6xl mb-4" />
                <h3 className="text-xl font-medium text-gray-500 mb-2">
                  No hay miembros en el equipo
                </h3>
                <p className="text-gray-400">
                  {isViewingOwnTeam 
                    ? 'Aún no tienes miembros asignados a tu equipo' 
                    : 'Este usuario no tiene miembros asignados'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationView;

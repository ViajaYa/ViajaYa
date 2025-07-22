import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserTie, 
  faChartLine, 
  faArrowLeft,
  faEye,
  faBuilding,
  faFilter,
  faSort
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { useRolePermissions, USER_ROLES } from '../../../redux/hooks/hooks';
import { 
  fetchAllUsers, 
  fetchOrganizationStructure,
  selectUsers,
  selectUserLoading
} from '../../../redux/slices/userSlice';
import NavBar from '../../layout/NavBar/NavBar';
import LoadingSpinner from '../../LoadingSpinner';

const AllTeamsView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { getRoleName } = useRolePermissions();
  
  // Redux state
  const allUsers = useSelector(selectUsers);
  const loading = useSelector(selectUserLoading);
  
  const [teams, setTeams] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Solo permitir acceso a Admin (5), Contador (6) y Owner (7)
    if (!user || user.role < USER_ROLES.ADMIN) {
      toast.error('No tienes permisos para ver esta información');
      navigate('/profile');
      return;
    }

    loadAllTeams();
  }, [user]);

  // Procesar usuarios cuando se cargan desde Redux
  useEffect(() => {
    if (allUsers.length > 0) {
      processTeamData();
    }
  }, [allUsers]);

  const processTeamData = async () => {
    try {
      // Filtrar usuarios que pueden tener equipos (Líder en adelante)
      const teamLeaders = allUsers.filter(user => user.role >= 3);
      
      // Para cada líder de equipo, obtener su estructura organizacional
      const teamsPromises = teamLeaders.map(async (leader) => {
        try {
          const orgResponse = await dispatch(fetchOrganizationStructure({
            userId: leader.id,
            includeCommissions: false,
            period: 'current_month'
          })).unwrap();
          
          return {
            leader,
            organization: orgResponse,
            hasTeam: orgResponse.manager.total_team_members > 0
          };
        } catch (error) {
          console.error(`Error loading team for user ${leader.id}:`, error);
          return {
            leader,
            organization: null,
            hasTeam: false
          };
        }
      });

      const teamsData = await Promise.all(teamsPromises);
      setTeams(teamsData);
      
    } catch (error) {
      console.error('Error processing team data:', error);
      toast.error('Error al procesar la información de los equipos');
    }
  };

  const loadAllTeams = async () => {
    try {
      // Cargar todos los usuarios desde Redux
      await dispatch(fetchAllUsers()).unwrap();
      
    } catch (error) {
      console.error('Error loading all teams:', error);
      toast.error('Error al cargar la información de los equipos');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
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

  // Filtrar y ordenar equipos
  const filteredAndSortedTeams = teams
    .filter(team => {
      const matchesRole = filterRole === 'all' || team.leader.role.toString() === filterRole;
      const matchesSearch = searchTerm === '' || 
        team.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leader.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.leader.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.leader.name} ${a.leader.lastname}`.toLowerCase();
          bValue = `${b.leader.name} ${b.leader.lastname}`.toLowerCase();
          break;
        case 'role':
          aValue = a.leader.role;
          bValue = b.leader.role;
          break;
        case 'teamSize':
          aValue = a.organization?.manager.total_team_members || 0;
          bValue = b.organization?.manager.total_team_members || 0;
          break;
        case 'email':
          aValue = a.leader.email.toLowerCase();
          bValue = b.leader.email.toLowerCase();
          break;
        default:
          aValue = a.leader.name.toLowerCase();
          bValue = b.leader.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const TeamCard = ({ teamData }) => {
    const { leader, organization, hasTeam } = teamData;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUserTie} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {leader.name} {leader.lastname}
              </h3>
              <p className="text-sm text-gray-600">{leader.email}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(leader.role)}`}>
                {getRoleName(leader.role)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {organization?.manager.total_team_members || 0}
            </div>
            <div className="text-xs text-gray-500">
              Miembros
            </div>
          </div>
        </div>

        {hasTeam && organization && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {organization.hierarchy.lideres_directos.length}
                </div>
                <div className="text-xs text-gray-500">Líderes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {organization.hierarchy.asesores_directos.length}
                </div>
                <div className="text-xs text-gray-500">Asesores Directos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {organization.hierarchy.asesores_indirectos.length}
                </div>
                <div className="text-xs text-gray-500">Asesores Indirectos</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span>Comisión: {leader.commission_percentage || 0}%</span>
            {leader.is_active_seller && (
              <span className="ml-2 text-green-600">● Activo</span>
            )}
            {!leader.is_active_seller && (
              <span className="ml-2 text-red-600">● Inactivo</span>
            )}
          </div>
          
          <div className="space-x-2">
            {hasTeam && (
              <button
                onClick={() => navigate(`/panel/organization/${leader.id}`)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                <FontAwesomeIcon icon={faEye} className="mr-1" />
                Ver Equipo
              </button>
            )}
            {!hasTeam && (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded">
                Sin Equipo
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                  onClick={() => navigate('/profile')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Todos los Equipos
                  </h1>
                  <p className="text-gray-600">
                    Vista general de la estructura organizacional
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredAndSortedTeams.filter(t => t.hasTeam).length}
                </div>
                <div className="text-sm text-gray-500">
                  Equipos Activos
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por nombre o email
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por rol
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los roles</option>
                  <option value="3">Líderes</option>
                  <option value="4">Gerentes</option>
                  <option value="5">Administradores</option>
                  <option value="6">Contadores</option>
                  <option value="7">Propietarios</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nombre</option>
                  <option value="role">Rol</option>
                  <option value="teamSize">Tamaño del Equipo</option>
                  <option value="email">Email</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <FontAwesomeIcon icon={faSort} className="mr-2" />
                  {sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
                </button>
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTeams.map((teamData) => (
              <TeamCard key={teamData.leader.id} teamData={teamData} />
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedTeams.length === 0 && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-6xl mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">
                No se encontraron equipos
              </h3>
              <p className="text-gray-400">
                {searchTerm || filterRole !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda' 
                  : 'No hay equipos configurados en el sistema'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AllTeamsView;

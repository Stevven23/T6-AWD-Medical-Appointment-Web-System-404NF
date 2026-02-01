import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import SecurityModel from '../../models/Security.model';
import {
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ShieldExclamationIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// ============================================================================
// TABS CONFIGURATION
// ============================================================================

const TABS = [
  { id: 'users', name: 'Usuarios', icon: UsersIcon },
  { id: 'roles', name: 'Roles', icon: TagIcon },
  { id: 'administrators', name: 'Administradores', icon: ShieldCheckIcon },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SecurityManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await SecurityModel.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersTab showNotification={showNotification} onDataChange={loadStats} />;
      case 'roles':
        return <RolesTab showNotification={showNotification} onDataChange={loadStats} />;
      case 'administrators':
        return <AdministratorsTab showNotification={showNotification} onDataChange={loadStats} />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
              Seguridad y Accesos
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de usuarios, roles, permisos y auditoría del sistema
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Usuarios"
              value={stats.total_users}
              subtitle={`${stats.active_users} activos`}
              icon={UsersIcon}
              color="blue"
            />
            <StatCard
              title="Verificados"
              value={stats.verified_users}
              subtitle={`${((stats.verified_users / stats.total_users) * 100 || 0).toFixed(0)}% del total`}
              icon={CheckCircleIcon}
              color="green"
            />
            <StatCard
              title="Administradores"
              value={stats.admin_count}
              subtitle={`${stats.super_admins} super admins`}
              icon={ShieldCheckIcon}
              color="purple"
            />
            <StatCard
              title="Logs Hoy"
              value={stats.today_logs}
              subtitle="Actividad registrada"
              icon={ClipboardDocumentListIcon}
              color="orange"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </AdminLayout>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value ?? '-'}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// USERS TAB
// ============================================================================

function UsersTab({ showNotification, onDataChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', status: '', verified: '' });
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ token: '', expiresAt: '' });
  const [newPassword, setNewPassword] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'warning' });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [pagination.page, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      };
      const response = await SecurityModel.getUsers(params);
      setUsers(response.data || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (error) {
      showNotification('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await SecurityModel.getRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleViewUser = async (user) => {
    try {
      const details = await SecurityModel.getUserDetails(user.id);
      setSelectedUser(details);
      setShowDetailModal(true);
    } catch (error) {
      showNotification('Error al cargar detalles', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    setConfirmModal({
      show: true,
      title: user.is_active ? 'Desactivar Usuario' : 'Activar Usuario',
      message: `¿${user.is_active ? 'Desactivar' : 'Activar'} al usuario ${user.email}?`,
      type: user.is_active ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          await SecurityModel.updateUserStatus(user.id, !user.is_active);
          showNotification(`Usuario ${user.is_active ? 'desactivado' : 'activado'} exitosamente`);
          loadUsers();
          onDataChange();
        } catch (error) {
          showNotification(error.response?.data?.error || 'Error al cambiar estado', 'error');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleForceVerifyEmail = async (user) => {
    setConfirmModal({
      show: true,
      title: 'Forzar Verificación de Email',
      message: `¿Forzar verificación de email para ${user.email}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          await SecurityModel.forceVerifyEmail(user.id);
          showNotification('Email verificado exitosamente');
          loadUsers();
        } catch (error) {
          showNotification('Error al verificar email', 'error');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setPasswordData({ token: '', expiresAt: '' });
    setShowPasswordModal(true);
  };

  const handleGenerateResetToken = async () => {
    try {
      const result = await SecurityModel.generatePasswordReset(selectedUser.id);
      setPasswordData({
        token: result.token,
        expiresAt: result.expires_at
      });
      showNotification('Token de restablecimiento generado');
    } catch (error) {
      showNotification('Error al generar token', 'error');
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    try {
      await SecurityModel.setUserPassword(selectedUser.id, newPassword);
      showNotification('Contraseña establecida exitosamente');
      setShowPasswordModal(false);
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al establecer contraseña', 'error');
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(passwordData.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleChangeRole = async (newRoleId) => {
    setConfirmModal({
      show: true,
      title: 'Cambiar Rol de Usuario',
      message: '¿Está seguro de cambiar el rol de este usuario? Esta acción puede afectar su acceso al sistema.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await SecurityModel.changeUserRole(selectedUser.id, newRoleId);
          showNotification('Rol cambiado exitosamente');
          setShowRoleModal(false);
          loadUsers();
          onDataChange();
        } catch (error) {
          showNotification(error.response?.data?.error || 'Error al cambiar rol', 'error');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700',
      doctor: 'bg-blue-100 text-blue-700',
      patient: 'bg-green-100 text-green-700',
    };
    return colors[role?.code] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o cédula..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <select
          value={filters.role}
          onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los roles</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.label || role.name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          value={filters.verified}
          onChange={(e) => setFilters(f => ({ ...f, verified: e.target.value }))}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Verificación email</option>
          <option value="verified">Verificados</option>
          <option value="unverified">No verificados</option>
        </select>
        <button
          onClick={() => setFilters({ search: '', role: '', status: '', verified: '' })}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email Verificado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Cargando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.cedula || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role?.label || user.role?.name || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircleIcon className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircleIcon className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_email_verified ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <button
                        onClick={() => handleForceVerifyEmail(user)}
                        className="text-yellow-500 hover:text-yellow-600"
                        title="Forzar verificación"
                      >
                        <ExclamationTriangleIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(user)}
                        className="p-1 text-gray-400 hover:text-orange-600"
                        title="Gestionar contraseña"
                      >
                        <KeyIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openRoleModal(user)}
                        className="p-1 text-gray-400 hover:text-purple-600"
                        title="Cambiar rol"
                      >
                        <TagIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1 ${user.is_active ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                        title={user.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {user.is_active ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
          <div className="text-sm text-gray-500">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              Página {pagination.page} de {totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <Modal title="Detalle de Usuario" onClose={() => setShowDetailModal(false)} size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserCircleIcon className="w-10 h-10 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role)}`}>
                  {selectedUser.role?.label || selectedUser.role?.name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Cédula" value={selectedUser.cedula || '-'} />
              <InfoField label="Teléfono" value={selectedUser.phone_number || '-'} />
              <InfoField label="Estado" value={selectedUser.is_active ? 'Activo' : 'Inactivo'} />
              <InfoField label="Email Verificado" value={selectedUser.is_email_verified ? 'Sí' : 'No'} />
              <InfoField label="Creado" value={new Date(selectedUser.created_at).toLocaleString()} />
              <InfoField label="Actualizado" value={selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : '-'} />
            </div>

            {/* Related records */}
            {selectedUser.patient && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Perfil de Paciente</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-green-600">Fecha Nac.:</span>
                  <span>{selectedUser.patient.birth_date || '-'}</span>
                  <span className="text-green-600">Género:</span>
                  <span>{selectedUser.patient.gender || '-'}</span>
                </div>
              </div>
            )}
            
            {selectedUser.doctor && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Perfil de Doctor</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-blue-600">Licencia:</span>
                  <span>{selectedUser.doctor.license_number || '-'}</span>
                  <span className="text-blue-600">Especialidad:</span>
                  <span>{selectedUser.doctor.specialty?.name || '-'}</span>
                </div>
              </div>
            )}

            {selectedUser.administrator && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Perfil de Administrador</h4>
                <div className="text-sm">
                  <span className="text-purple-600">Super Admin:</span>
                  <span className="ml-2">{selectedUser.administrator.is_super_admin ? 'Sí' : 'No'}</span>
                </div>
                {selectedUser.administrator.permissions?.length > 0 && (
                  <div className="mt-2">
                    <span className="text-purple-600 text-sm">Permisos:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.administrator.permissions.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Password Management Modal */}
      {showPasswordModal && selectedUser && (
        <Modal title="Gestión de Contraseña" onClose={() => setShowPasswordModal(false)}>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Usuario: <strong>{selectedUser.email}</strong>
            </div>

            {/* Generate Reset Token */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Generar Token de Restablecimiento</h4>
              <p className="text-sm text-gray-500 mb-3">
                Genera un token que el usuario puede usar para restablecer su contraseña.
              </p>
              <button
                onClick={handleGenerateResetToken}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Generar Token
              </button>
              {passwordData.token && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{passwordData.token}</code>
                    <button onClick={copyToken} className="p-1 hover:text-indigo-600">
                      {copiedToken ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Expira: {new Date(passwordData.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Set Password Directly */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                Establecer Contraseña Directamente
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Establece una nueva contraseña para el usuario. Use con precaución.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña (mín. 8 caracteres)"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSetPassword}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Establecer
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <Modal title="Cambiar Rol de Usuario" onClose={() => setShowRoleModal(false)}>
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Usuario: <strong>{selectedUser.email}</strong>
            </div>
            <div className="text-sm">
              Rol actual: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role)}`}>
                {selectedUser.role?.label || selectedUser.role?.name}
              </span>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Seleccione nuevo rol:</h4>
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleChangeRole(role.id)}
                    disabled={role.id === selectedUser.role_id}
                    className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      role.id === selectedUser.role_id ? 'border-indigo-500 bg-indigo-50' : ''
                    }`}
                  >
                    <div className="font-medium">{role.label || role.name}</div>
                    <div className="text-sm text-gray-500">{role.description || `Código: ${role.code}`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}

// ============================================================================
// ROLES TAB
// ============================================================================

function RolesTab({ showNotification, onDataChange }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', label: '', description: '' });
  const [editPermissions, setEditPermissions] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Permissions matrix
  const permissionsMatrix = {
    citas: { label: 'Citas', permissions: ['ver', 'crear', 'reprogramar', 'cancelar', 'reasignar', 'checkin'] },
    facturacion: { label: 'Facturación', permissions: ['ver', 'registrar_pago', 'anular', 'exportar'] },
    doctores: { label: 'Doctores', permissions: ['ver', 'crear', 'editar', 'desactivar'] },
    pacientes: { label: 'Pacientes', permissions: ['ver', 'editar', 'desactivar', 'historial'] },
    horarios: { label: 'Horarios', permissions: ['ver', 'editar', 'excepciones'] },
    consultorios: { label: 'Consultorios', permissions: ['ver', 'crear', 'editar', 'desactivar'] },
    especialidades: { label: 'Especialidades', permissions: ['ver', 'crear', 'editar', 'eliminar'] },
    reportes: { label: 'Reportes', permissions: ['ver', 'exportar'] },
    auditoria: { label: 'Auditoría', permissions: ['ver', 'exportar'] },
    seguridad: { label: 'Seguridad', permissions: ['usuarios', 'roles', 'permisos', 'reset_password'] },
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await SecurityModel.getRoles();
      setRoles(data || []);
    } catch (error) {
      showNotification('Error al cargar roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isCoreRole = (code) => ['admin', 'doctor', 'patient'].includes(code);

  const openCreateModal = () => {
    setSelectedRole(null);
    setFormData({ name: '', code: '', label: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      code: role.code || '',
      label: role.label || '',
      description: role.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRole) {
        await SecurityModel.updateRole(selectedRole.id, formData);
        showNotification('Rol actualizado exitosamente');
      } else {
        await SecurityModel.createRole(formData);
        showNotification('Rol creado exitosamente');
      }
      setShowModal(false);
      loadRoles();
      onDataChange();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al guardar rol', 'error');
    }
  };

  const handleDelete = async (role) => {
    if (isCoreRole(role.code)) {
      showNotification('No se pueden eliminar roles del sistema', 'error');
      return;
    }
    setConfirmModal({
      show: true,
      title: 'Eliminar Rol',
      message: `¿Eliminar el rol "${role.label || role.name}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await SecurityModel.deleteRole(role.id);
          showNotification('Rol eliminado exitosamente');
          loadRoles();
          onDataChange();
        } catch (error) {
          showNotification(error.response?.data?.error || 'Error al eliminar rol', 'error');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const openPermissionsModal = (role) => {
    setSelectedRole(role);
    setEditPermissions(role.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleTogglePermission = (permission) => {
    setEditPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    try {
      await SecurityModel.updateRolePermissions(selectedRole.id, editPermissions);
      showNotification('Permisos actualizados exitosamente');
      setShowPermissionsModal(false);
      loadRoles();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al guardar permisos', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Catálogo de Roles</h3>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Rol
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No hay roles registrados
          </div>
        ) : (
          roles.map(role => (
            <div
              key={role.id}
              className={`bg-white rounded-lg border p-4 ${isCoreRole(role.code) ? 'border-indigo-200' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCoreRole(role.code) ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <TagIcon className={`w-6 h-6 ${isCoreRole(role.code) ? 'text-indigo-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{role.label || role.name}</h4>
                    <p className="text-sm text-gray-500">Código: {role.code}</p>
                  </div>
                </div>
                {isCoreRole(role.code) && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">Sistema</span>
                )}
              </div>
              
              {role.description && (
                <p className="mt-3 text-sm text-gray-600">{role.description}</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UsersIcon className="w-4 h-4" />
                  <span>{role.user_count || 0} usuarios</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPermissionsModal(role)}
                    className="p-1 text-gray-400 hover:text-purple-600"
                    title="Gestionar Permisos"
                  >
                    <KeyIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Editar"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  {!isCoreRole(role.code) && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions count */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {(role.permissions || []).length} permisos asignados
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role Modal */}
      {showModal && (
        <Modal
          title={selectedRole ? 'Editar Rol' : 'Nuevo Rol'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="ej. Administrador"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código*</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(f => ({ ...f, code: e.target.value.toLowerCase() }))}
                required
                disabled={selectedRole && isCoreRole(selectedRole.code)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                placeholder="ej. admin"
              />
              {selectedRole && isCoreRole(selectedRole.code) && (
                <p className="text-xs text-gray-500 mt-1">No se puede cambiar el código de roles del sistema</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(f => ({ ...f, label: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="ej. Administrador del Sistema"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Descripción del rol..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {selectedRole ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <Modal
          title={`Permisos: ${selectedRole.label || selectedRole.name}`}
          onClose={() => setShowPermissionsModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Seleccione los permisos que tendrán todos los usuarios con este rol.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-4">
              {Object.entries(permissionsMatrix).map(([module, { label, permissions }]) => (
                <div key={module} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map((action) => {
                      const permission = `${module}.${action}`;
                      const isChecked = editPermissions.includes(permission);
                      return (
                        <label
                          key={permission}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(permission)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                {editPermissions.length} permisos seleccionados
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}

// ============================================================================
// ADMINISTRATORS TAB
// ============================================================================

function AdministratorsTab({ showNotification, onDataChange }) {
  const [administrators, setAdministrators] = useState([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editPermissions, setEditPermissions] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [admins, matrix] = await Promise.all([
        SecurityModel.getAdministrators(),
        SecurityModel.getPermissionsMatrix()
      ]);
      setAdministrators(admins || []);
      setPermissionsMatrix(matrix || {});
    } catch (error) {
      showNotification('Error al cargar administradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = (admin) => {
    setSelectedAdmin(admin);
    setEditPermissions(admin.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleTogglePermission = (permission) => {
    setEditPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    try {
      await SecurityModel.updateAdminPermissions(selectedAdmin.id, editPermissions);
      showNotification('Permisos actualizados exitosamente');
      setShowPermissionsModal(false);
      loadData();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error al actualizar permisos', 'error');
    }
  };

  const handleToggleSuperAdmin = async (admin) => {
    const action = admin.is_super_admin ? 'quitar' : 'otorgar';
    setConfirmModal({
      show: true,
      title: admin.is_super_admin ? 'Quitar Super Admin' : 'Otorgar Super Admin',
      message: `¿${action.charAt(0).toUpperCase() + action.slice(1)} permisos de Super Administrador a ${admin.user?.first_name}?`,
      type: admin.is_super_admin ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          await SecurityModel.toggleSuperAdmin(admin.id, !admin.is_super_admin);
          showNotification(`Super Admin ${admin.is_super_admin ? 'removido' : 'otorgado'} exitosamente`);
          loadData();
          onDataChange();
        } catch (error) {
          showNotification(error.response?.data?.error || 'Error al cambiar estado', 'error');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Flatten permissions for display
  const allPermissions = Object.entries(permissionsMatrix).flatMap(([module, actions]) =>
    Object.keys(actions).map(action => `${module}:${action}`)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Administradores del Sistema</h3>
          <p className="text-sm text-gray-500">Gestiona los permisos de los administradores</p>
        </div>
      </div>

      {/* Administrators List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Administrador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Super Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permisos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando...
                </td>
              </tr>
            ) : administrators.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No hay administradores registrados
                </td>
              </tr>
            ) : (
              administrators.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {admin.user?.first_name} {admin.user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{admin.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleSuperAdmin(admin)}
                      className="flex items-center gap-1"
                    >
                      {admin.is_super_admin ? (
                        <StarIconSolid className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <StarIcon className="w-6 h-6 text-gray-300 hover:text-yellow-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {admin.is_super_admin ? (
                      <span className="text-sm text-gray-500 italic">Todos los permisos</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {(admin.permissions || []).slice(0, 3).map(p => (
                          <span key={p} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{p}</span>
                        ))}
                        {(admin.permissions?.length || 0) > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{admin.permissions.length - 3} más
                          </span>
                        )}
                        {(!admin.permissions || admin.permissions.length === 0) && (
                          <span className="text-sm text-gray-400">Sin permisos específicos</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openPermissionsModal(admin)}
                      disabled={admin.is_super_admin}
                      className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Gestionar Permisos
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedAdmin && (
        <Modal
          title={`Permisos: ${selectedAdmin.user?.first_name} ${selectedAdmin.user?.last_name}`}
          onClose={() => setShowPermissionsModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Seleccione los permisos que desea otorgar a este administrador.
            </p>

            <div className="max-h-96 overflow-y-auto space-y-4">
              {Object.entries(permissionsMatrix).map(([module, actions]) => (
                <div key={module} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 capitalize mb-3">{module}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(actions).map(([action, description]) => {
                      const permission = `${module}:${action}`;
                      const isChecked = editPermissions.includes(permission);
                      return (
                        <label
                          key={permission}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(permission)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">{action}</span>
                            <p className="text-xs text-gray-500">{description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                {editPermissions.length} permisos seleccionados
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}

// ============================================================================
// AUDIT TAB
// ============================================================================

function AuditTab({ showNotification }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ 
    action: '', 
    table_name: '', 
    user_id: '', 
    start_date: '', 
    end_date: '' 
  });
  const [filterOptions, setFilterOptions] = useState({ actions: [], tables: [] });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
    loadFilterOptions();
  }, [pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      };
      const response = await SecurityModel.getAuditLogs(params);
      setLogs(response.data || []);
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }));
    } catch (error) {
      showNotification('Error al cargar logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const options = await SecurityModel.getAuditLogFilters();
      setFilterOptions(options || { actions: [], tables: [] });
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const clearFilters = () => {
    setFilters({ action: '', table_name: '', user_id: '', start_date: '', end_date: '' });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Registro de Auditoría</h3>
          <p className="text-sm text-gray-500">Historial de actividades del sistema</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
            showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {filterOptions.actions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
              <select
                value={filters.table_name}
                onChange={(e) => setFilters(f => ({ ...f, table_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {filterOptions.tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No se encontraron registros de auditoría
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp || log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {log.user?.first_name} {log.user?.last_name}
                      </p>
                      <p className="text-gray-500">{log.user?.email || 'Sistema'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.table_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
          <div className="text-sm text-gray-500">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              Página {pagination.page} de {totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Modal({ title, children, onClose, size = 'md' }) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function ConfirmModal({ show, title, message, onConfirm, onCancel, type = 'warning' }) {
  if (!show) return null;

  const typeStyles = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      icon: CheckCircleIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
  };

  const style = typeStyles[type] || typeStyles.warning;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${style.iconBg}`}>
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg font-medium ${style.buttonBg}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

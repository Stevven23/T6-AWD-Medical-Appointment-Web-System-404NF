import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  UserIcon,
  ComputerDesktopIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 50;
  
  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, tableFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit: perPage };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (tableFilter !== 'all') params.table_name = tableFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const response = await crudApi.get('/audit-logs', { params });
      const data = response.data.data || response.data || [];
      setLogs(Array.isArray(data) ? data : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Tabla', 'ID Registro', 'IP', 'Descripción'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        formatDate(log.created_at),
        log.user?.email || log.user_id,
        log.action,
        log.table_name,
        log.record_id,
        log.ip_address || '-',
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const styles = {
      INSERT: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800', icon: InformationCircleIcon },
      DELETE: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon },
      LOGIN: { bg: 'bg-purple-100', text: 'text-purple-800', icon: UserIcon },
      LOGOUT: { bg: 'bg-gray-100', text: 'text-gray-800', icon: UserIcon },
    };
    const style = styles[action] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: DocumentTextIcon };
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    const email = (log.user?.email || '').toLowerCase();
    const description = (log.description || '').toLowerCase();
    return email.includes(search) || description.includes(search);
  });

  const uniqueTables = [...new Set(logs.map(l => l.table_name).filter(Boolean))];

  const stats = {
    total: logs.length,
    inserts: logs.filter(l => l.action === 'INSERT').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Registros de Auditoría</h2>
            <p className="text-gray-600">Historial de acciones en el sistema</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadLogs}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Actualizar
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inserciones</p>
                <p className="text-2xl font-bold text-green-600">{stats.inserts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <InformationCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Actualizaciones</p>
                <p className="text-2xl font-bold text-blue-600">{stats.updates}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Eliminaciones</p>
                <p className="text-2xl font-bold text-red-600">{stats.deletes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar usuario o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas las acciones</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>
          
          <select
            value={tableFilter}
            onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas las tablas</option>
            {uniqueTables.map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron registros</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        Fecha/Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <UserIcon className="w-4 h-4 inline mr-1" />
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Registro</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <ComputerDesktopIcon className="w-4 h-4 inline mr-1" />
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr 
                        key={log.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailModal(true);
                        }}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user?.first_name} {log.user?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{log.user?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {log.table_name}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.record_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          {log.ip_address || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                          {log.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Detalle del Registro</h3>
                {getActionBadge(selectedLog.action)}
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Fecha y Hora</label>
                    <p className="font-medium text-gray-800">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Usuario</label>
                    <p className="font-medium text-gray-800">
                      {selectedLog.user?.first_name} {selectedLog.user?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedLog.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Tabla</label>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{selectedLog.table_name}</code>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">ID Registro</label>
                    <p className="font-medium text-gray-800">{selectedLog.record_id || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Dirección IP</label>
                    <p className="font-mono text-gray-800">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">User Agent</label>
                    <p className="text-sm text-gray-600 truncate">{selectedLog.user_agent || '-'}</p>
                  </div>
                </div>

                {selectedLog.description && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-700">{selectedLog.description}</p>
                  </div>
                )}

                {selectedLog.old_values && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valores Anteriores</label>
                    <pre className="p-3 bg-red-50 rounded-lg text-sm text-red-800 overflow-x-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nuevos Valores</label>
                    <pre className="p-3 bg-green-50 rounded-lg text-sm text-green-800 overflow-x-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

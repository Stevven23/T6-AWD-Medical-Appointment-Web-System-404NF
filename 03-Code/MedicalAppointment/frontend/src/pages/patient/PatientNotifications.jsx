/**
 * Patient Notifications Page
 * Displays all notifications for the patient including:
 * - Appointment confirmations, reminders, cancellations
 * - Prescription renewals (approved/rejected)
 * - System messages and admin announcements
 * 
 * @module pages/patient/PatientNotifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import PatientLayout from '../../layouts/PatientLayout';
import AppointmentModel from '../../models/Appointment.model';
import PrescriptionModel from '../../models/Prescription.model';
import NotificationModel from '../../models/Notification.model';
import MedicalRecordModel from '../../models/MedicalRecord.model';
import BillingModel from '../../models/Billing.model';
import WaitingListModel from '../../models/WaitingList.model';
import {
  BellIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckIcon,
  FunnelIcon,
  ArrowPathIcon,
  BeakerIcon,
  CurrencyDollarIcon,

} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

// Storage key for read notifications
const READ_NOTIFICATIONS_KEY = 'patient_read_notifications';
const DELETED_NOTIFICATIONS_KEY = 'patient_deleted_notifications';

/**
 * Get time ago string from date
 */
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Notification type configuration
 */
const NOTIFICATION_TYPES = {
  appointment_confirmed: {
    icon: CalendarIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Cita Confirmada'
  },
  appointment_reminder: {
    icon: ClockIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Recordatorio'
  },
  appointment_cancelled: {
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Cita Cancelada'
  },
  appointment_rescheduled: {
    icon: ArrowPathIcon,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Cita Reprogramada'
  },
  prescription_ready: {
    icon: DocumentTextIcon,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Receta Lista'
  },
  renewal_approved: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Renovación Aprobada'
  },
  renewal_rejected: {
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Renovación Rechazada'
  },
  renewal_pending: {
    icon: ClockIcon,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Renovación Pendiente'
  },
  lab_results_ready: {
    icon: BeakerIcon,
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
    label: 'Resultados de Lab'
  },
  lab_ordered: {
    icon: BeakerIcon,
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    label: 'Examen Ordenado'
  },
  billing_new: {
    icon: CurrencyDollarIcon,
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    label: 'Nueva Factura'
  },
  billing_paid: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Pago Confirmado'
  },
  billing_overdue: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Factura Vencida'
  },
  announcement: {
    icon: MegaphoneIcon,
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    label: 'Anuncio'
  },
  system: {
    icon: BellIcon,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    label: 'Sistema'
  }
};

export default function PatientNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    const saved = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  /**
   * Generate notifications from appointments and prescriptions
   */
  const generateNotifications = useCallback(async () => {
    const generatedNotifications = [];
    
    try {
      // Fetch recent appointments for this patient
      const appointmentsResponse = await AppointmentModel.getPatientAppointments({
        limit: 50
      });

      const appointments = appointmentsResponse?.data || appointmentsResponse || [];

      // Generate notifications from appointments
      appointments.forEach(apt => {
        const doctorName = apt.doctor_first_name 
          ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name || ''}`
          : (apt.doctor?.user?.first_name 
            ? `Dr. ${apt.doctor.user.first_name} ${apt.doctor.user.last_name}`
            : 'Tu médico');
        const specialty = apt.specialty_name || apt.doctor?.specialty?.name || '';
        const dateStr = new Date(apt.scheduled_start).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        });
        const status = apt.status_code || apt.status;

        // Confirmed appointments
        if (status === 'scheduled' || status === 'confirmed') {
          generatedNotifications.push({
            id: `apt-confirmed-${apt.id}`,
            type: 'appointment_confirmed',
            title: 'Cita Confirmada',
            message: `Tu cita con ${doctorName}${specialty ? ` (${specialty})` : ''} ha sido confirmada para el ${dateStr}`,
            date: apt.created_at,
            relatedId: apt.id,
            relatedType: 'appointment'
          });
        }

        // Completed appointments - may have prescription
        if (status === 'completed') {
          generatedNotifications.push({
            id: `apt-completed-${apt.id}`,
            type: 'prescription_ready',
            title: 'Consulta Completada',
            message: `Tu consulta con ${doctorName} ha sido completada. Revisa tus recetas si fueron emitidas.`,
            date: apt.updated_at || apt.scheduled_end,
            relatedId: apt.id,
            relatedType: 'appointment'
          });
        }

        // Cancelled appointments
        if (status === 'cancelled') {
          generatedNotifications.push({
            id: `apt-cancelled-${apt.id}`,
            type: 'appointment_cancelled',
            title: 'Cita Cancelada',
            message: `La cita con ${doctorName} para el ${dateStr} ha sido cancelada.${apt.cancellation_reason ? ` Motivo: ${apt.cancellation_reason}` : ''}`,
            date: apt.updated_at || apt.created_at,
            relatedId: apt.id,
            relatedType: 'appointment'
          });
        }

        // Upcoming appointment reminders (within 48 hours)
        if (status === 'scheduled' || status === 'confirmed') {
          const aptDate = new Date(apt.scheduled_start);
          const now = new Date();
          const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
          
          if (hoursUntil > 0 && hoursUntil <= 48) {
            generatedNotifications.push({
              id: `apt-reminder-${apt.id}`,
              type: 'appointment_reminder',
              title: 'Recordatorio de Cita',
              message: `Tienes una cita con ${doctorName} ${hoursUntil <= 24 ? 'mañana' : 'pronto'} - ${dateStr}`,
              date: new Date().toISOString(), // Show as recent
              relatedId: apt.id,
              relatedType: 'appointment'
            });
          }
        }
      });

      // Fetch prescription renewals
      try {
        const renewalsResponse = await PrescriptionModel.getRenewals({
          patient_id: user?.patientId || user?.id,
          limit: 20
        });

        const renewals = renewalsResponse?.data || renewalsResponse || [];

        renewals.forEach(renewal => {
          const medicationName = renewal.prescription?.medications?.[0]?.name || renewal.prescription?.diagnosis || 'tu medicamento';
          const now = new Date();
          const reviewDate = new Date(renewal.reviewed_at || renewal.updated_at || renewal.created_at);
          const hoursAgo = (now - reviewDate) / (1000 * 60 * 60);
          
          if (renewal.status === 'approved' && hoursAgo <= 168) {
            generatedNotifications.push({
              id: `renewal-approved-${renewal.id}`,
              type: 'renewal_approved',
              title: 'Renovación Aprobada',
              message: `Tu solicitud de renovación para ${medicationName} ha sido aprobada.`,
              date: renewal.reviewed_at || renewal.updated_at,
              relatedId: renewal.id,
              relatedType: 'renewal'
            });
          } else if (renewal.status === 'rejected' && hoursAgo <= 168) {
            generatedNotifications.push({
              id: `renewal-rejected-${renewal.id}`,
              type: 'renewal_rejected',
              title: 'Renovación Rechazada',
              message: `Tu solicitud de renovación para ${medicationName} ha sido rechazada.${renewal.rejection_reason ? ` Motivo: ${renewal.rejection_reason}` : ''}`,
              date: renewal.reviewed_at || renewal.updated_at,
              relatedId: renewal.id,
              relatedType: 'renewal'
            });
          } else if (renewal.status === 'pending') {
            generatedNotifications.push({
              id: `renewal-pending-${renewal.id}`,
              type: 'renewal_pending',
              title: 'Renovación Pendiente',
              message: `Tu solicitud de renovación para ${medicationName} está pendiente de revisión por el doctor.`,
              date: renewal.created_at,
              relatedId: renewal.id,
              relatedType: 'renewal'
            });
          }
        });
      } catch (renewalError) {
        console.log('[Notifications] Could not fetch renewals:', renewalError.message);
      }

      // Fetch lab results notifications
      try {
        const labReportsResponse = await MedicalRecordModel.getLabReports();
        const labReports = labReportsResponse?.data || labReportsResponse || [];
        const now = new Date();

        labReports.forEach(report => {
          const reportDate = new Date(report.created_at);
          const hoursAgo = (now - reportDate) / (1000 * 60 * 60);

          // Lab results completed in last 7 days
          if (report.status === 'completed' && hoursAgo <= 168) {
            generatedNotifications.push({
              id: `lab-ready-${report.id}`,
              type: 'lab_results_ready',
              title: 'Resultados de Laboratorio Listos',
              message: `Los resultados de "${report.test_name}" ya están disponibles. Revisa tu historial.`,
              date: report.created_at,
              relatedId: report.id,
              relatedType: 'lab_report'
            });
          }

          // Lab ordered in last 3 days
          if ((report.status === 'pending' || report.status === 'processing') && hoursAgo <= 72) {
            generatedNotifications.push({
              id: `lab-ordered-${report.id}`,
              type: 'lab_ordered',
              title: 'Examen de Laboratorio Ordenado',
              message: `Se ha ordenado el examen "${report.test_name}". Estado: ${report.status === 'pending' ? 'Pendiente' : 'En proceso'}`,
              date: report.created_at,
              relatedId: report.id,
              relatedType: 'lab_report'
            });
          }
        });
      } catch (labError) {
        console.log('[Notifications] Could not fetch lab reports:', labError.message);
      }

      // Fetch billing notifications
      try {
        const billingsResponse = await BillingModel.getAll({ limit: 20 });
        const billings = billingsResponse?.data || billingsResponse || [];
        const now = new Date();

        billings.forEach(billing => {
          const billingDate = new Date(billing.created_at);
          const hoursAgo = (now - billingDate) / (1000 * 60 * 60);

          // New pending billings in last 7 days
          if (billing.status === 'pending' && hoursAgo <= 168) {
            generatedNotifications.push({
              id: `billing-new-${billing.id}`,
              type: 'billing_new',
              title: 'Nueva Factura Generada',
              message: `Tienes una nueva factura por $${parseFloat(billing.total_amount).toFixed(2)}. Factura #${billing.invoice_number || billing.id.slice(0, 8)}`,
              date: billing.created_at,
              relatedId: billing.id,
              relatedType: 'billing'
            });
          }

          // Paid billings in last 3 days
          if (billing.status === 'paid' && billing.payment_date) {
            const paidDate = new Date(billing.payment_date);
            const paidHoursAgo = (now - paidDate) / (1000 * 60 * 60);
            if (paidHoursAgo <= 72) {
              generatedNotifications.push({
                id: `billing-paid-${billing.id}`,
                type: 'billing_paid',
                title: 'Pago Confirmado',
                message: `Tu pago de $${parseFloat(billing.total_amount).toFixed(2)} ha sido confirmado. Factura #${billing.invoice_number || billing.id.slice(0, 8)}`,
                date: billing.payment_date,
                relatedId: billing.id,
                relatedType: 'billing'
              });
            }
          }

          // Overdue billings
          if (billing.status === 'pending' && billing.due_date) {
            const dueDate = new Date(billing.due_date);
            if (now > dueDate) {
              generatedNotifications.push({
                id: `billing-overdue-${billing.id}`,
                type: 'billing_overdue',
                title: 'Factura Vencida',
                message: `La factura #${billing.invoice_number || billing.id.slice(0, 8)} por $${parseFloat(billing.total_amount).toFixed(2)} está vencida.`,
                date: billing.due_date,
                relatedId: billing.id,
                relatedType: 'billing'
              });
            }
          }
        });
      } catch (billingError) {
        console.log('[Notifications] Could not fetch billings:', billingError.message);
      }

      // Fetch system/admin notifications from database
      try {
        const dbNotifications = await NotificationModel.getUserNotifications({ limit: 50 });
        
        dbNotifications.forEach(notif => {
          generatedNotifications.push({
            id: `db-${notif.id}`,
            type: notif.notification_type || 'system',
            title: notif.title,
            message: notif.message,
            date: notif.created_at,
            relatedId: notif.id,
            relatedType: 'notification',
            priority: notif.priority,
            isFromDb: true
          });
        });
      } catch (dbError) {
        console.log('[Notifications] Could not fetch system notifications:', dbError.message);
        // Continue without db notifications
      }

    } catch (err) {
      console.error('[Notifications] Error fetching data:', err);
      throw err;
    }

    // Sort by date descending and filter deleted
    return generatedNotifications
      .filter(n => !deletedNotifications.includes(n.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [user, deletedNotifications]);

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const generated = await generateNotifications();
      setNotifications(generated);
    } catch (err) {
      console.error('[PatientNotifications] Error:', err);
      setError('Error al cargar notificaciones');
      // Show empty state instead of crashing
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [generateNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /**
   * Save read notifications to localStorage
   */
  useEffect(() => {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotifications));
  }, [readNotifications]);

  /**
   * Save deleted notifications to localStorage
   */
  useEffect(() => {
    localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(deletedNotifications));
  }, [deletedNotifications]);

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId) => {
    if (!readNotifications.includes(notificationId)) {
      setReadNotifications(prev => [...prev, notificationId]);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(prev => [...new Set([...prev, ...allIds])]);
  };

  /**
   * Delete notification
   */
  const deleteNotification = (notificationId) => {
    setDeletedNotifications(prev => [...prev, notificationId]);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  /**
   * Check if notification is read
   */
  const isRead = (notificationId) => readNotifications.includes(notificationId);

  /**
   * Get filtered notifications based on active tab
   */
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !isRead(n.id));
      case 'appointments':
        return notifications.filter(n => 
          n.type.startsWith('appointment_') || n.type === 'prescription_ready'
        );
      case 'prescriptions':
        return notifications.filter(n => 
          n.type.startsWith('renewal_') || n.type === 'prescription_ready'
        );
      case 'lab':
        return notifications.filter(n => n.type.startsWith('lab_'));
      case 'billing':
        return notifications.filter(n => n.type.startsWith('billing_'));
      case 'system':
        return notifications.filter(n => n.type === 'announcement' || n.type === 'system');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !isRead(n.id)).length;
  const labCount = notifications.filter(n => n.type.startsWith('lab_')).length;
  const billingCount = notifications.filter(n => n.type.startsWith('billing_')).length;
  const systemCount = notifications.filter(n => n.type === 'announcement' || n.type === 'system').length;

  // Store unread count in localStorage for the layout badge
  useEffect(() => {
    localStorage.setItem('patient_unread_notifications_count', unreadCount.toString());
    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent('patientNotificationCountUpdate', { detail: { count: unreadCount } }));
  }, [unreadCount]);

  // Tabs configuration
  const tabs = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'Sin leer', count: unreadCount },
    { id: 'appointments', label: 'Citas', count: notifications.filter(n => n.type.startsWith('appointment_')).length },
    { id: 'prescriptions', label: 'Recetas', count: notifications.filter(n => n.type.startsWith('renewal_') || n.type === 'prescription_ready').length },
    { id: 'lab', label: 'Laboratorio', count: labCount },
    { id: 'billing', label: 'Facturas', count: billingCount },
    { id: 'system', label: 'Sistema', count: systemCount }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <PatientLayout>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BellSolidIcon className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 
                ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                : 'Todas las notificaciones leídas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Actualizar"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
            >
              <CheckIcon className="h-4 w-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={loadNotifications}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.id 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No hay notificaciones</h3>
            <p className="text-gray-500 mt-1">
              {activeTab === 'unread' 
                ? 'Has leído todas tus notificaciones'
                : 'Las notificaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => {
            const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
            const IconComponent = config.icon;
            const notificationIsRead = isRead(notification.id);

            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`
                  relative flex items-start gap-4 p-4 rounded-lg border cursor-pointer
                  transition-all duration-200
                  ${notificationIsRead 
                    ? 'bg-white border-gray-200 hover:bg-gray-50' 
                    : 'bg-primary-50 border-primary-200 hover:bg-primary-100'}
                `}
              >
                {/* Unread indicator */}
                {!notificationIsRead && (
                  <div className="absolute top-4 left-0 w-1 h-8 bg-primary-500 rounded-r-full" />
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor} font-medium mb-1`}>
                        {config.label}
                      </span>
                      <h3 className={`font-medium ${notificationIsRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getTimeAgo(notification.date)}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${notificationIsRead ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {!notificationIsRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded transition"
                      title="Marcar como leída"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      {notifications.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
        </div>
      )}
    </div>
    </PatientLayout>
  );
}

// Notification Management System
class NotificationManager {
    constructor() {
        this.notifications = this.loadNotifications();
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.checkAppointmentReminders();
        this.renderNotifications();
    }

    // LocalStorage methods
    loadNotifications() {
        const stored = localStorage.getItem('clinicaNotifications');
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getInitialData();
    }

    saveNotifications() {
        localStorage.setItem('clinicaNotifications', JSON.stringify(this.notifications));
        this.renderNotifications();
    }

    getInitialData() {
        return [
            {
                id: 1,
                type: 'appointment',
                title: 'Recordatorio de Cita',
                message: 'Tienes una cita programada para el 25 de octubre a las 10:30 AM con Dr. Sofia Pérez',
                date: new Date().toISOString(),
                read: false,
                priority: 'high'
            },
            {
                id: 2,
                type: 'lab',
                title: 'Resultados Disponibles',
                message: 'Los resultados de tu análisis de sangre del 15 de octubre ya están disponibles',
                date: new Date().toISOString(),
                read: false,
                priority: 'medium'
            }
        ];
    }

    // Solicitar permiso para notificaciones del navegador
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // Crear notificación
    createNotification(notificationData) {
        const newId = this.notifications.length > 0 
            ? Math.max(...this.notifications.map(n => n.id)) + 1 
            : 1;

        const newNotification = {
            id: newId,
            ...notificationData,
            date: new Date().toISOString(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        
        // Mostrar notificación del navegador
        this.showBrowserNotification(newNotification);
        
        // Mostrar toast
        this.showNotificationToast(newNotification);
    }

    // Crear notificación de cita
    createAppointmentNotification(appointment) {
        this.createNotification({
            type: 'appointment',
            title: 'Nueva Cita Agendada',
            message: `Tu cita con ${appointment.doctorName} ha sido agendada para el ${new Date(appointment.date).toLocaleDateString('es-EC')} a las ${this.formatTime(appointment.time)}`,
            priority: 'high',
            appointmentId: appointment.id
        });
    }

    // Programar recordatorio de cita (24 horas antes)
    scheduleAppointmentReminder(appointment) {
        const existingReminder = this.notifications.find(n => 
            n.type === 'reminder' && n.appointmentId === appointment.id
        );

        if (!existingReminder) {
            this.createNotification({
                type: 'reminder',
                title: 'Recordatorio de Cita',
                message: `Tienes una cita mañana con ${appointment.doctorName} a las ${this.formatTime(appointment.time)}`,
                priority: 'high',
                appointmentId: appointment.id
            });
        }
    }

    // Verificar recordatorios de citas próximas
    checkAppointmentReminders() {
        if (!window.appointmentManager) return;

        const appointments = window.appointmentManager.appointments;
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        appointments.forEach(appointment => {
            if (appointment.status === 'confirmed') {
                const appointmentDate = new Date(appointment.date);
                
                // Si la cita es mañana
                if (appointmentDate.toDateString() === tomorrow.toDateString()) {
                    this.scheduleAppointmentReminder(appointment);
                }
            }
        });
    }

    // Mostrar notificación del navegador
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '../../sources/img/logo.png',
                badge: '../../sources/img/logo.png',
                tag: `notification-${notification.id}`
            });
        }
    }

    // Toast notification
    showNotificationToast(notification) {
        const existingToast = document.querySelector('.notification-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        
        const priorityIcon = {
            'high': 'fa-exclamation-circle',
            'medium': 'fa-info-circle',
            'low': 'fa-bell'
        };

        toast.innerHTML = `
            <i class="fas ${priorityIcon[notification.priority] || 'fa-bell'}"></i>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
            </div>
            <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Marcar notificación como leída
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
        }
    }

    // Marcar todas como leídas
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
    }

    // Eliminar notificación
    deleteNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications.splice(index, 1);
            this.saveNotifications();
        }
    }

    // Obtener notificaciones no leídas
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Renderizar notificaciones en el dashboard
    renderNotifications() {
        const container = document.querySelector('.notifications');
        if (!container) return;

        const recentNotifications = this.notifications.slice(0, 5);

        if (recentNotifications.length === 0) {
            container.innerHTML = `
                <h3>Notificaciones</h3>
                <div style="text-align: center; padding: 20px; color: #999;">
                    <p>No tienes notificaciones</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = recentNotifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : ''} ${notification.priority}">
                <div class="title">${notification.title}</div>
                <div class="text">${notification.message}</div>
                <div class="notification-footer">
                    <span class="notification-date">${this.formatDate(notification.date)}</span>
                    ${!notification.read ? `<button class="btn-mark-read" onclick="notificationManager.markAsRead(${notification.id})">Marcar como leída</button>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <h3>Notificaciones</h3>
            ${notificationsHTML}
        `;

        // Actualizar contador de notificaciones no leídas
        this.updateUnreadBadge();
    }

    // Actualizar badge de notificaciones no leídas
    updateUnreadBadge() {
        const unreadCount = this.getUnreadCount();
        let badge = document.querySelector('.notification-badge');
        
        if (unreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                const notificationLink = document.querySelector('a[href*="Notifications"]');
                if (notificationLink) {
                    notificationLink.style.position = 'relative';
                    notificationLink.appendChild(badge);
                }
            }
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    // Helper methods
    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'Hace un momento';
        if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        
        return date.toLocaleDateString('es-EC');
    }
}

// Inicializar cuando el DOM esté listo
let notificationManager;
document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
});

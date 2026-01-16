# Guía de Uso - Panel de Doctor

## Introducción

Bienvenido al panel de doctor mejorado. Este documento te guiará a través de todas las funcionalidades disponibles para gestionar tu práctica médica.

## Navegación General

El panel de doctor se divide en las siguientes secciones:

### 1. **Inicio (Dashboard)**
**Ruta:** `/doctor/dashboard`

- **Calendario del mes:** Visualiza en qué días tienes disponibilidad
- **Próximas citas:** Listado de citas próximas con pacientes
- **Estadísticas:** Resumen de citas hoy, próximas citas y pacientes atendidos

### 2. **Mi Agenda (Semanal)**
**Ruta:** `/doctor/appointments`

- **Vista de calendario semanal:** Visualiza las citas hora por hora
- **Navegación:** Cambiar entre semanas con las flechas
- **Listado de citas:** Detalles de todas las citas de la semana
- **Estados:** Verde (completada), Rojo (cancelada), Azul (programada)

### 3. **Agendar Cita**
**Ruta:** `/doctor/schedule-appointment`

- **Seleccionar paciente:** Elige el paciente para agendar
- **Seleccionar fecha:** Elige la fecha de la cita (no puede ser pasada)
- **Seleccionar hora:** Elige la hora disponible
- **Tipo de consulta:** General, Seguimiento, Evaluación, Procedimiento o Emergencia
- **Motivo:** Campo opcional para especificar el motivo
- **Confirmar:** Resumen antes de agendar

### 4. **Mis Pacientes**
**Ruta:** `/doctor/patients`

- **Listado de pacientes:** Tabla con todos tus pacientes
- **Búsqueda:** Busca por nombre o cédula
- **Detalles del paciente:** 
  - Información personal (edad, género, tipo de sangre)
  - Contacto (teléfono, email, dirección)
  - Información médica (alergias, condiciones crónicas, medicamentos)
  - Última visita

### 5. **Recetas Médicas**
**Ruta:** `/doctor/prescriptions`

- **Paso 1 - Seleccionar paciente:** Elige al paciente
- **Paso 2 - Ver/Crear receta:**
  - Ver historial de recetas anteriores
  - Crear nueva receta con:
    - Diagnóstico
    - Medicamentos (con dosis)
    - Indicaciones
    - Duración del tratamiento
  - Eliminar recetas existentes
- **Paso 3 - Ver detalle:**
  - Visualizar receta completa
  - Imprimir para dar al paciente

### 6. **Mi Horario Laboral**
**Ruta:** `/doctor/schedule`

- **Seleccionar día:** Elige el día de la semana a configurar
- **Trabajar este día:** Checkbox para indicar si trabajas ese día
- **Horas de trabajo:** Hora de inicio y término
- **Duración de citas:** 15, 30, 45 minutos o 1 hora
- **Tiempo de descanso:** Especifica si tienes descanso (hora de inicio y término)
- **Resumen semanal:** Vista de todos los días configurados

### 7. **Mensajes**
**Ruta:** `/doctor/messages`

- **Bandeja de entrada:** Listado de mensajes
- **Búsqueda:** Busca mensajes por remitente o asunto
- **Leer mensaje:** Haz clic para ver el contenido completo
- **Responder:** Escribe tu respuesta
- **Eliminar:** Borra mensajes que no necesites

### 8. **Reportes**
**Ruta:** `/doctor/reports`

- **Filtros:**
  - Tipo de reporte (Citas, Pacientes, Ingresos, Tratamientos)
  - Rango de fechas (Hoy, Esta semana, Este mes, Este año, Todos)
- **Estadísticas:**
  - Total de citas
  - Citas completadas
  - Pacientes atendidos
  - Calificación promedio
- **Tabla detallada:** Información completa de citas
- **Exportación:** Descargar Excel, PDF o imprimir

### 9. **Mi Perfil**
**Ruta:** `/doctor/profile`

- **Información Personal:**
  - Nombre y apellido
  - Email
  - Teléfono
  - Especialización
  - Número de licencia
  - Dirección, ciudad, provincia
- **Cambiar Contraseña:**
  - Contraseña actual (requerida)
  - Nueva contraseña
  - Confirmar nueva contraseña
  - Requisitos: Mínimo 8 caracteres, mayúsculas, minúsculas y números

## Consejos de Uso

### Gestión de Citas
1. Configura tu horario laboral primero en "Mi Horario Laboral"
2. Luego puedes agendar citas para tus pacientes
3. Visualiza tu agenda semanal para planificar mejor

### Recetas Médicas
1. Selecciona el paciente
2. Visualiza sus recetas anteriores para mantener continuidad
3. Crea una nueva receta con detalles claros
4. Imprime la receta antes de entregar al paciente

### Pacientes
1. Revisa la información médica importante antes de cada cita
2. Actualiza alergias y condiciones cuando sea necesario
3. Consulta el historial de visitas

### Reportes
1. Usa reportes para evaluar tu productividad
2. Analiza qué tipos de consultas son más frecuentes
3. Descarga reportes para documentación

## Soporte

Si encuentras algún problema o tienes preguntas:
- Contacta al equipo de soporte
- Revisa la documentación técnica
- Reporta bugs directamente

## Actualizaciones Recientes

- ✅ Migración completa a React
- ✅ Diseño mejorado con Tailwind CSS
- ✅ Mejor navegación y UX
- ✅ Nueva vista de agenda semanal
- ✅ Gestión mejorada de recetas
- ✅ Reportes interactivos

---

**Última actualización:** Enero 2025
**Versión:** 2.0

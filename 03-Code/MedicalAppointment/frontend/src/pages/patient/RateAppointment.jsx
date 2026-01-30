import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppointmentModel, DoctorRatingModel } from '../../models';
import {
  StarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function RateAppointment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  
  const [formData, setFormData] = useState({
    rating: 0,
    punctuality_rating: 0,
    attention_rating: 0,
    recommendation_rating: 0,
    comment: '',
  });

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      
      // Load appointment
      const aptResponse = await AppointmentModel.getById(appointmentId);
      const aptData = aptResponse.data || aptResponse;
      setAppointment(aptData);
      
      // Check if already rated
      try {
        const ratingResponse = await DoctorRatingModel.getByAppointment(appointmentId);
        if (ratingResponse.data) {
          setExistingRating(ratingResponse.data);
          setFormData({
            rating: ratingResponse.data.rating || 0,
            punctuality_rating: ratingResponse.data.punctuality_rating || 0,
            attention_rating: ratingResponse.data.attention_rating || 0,
            recommendation_rating: ratingResponse.data.recommendation_rating || 0,
            comment: ratingResponse.data.comment || '',
          });
        }
      } catch (err) {
        // No existing rating, that's okay
      }
    } catch (err) {
      console.error('Error loading appointment:', err);
      setError('No se pudo cargar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Por favor, seleccione una calificación general');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const ratingData = {
        ...formData,
        doctor_id: appointment.doctor_id,
        patient_user_id: appointment.patient_user_id,
        appointment_id: appointmentId,
      };

      if (existingRating) {
        await DoctorRatingModel.update(existingRating.id, ratingData);
      } else {
        await DoctorRatingModel.create(ratingData);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-32">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition"
          >
            {star <= value ? (
              <StarSolidIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const formatDate = (scheduledStart) => {
    if (!scheduledStart) return 'N/A';
    return new Date(scheduledStart).toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Gracias por tu opinión!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu calificación nos ayuda a mejorar la calidad de nuestro servicio
          </p>
          <Link 
            to="/patient/appointments"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Volver a Mis Citas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Mis Citas
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h1 className="text-xl font-bold mb-1">Calificar Consulta</h1>
            <p className="opacity-90">Tu opinión es muy importante para nosotros</p>
          </div>

          {/* Appointment Info */}
          {appointment && (
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Dr(a). {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appointment.doctor?.specialty?.name || 'Especialidad'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(appointment.scheduled_start)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rating Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Calificación General *</h3>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({...formData, rating: star})}
                    className="p-1 hover:scale-110 transition"
                  >
                    {star <= formData.rating ? (
                      <StarSolidIcon className="w-12 h-12 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-12 h-12 text-gray-300 hover:text-yellow-300" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500">
                {formData.rating === 1 && 'Muy malo'}
                {formData.rating === 2 && 'Malo'}
                {formData.rating === 3 && 'Regular'}
                {formData.rating === 4 && 'Bueno'}
                {formData.rating === 5 && 'Excelente'}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-4">Calificaciones Específicas</h3>
              
              <StarRating 
                label="Puntualidad" 
                value={formData.punctuality_rating} 
                onChange={(v) => setFormData({...formData, punctuality_rating: v})} 
              />
              
              <StarRating 
                label="Atención" 
                value={formData.attention_rating} 
                onChange={(v) => setFormData({...formData, attention_rating: v})} 
              />
              
              <StarRating 
                label="¿Lo recomendaría?" 
                value={formData.recommendation_rating} 
                onChange={(v) => setFormData({...formData, recommendation_rating: v})} 
              />
            </div>

            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="Cuéntanos tu experiencia..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : existingRating ? 'Actualizar Calificación' : 'Enviar Calificación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

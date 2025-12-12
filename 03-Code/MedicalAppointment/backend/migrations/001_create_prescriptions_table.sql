-- Crear tabla de recetas médicas si no existe
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL,
  doctor_id uuid,
  diagnosis text NOT NULL,
  medications text NOT NULL,
  instructions text,
  duration character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_patient_user_id_fkey FOREIGN KEY (patient_user_id) REFERENCES public.users(id),
  CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_user_id ON public.prescriptions(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions(created_at);

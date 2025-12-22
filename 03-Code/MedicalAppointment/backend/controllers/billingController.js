// controllers/billingController.js
const supabase = require('../database');

const billingController = {
  // POST /api/billings - Crear factura
  createBilling: async (req, res) => {
    try {
      const {
        appointment_id,
        patient_user_id,
        doctor_id,
        base_amount,
        specialty_multiplier,
        duration_multiplier,
        insurance_discount_percentage,
        additional_charges,
        notes
      } = req.body;

      // Validaciones
      if (!appointment_id || !patient_user_id || !doctor_id || !base_amount) {
        return res.status(400).json({
          error: 'appointment_id, patient_user_id, doctor_id y base_amount son requeridos'
        });
      }

      // Verificar que la cita existe y está completada
      const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select('id, status_id')
        .eq('id', appointment_id)
        .single();

      if (aptError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Verificar si ya existe una factura para esta cita
      const { data: existingBilling } = await supabase
        .from('billings')
        .select('id')
        .eq('appointment_id', appointment_id)
        .single();

      if (existingBilling) {
        return res.status(400).json({ error: 'Ya existe una factura para esta cita' });
      }

      // Calcular montos
      const specialtyMult = specialty_multiplier || 1.00;
      const durationMult = duration_multiplier || 1.00;
      const insuranceDiscount = insurance_discount_percentage || 0;
      const additionalChrg = additional_charges || 0;

      const subtotal = base_amount * specialtyMult * durationMult;
      const insuranceDiscountAmount = (subtotal * insuranceDiscount) / 100;
      const totalAmount = subtotal - insuranceDiscountAmount + additionalChrg;

      // Generar número de factura
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Crear factura
      const { data, error } = await supabase
        .from('billings')
        .insert([{
          appointment_id,
          patient_user_id,
          doctor_id,
          base_amount,
          specialty_multiplier: specialtyMult,
          duration_multiplier: durationMult,
          insurance_discount_percentage: insuranceDiscount,
          insurance_discount_amount: insuranceDiscountAmount,
          additional_charges: additionalChrg,
          total_amount: totalAmount,
          status: 'pending',
          invoice_number: invoiceNumber,
          notes
        }])
        .select(`
          *,
          appointment:appointments(id, scheduled_start),
          patient:users!billings_patient_user_id_fkey(first_name, last_name, email),
          doctor:doctors!billings_doctor_id_fkey(
            id,
            professional_id,
            users(first_name, last_name)
          )
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Factura creada exitosamente',
        billing: data
      });
    } catch (error) {
      console.error('Error creando factura:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/billings/:id - Obtener factura por ID
  getBillingById: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('billings')
        .select(`
          *,
          appointment:appointments(
            id,
            scheduled_start,
            reason
          ),
          patient:users!billings_patient_user_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          doctor:doctors!billings_doctor_id_fkey(
            id,
            professional_id,
            users(first_name, last_name),
            specialties(name)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error obteniendo factura:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/billings - Obtener facturas con filtros
  getBillings: async (req, res) => {
    try {
      const { patientId, doctorId, status, startDate, endDate } = req.query;

      let query = supabase
        .from('billings')
        .select(`
          *,
          appointment:appointments(id, scheduled_start),
          patient:users!billings_patient_user_id_fkey(first_name, last_name, email),
          doctor:doctors!billings_doctor_id_fkey(
            users(first_name, last_name),
            specialties(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_user_id', patientId);
      }

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error obteniendo facturas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/billings/:id/status - Actualizar estado de factura
  updateBillingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, payment_date } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'El estado es requerido' });
      }

      const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` 
        });
      }

      const updates = { status };

      // Si se marca como pagado, registrar fecha de pago
      if (status === 'paid' && payment_date) {
        updates.payment_date = payment_date;
      } else if (status === 'paid' && !payment_date) {
        updates.payment_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('billings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      res.json({
        message: 'Estado de factura actualizado exitosamente',
        billing: data
      });
    } catch (error) {
      console.error('Error actualizando estado de factura:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/billings/:id - Actualizar factura completa
  updateBilling: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        base_amount,
        specialty_multiplier,
        duration_multiplier,
        insurance_discount_percentage,
        additional_charges,
        notes,
        status
      } = req.body;

      // Obtener factura actual
      const { data: currentBilling, error: fetchError } = await supabase
        .from('billings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentBilling) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }

      // Recalcular totales si se modifican montos
      const baseAmt = base_amount || currentBilling.base_amount;
      const specialtyMult = specialty_multiplier || currentBilling.specialty_multiplier;
      const durationMult = duration_multiplier || currentBilling.duration_multiplier;
      const insuranceDiscount = insurance_discount_percentage || currentBilling.insurance_discount_percentage;
      const additionalChrg = additional_charges !== undefined ? additional_charges : currentBilling.additional_charges;

      const subtotal = baseAmt * specialtyMult * durationMult;
      const insuranceDiscountAmount = (subtotal * insuranceDiscount) / 100;
      const totalAmount = subtotal - insuranceDiscountAmount + additionalChrg;

      // Actualizar
      const updates = {
        base_amount: baseAmt,
        specialty_multiplier: specialtyMult,
        duration_multiplier: durationMult,
        insurance_discount_percentage: insuranceDiscount,
        insurance_discount_amount: insuranceDiscountAmount,
        additional_charges: additionalChrg,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      };

      if (notes) updates.notes = notes;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from('billings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Factura actualizada exitosamente',
        billing: data
      });
    } catch (error) {
      console.error('Error actualizando factura:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/billings/:id - Eliminar factura
  deleteBilling: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que la factura no esté pagada
      const { data: billing } = await supabase
        .from('billings')
        .select('status')
        .eq('id', id)
        .single();

      if (billing && billing.status === 'paid') {
        return res.status(400).json({ 
          error: 'No se puede eliminar una factura pagada' 
        });
      }

      const { error } = await supabase
        .from('billings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Factura eliminada exitosamente' });
    } catch (error) {
      console.error('Error eliminando factura:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = billingController;

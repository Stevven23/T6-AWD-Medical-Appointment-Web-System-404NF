/**
 * Patient Repository
 * Data access layer for Patient entity
 * 
 * @module crud-api/repositories/PatientRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class PatientRepository extends BaseRepository {
  constructor() {
    super('patients');
  }

  /**
   * Find patient by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find patient with user details
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async findWithUserDetails(userId) {
    const { data, error } = await this.db
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        cedula,
        phone_number,
        is_active,
        patients!inner (
          id,
          user_id,
          date_of_birth,
          gender,
          address,
          city,
          state,
          postal_code,
          country,
          insurance_plan,
          insurance_number,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation,
          allergies,
          medical_conditions,
          current_medications,
          blood_type,
          height,
          weight,
          home_phone
        )
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    if (data) {
      // Flatten the response
      const patient = data.patients;
      delete data.patients;
      return { ...data, ...patient };
    }

    return data;
  }

  /**
   * Create patient record for user
   * @param {string} userId - User ID
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>}
   */
  async createForUser(userId, patientData = {}) {
    return this.create({
      user_id: userId,
      ...patientData
    });
  }

  /**
   * Update patient by user ID
   * @param {string} userId - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateByUserId(userId, data) {
    const { data: updated, error } = await this.db
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }

  /**
   * Find all patients with user info
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllWithUserInfo(options = {}) {
    const { limit, offset, search } = options;

    let query = this.db
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        cedula,
        phone_number,
        is_active,
        created_at,
        patients (
          id,
          date_of_birth,
          gender,
          insurance_plan
        ),
        roles!inner (name)
      `)
      .eq('roles.name', 'patient')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map(user => {
      const patient = user.patients;
      delete user.patients;
      delete user.roles;
      return { ...user, ...patient };
    });
  }
}

module.exports = new PatientRepository();

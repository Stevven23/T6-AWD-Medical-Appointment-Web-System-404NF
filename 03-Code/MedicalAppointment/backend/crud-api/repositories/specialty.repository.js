/**
 * Specialty Repository
 * Data access layer for Specialty entity
 * 
 * Note: specialties table only has: id, name, description, consultation_fee
 * NO is_active, NO created_at, NO updated_at columns
 * 
 * @module crud-api/repositories/SpecialtyRepository
 */

const BaseRepository = require('../../shared/repositories/BaseRepository');

class SpecialtyRepository extends BaseRepository {
  constructor() {
    super('specialties');
  }

  /**
   * Find all specialties
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllActive(options = {}) {
    const { limit, offset } = options;

    // Note: specialties table does NOT have is_active or created_at columns
    let query = this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .order('name', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 50) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find specialty by name
   * @param {string} name - Specialty name
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .ilike('name', name)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find specialty with doctor count
   * @param {string} id - Specialty ID
   * @returns {Promise<Object|null>}
   */
  async findWithDoctorCount(id) {
    const { data: specialty, error } = await this.db
      .from(this.tableName)
      .select('id, name, description, consultation_fee')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Database error: ${error.message}`);
    }

    // Count doctors
    const { count } = await this.db
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('specialty_id', id)
      .eq('active', true);

    return {
      ...specialty,
      doctor_count: count || 0
    };
  }

  /**
   * Soft delete specialty - NOT SUPPORTED
   * specialties table has no is_active column
   * @param {string} id - Specialty ID
   * @returns {Promise<boolean>}
   */
  async softDelete(id) {
    // specialties table has no is_active column - do actual delete
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  hasSoftDelete() {
    return false; // specialties table has no is_active column
  }
}

module.exports = new SpecialtyRepository();

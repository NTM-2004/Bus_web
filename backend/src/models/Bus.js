const { sql } = require("../config/db");

class Bus {
  constructor({ license_plate, route_id_forward, route_id_backward, longitude, latitude, direction, speed, update_at }) {
    this.license_plate = license_plate;
    this.route_id_forward = route_id_forward;
    this.route_id_backward = route_id_backward;
    this.longitude = longitude;
    this.latitude = latitude;
    this.direction = direction;
    this.speed = speed;
    this.update_at = update_at;
  }

  static async findByLicensePlate(pool, license_plate) {
    const result = await pool.request()
      .input('license_plate', sql.VarChar, license_plate)
      .query(`
        SELECT license_plate, route_id_forward, route_id_backward, longitude, latitude, direction, speed, update_at
        FROM Bus
        WHERE license_plate = @license_plate
      `);
    if (result.recordset.length === 0) return null;
    return new Bus(result.recordset[0]);
  }

  static async findAll(pool) {
    const result = await pool.request()
      .query(`
        SELECT license_plate, route_id_forward, route_id_backward, longitude, latitude, direction, speed, update_at
        FROM Bus
      `);
    return result.recordset.map(row => new Bus(row));
  }

  async save(pool) {
    await pool.request()
      .input('license_plate', sql.VarChar, this.license_plate)
      .input('route_id_forward', sql.VarChar, this.route_id_forward)
      .input('route_id_backward', sql.VarChar, this.route_id_backward)
      .input('longitude', sql.Float, this.longitude)
      .input('latitude', sql.Float, this.latitude)
      .input('direction', sql.Float, this.direction)
      .input('speed', sql.Float, this.speed)
      .input('update_at', sql.DateTime, this.update_at || new Date())
      .query(`
        INSERT INTO Bus (license_plate, route_id_forward, route_id_backward, longitude, latitude, direction, speed, update_at)
        VALUES (@license_plate, @route_id_forward, @route_id_backward, @longitude, @latitude, @direction, @speed, @update_at)
      `);
  }
}

module.exports = Bus;
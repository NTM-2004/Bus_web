const { sql } = require("../config/db");

class Node {
  constructor({ id, latitude, longitude, address, is_bus_stop }) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.is_bus_stop = is_bus_stop;
  }

  static async findById(pool, id) {
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT id, latitude, longitude, address, is_bus_stop
        FROM Node
        WHERE id = @id
      `);
    if (result.recordset.length === 0) return null;
    return new Node(result.recordset[0]);
  }

  static async findAll(pool) {
    const result = await pool.request()
      .query(`
        SELECT id, latitude, longitude, address, is_bus_stop
        FROM Node
      `);
    return result.recordset.map(row => new Node(row));
  }

  static async findBusStops(pool) {
    const result = await pool.request()
      .query(`
        SELECT id, latitude, longitude, address, is_bus_stop
        FROM Node
        WHERE is_bus_stop = 1
      `);
    return result.recordset.map(row => new Node(row));
  }

  async save(pool) {
    await pool.request()
      .input('id', sql.VarChar, this.id)
      .input('latitude', sql.Float, this.latitude)
      .input('longitude', sql.Float, this.longitude)
      .input('address', sql.NVarChar, this.address)
      .input('is_bus_stop', sql.Int, this.is_bus_stop)
      .query(`
        INSERT INTO Node (id, latitude, longitude, address, is_bus_stop)
        VALUES (@id, @latitude, @longitude, @address, @is_bus_stop)
      `);
  }
}

module.exports = Node;
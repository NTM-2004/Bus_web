const { sql } = require("../config/db");

class Route {
  constructor({ id, number, unit, name, ticket_price, distance, direction, start_point, end_point, operation_time, frequency }) {
    this.id = id;
    this.number = number;
    this.unit = unit;
    this.name = name;
    this.ticket_price = ticket_price;
    this.distance = distance;
    this.direction = direction;
    this.start_point = start_point;
    this.end_point = end_point;
    this.operation_time = operation_time;
    this.frequency = frequency;
  }

  static async findById(pool, id) {
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        SELECT id, number, unit, name, ticket_price, distance, direction, start_point, end_point, operation_time, frequency
        FROM Route
        WHERE id = @id
      `);
    if (result.recordset.length === 0) return null;
    return new Route(result.recordset[0]);
  }

  static async findAll(pool) {
    const result = await pool.request()
      .query(`
        SELECT id, number, unit, name, ticket_price, distance, direction, start_point, end_point, operation_time, frequency
        FROM Route
      `);
    return result.recordset.map(row => new Route(row));
  }

  async save(pool) {
    await pool.request()
      .input('id', sql.VarChar, this.id)
      .input('number', sql.VarChar, this.number)
      .input('unit', sql.NVarChar, this.unit)
      .input('name', sql.NVarChar, this.name)
      .input('ticket_price', sql.VarChar, this.ticket_price)
      .input('distance', sql.VarChar, this.distance)
      .input('direction', sql.VarChar, this.direction)
      .input('start_point', sql.NVarChar, this.start_point)
      .input('end_point', sql.NVarChar, this.end_point)
      .input('operation_time', sql.NVarChar, this.operation_time)
      .input('frequency', sql.NVarChar, this.frequency)
      .query(`
        INSERT INTO Route (id, number, unit, name, ticket_price, distance, direction, start_point, end_point, operation_time, frequency)
        VALUES (@id, @number, @unit, @name, @ticket_price, @distance, @direction, @start_point, @end_point, @operation_time, @frequency)
      `);
  }
}

module.exports = Route;
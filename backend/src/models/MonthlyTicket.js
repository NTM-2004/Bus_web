const { sql } = require("../config/db");

class MonthlyTicket {
  constructor({ id, user_id, start_date, end_date, qr_code, price, status }) {
    this.id = id;
    this.user_id = user_id;
    this.start_date = start_date;
    this.end_date = end_date;
    this.qr_code = qr_code;
    this.price = price;
    this.status = status || 'active';
  }

  async save(pool) {
    await pool.request()
      .input('id', sql.VarChar, this.id)
      .input('user_id', sql.VarChar, this.user_id)
      .input('start_date', sql.Date, new Date(this.start_date))
      .input('end_date', sql.Date, new Date(this.end_date))
      .input('qr_code', sql.NVarChar, this.qr_code)
      .input('price', sql.Int, this.price)
      .input('status', sql.VarChar, this.status)
      .query(`
        INSERT INTO Monthly_ticket (id, user_id, start_date, end_date, qr_code, price, status)
        VALUES (@id, @user_id, @start_date, @end_date, @qr_code, @price, @status)
      `);
  }

  static async findByUser(pool, user_id) {
    const result = await pool.request()
      .input('userId', sql.VarChar, user_id)
      .query(`
        SELECT mt.id, mt.start_date, mt.end_date, 
               mt.qr_code, mt.price, mt.status
        FROM Monthly_ticket mt
        WHERE mt.user_id = @userId
        ORDER BY mt.start_date DESC
      `);
    return result.recordset;
  }

  static async findQRCode(pool, ticket_id, user_id) {
    const result = await pool.request()
      .input('ticketId', sql.VarChar, ticket_id)
      .input('userId', sql.VarChar, user_id)
      .query(`
        SELECT qr_code
        FROM Monthly_ticket
        WHERE id = @ticketId AND user_id = @userId
      `);
    if (result.recordset.length === 0) return null;
    return result.recordset[0].qr_code;
  }

  static async deleteById(pool, ticketId, userId) {
    await pool.request()
      .input('ticketId', sql.VarChar, ticketId)
      .input('userId', sql.VarChar, userId)
      .query(`
        DELETE FROM Monthly_ticket
        WHERE id = @ticketId AND user_id = @userId
      `);
  }
}

module.exports = MonthlyTicket;
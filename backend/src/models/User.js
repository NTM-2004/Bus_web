const { sql } = require("../config/db");

class User {
  constructor({ id, name, mail, username, password, role = 'client' }) {
    this.id = id;
    this.name = name;
    this.mail = mail;
    this.username = username;
    this.password = password;
    this.role = role;
  }

  static async findByUsername(pool, username) {
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM User_account WHERE username = @username');
    if (result.recordset.length === 0) return null;
    return new User(result.recordset[0]);
  }

  static async findByEmail(pool, mail) {
    const result = await pool.request()
      .input('mail', sql.VarChar, mail)
      .query('SELECT * FROM User_account WHERE mail = @mail');
    if (result.recordset.length === 0) return null;
    return new User(result.recordset[0]);
  }

  static async findById(pool, id) {
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query('SELECT * FROM User_account WHERE id = @id');
    if (result.recordset.length === 0) return null;
    return new User(result.recordset[0]);
  }

  async save(pool) {
    await pool.request()
      .input('id', sql.VarChar, this.id)
      .input('name', sql.NVarChar, this.name)
      .input('mail', sql.VarChar, this.mail)
      .input('username', sql.VarChar, this.username)
      .input('password', sql.VarChar, this.password)
      .input('role', sql.VarChar, this.role)
      .query(`
        INSERT INTO User_account (id, name, mail, username, password, role)
        VALUES (@id, @name, @mail, @username, @password, @role)
      `);
  }

  async update(pool, updatePassword = false) {
    let query = `
      UPDATE User_account
      SET name = @name, mail = @mail, username = @username
    `;
    if (updatePassword) {
      query += `, password = @password`;
    }
    query += ` WHERE id = @id`;

    const request = pool.request()
      .input('id', sql.VarChar, this.id)
      .input('name', sql.NVarChar, this.name)
      .input('mail', sql.VarChar, this.mail)
      .input('username', sql.VarChar, this.username);

    if (updatePassword) {
      request.input('password', sql.VarChar, this.password);
    }

    await request.query(query);
  }
}

module.exports = User;
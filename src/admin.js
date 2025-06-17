const { connectDB, sql } = require('./config/db');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const username = 'admin';
    const password = 'admin123';
    const name = 'Administrator';
    const mail = 'admin@example.com';
    const role = 'admin';

    try {
        const pool = await connectDB();

        // Check if admin already exists
        const check = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM User_account WHERE username = @username');

        if (check.recordset.length > 0) {
            console.log('Admin account already exists.');
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique id
        const userId = 'admin_' + Date.now();

        // Insert admin user
        await pool.request()
            .input('id', sql.VarChar, userId)
            .input('name', sql.NVarChar, name)
            .input('mail', sql.VarChar, mail)
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, hashedPassword)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO User_account (id, name, mail, username, password, role)
                VALUES (@id, @name, @mail, @username, @password, @role)
            `);

        console.log('Admin account created successfully!');
    } catch (err) {
        console.error('Error creating admin account:', err);
    }
}

createAdmin();
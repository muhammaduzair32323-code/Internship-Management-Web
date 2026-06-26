const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const AdminModel = {
    findByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
        return result.rows[0];
    },

    count: async () => {
        const result = await pool.query('SELECT COUNT(*) FROM admins');
        return parseInt(result.rows[0].count);
    },

    create: async ({ name, email, password }) => {
        const hashed = await bcrypt.hash(password, 12);
        const result = await pool.query(
            'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
            [name.trim(), email.toLowerCase().trim(), hashed]
        );
        return result.rows[0];
    },

    verifyPassword: async (plain, hashed) => {
        return bcrypt.compare(plain, hashed);
    },

    getAll: async () => {
        const result = await pool.query('SELECT id, name, email FROM admins');
        return result.rows;
    },
};

module.exports = AdminModel;
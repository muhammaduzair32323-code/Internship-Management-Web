const pool = require('../config/db');

const TaskModel = {
  getAll: async ({ status, intern_id, priority }) => {
    let query = `
      SELECT t.*, i.name as intern_name 
      FROM tasks t 
      LEFT JOIN interns i ON t.intern_id = i.id 
      WHERE 1=1
    `;
    const params = [];
    if (status)    { params.push(status);    query += ` AND t.status = $${params.length}`; }
    if (intern_id) { params.push(intern_id); query += ` AND t.intern_id = $${params.length}`; }
    if (priority)  { params.push(priority);  query += ` AND t.priority = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `SELECT t.*, i.name as intern_name 
       FROM tasks t LEFT JOIN interns i ON t.intern_id = i.id 
       WHERE t.id = $1`, [id]
    );
    return result.rows[0];
  },

  create: async ({ intern_id, title, description, due_date, priority }) => {
    const result = await pool.query(
      `INSERT INTO tasks (intern_id, title, description, due_date, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [intern_id, title.trim(), description?.trim() || null, due_date || null, priority || 'medium']
    );
    return result.rows[0];
  },

  updateStatus: async (id, { status, due_date, priority }) => {
    const result = await pool.query(
      `UPDATE tasks SET
        status   = COALESCE($1, status),
        due_date = COALESCE($2, due_date),
        priority = COALESCE($3, priority)
       WHERE id = $4 RETURNING *`,
      [status || null, due_date || null, priority || null, id]
    );
    return result.rows[0];
  },

  update: async (id, { title, description, due_date, priority }) => {
    const result = await pool.query(
      `UPDATE tasks SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        due_date    = COALESCE($3, due_date),
        priority    = COALESCE($4, priority)
      WHERE id = $5 RETURNING *`,
      [title || null, description || null, due_date || null, priority || null, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
};

module.exports = TaskModel;
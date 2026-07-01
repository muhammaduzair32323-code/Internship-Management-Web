const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

const STATUSES = ['submitted', 'approved', 'rejected', 'revision_requested'];

const SubmissionModel = {
  getAll: async ({ task_id, intern_id, status }) => {
    let query = `
      SELECT s.*, t.title AS task_title, i.name AS intern_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', f.id, 'file_name', f.file_name, 'file_size', f.file_size, 'mime_type', f.mime_type
          )) FROM submission_files f WHERE f.submission_id = s.id),
          '[]'
        ) AS files
      FROM submissions s
      JOIN tasks t ON t.id = s.task_id
      JOIN interns i ON i.id = s.intern_id
      WHERE 1=1
    `;
    const params = [];
    if (task_id)   { params.push(task_id);   query += ` AND s.task_id = $${params.length}`; }
    if (intern_id) { params.push(intern_id); query += ` AND s.intern_id = $${params.length}`; }
    if (status)    { params.push(status);    query += ` AND s.status = $${params.length}`; }
    query += ' ORDER BY s.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `SELECT s.*, t.title AS task_title, t.intern_id AS task_intern_id,
              i.name AS intern_name, i.email AS intern_email,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', f.id, 'file_name', f.file_name, 'file_size', f.file_size,
            'mime_type', f.mime_type, 'storage_key', f.storage_key
          )) FROM submission_files f WHERE f.submission_id = s.id),
          '[]'
        ) AS files
       FROM submissions s
       JOIN tasks t ON t.id = s.task_id
       JOIN interns i ON i.id = s.intern_id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Verifies the task is actually assigned to this intern before creating —
  // an intern must not be able to submit against someone else's task.
  create: async ({ task_id, intern_id, notes }) => {
    const owns = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND intern_id = $2',
      [task_id, intern_id]
    );
    if (!owns.rows[0]) return null;

    const result = await pool.query(
      `INSERT INTO submissions (task_id, intern_id, notes, status)
       VALUES ($1, $2, $3, 'submitted') RETURNING *`,
      [task_id, intern_id, notes?.trim() || null]
    );
    return result.rows[0];
  },

  addFiles: async (submissionId, fileList) => {
    if (!fileList?.length) return [];
    const inserted = [];
    for (const f of fileList) {
      const buf = fs.readFileSync(f.path);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      const result = await pool.query(
        `INSERT INTO submission_files
           (submission_id, file_name, storage_key, mime_type, file_size, checksum_sha256)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, file_name, file_size, mime_type`,
        [submissionId, f.originalname, f.filename, f.mimetype, f.size, hash]
      );
      inserted.push(result.rows[0]);
    }
    return inserted;
  },

  review: async (id, { status, score, feedback }) => {
    if (!STATUSES.includes(status)) return null;
    const result = await pool.query(
      `UPDATE submissions
       SET status = $1, score = COALESCE($2, score), feedback = $3, reviewed_at = now()
       WHERE id = $4 RETURNING *`,
      [status, score ?? null, feedback?.trim() || null, id]
    );
    return result.rows[0];
  },
};

module.exports = SubmissionModel;
module.exports.STATUSES = STATUSES;

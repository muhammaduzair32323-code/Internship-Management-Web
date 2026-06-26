const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const { internOnly } = require('../middleware/authMiddleware');
const pool = require('../config/db');

// Get own profile + tasks + attendance
router.get('/me', authMiddleware, internOnly, async (req, res, next) => {
    try {
        const id = req.user.id;
        const intern = await pool.query('SELECT id,name,email,department,joining_date,status FROM interns WHERE id=$1', [id]);
        const tasks = await pool.query(`
  SELECT t.*, 
    COALESCE(
      json_agg(tc ORDER BY tc.created_at ASC) FILTER (WHERE tc.id IS NOT NULL), 
      '[]'
    ) as comments
  FROM tasks t
  LEFT JOIN task_comments tc ON tc.task_id = t.id
  WHERE t.intern_id=$1
  GROUP BY t.id
  ORDER BY t.created_at DESC
`, [id]);
        const attendance = await pool.query('SELECT * FROM attendance WHERE intern_id=$1 ORDER BY date DESC LIMIT 30', [id]);
        const stats = await pool.query(`
      SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN attendance.status='present' THEN 1 END) as present_days,
        COALESCE(SUM(total_hours),0) as total_hours
      FROM attendance WHERE intern_id=$1`, [id]);

        res.json({
            success: true, data: {
                intern: intern.rows[0],
                tasks: tasks.rows,
                attendance: attendance.rows,
                stats: stats.rows[0],
            }
        });
    } catch (err) { next(err); }
});

// Mark task complete
router.patch('/tasks/:id/complete', authMiddleware, internOnly, async (req, res, next) => {
    try {
        const result = await pool.query(
            `UPDATE tasks SET status='completed' WHERE id=$1 AND intern_id=$2 RETURNING *`,
            [req.params.id, req.user.id]
        );
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Task not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
});

module.exports = router;
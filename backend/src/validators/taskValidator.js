const { body } = require('express-validator');

// Assign-task supports two shapes depending on the UI that posted it:
//   - edit mode / single assign:  intern_id   (one integer)
//   - create mode / multi-assign: intern_ids  (non-empty array of integers)
// Exactly one of the two must resolve to at least one valid intern id.
const taskValidator = [
  body('intern_id')
    .if((value, { req }) => !Array.isArray(req.body.intern_ids) || req.body.intern_ids.length === 0)
    .notEmpty().withMessage('Valid intern ID is required')
    .bail()
    .isInt().withMessage('Valid intern ID is required'),
  body('intern_ids')
    .if((value, { req }) => Array.isArray(req.body.intern_ids))
    .isArray({ min: 1 }).withMessage('Select at least one intern')
    .bail()
    .custom((ids) => ids.every((id) => Number.isInteger(Number(id)) && String(id).trim() !== ''))
    .withMessage('All intern IDs must be valid'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('due_date').optional().isDate().withMessage('Invalid due date'),
  body('priority').optional().isIn(['low','medium','high']).withMessage('Priority must be low, medium, or high'),
];

const taskStatusValidator = [
  body('status')
    .notEmpty()
    .isIn(['pending', 'completed'])
    .withMessage('Status must be pending or completed'),

  body('due_date').optional().isDate().withMessage('Invalid due date'),
  body('priority').optional().isIn(['low','medium','high']).withMessage('Priority must be low, medium, or high'),
];

module.exports = { taskValidator, taskStatusValidator };

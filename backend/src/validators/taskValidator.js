const { body } = require('express-validator');

const taskValidator = [
  body('intern_id').notEmpty().isInt().withMessage('Valid intern ID is required'),
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
const { body } = require('express-validator');

const attendanceValidator = [
  body('intern_id').notEmpty().isInt().withMessage('Valid intern ID is required'),
  body('date').notEmpty().isDate().withMessage('Valid date is required'),
  body('status')
    .notEmpty()
    .isIn(['present', 'absent'])
    .withMessage('Status must be present or absent'),
];

module.exports = attendanceValidator;
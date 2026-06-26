const router = require('express').Router();
const ctrl = require('../controllers/internController');
const internValidator = require('../validators/internValidator');
const validate = require('../utils/validate');

router.get('/', ctrl.getAll);
router.get('/:id/profile', ctrl.getProfile);
router.get('/:id', ctrl.getOne);
router.post('/', internValidator, validate, ctrl.create);
router.put('/:id', internValidator, validate, ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/status', ctrl.toggleStatus);

module.exports = router;
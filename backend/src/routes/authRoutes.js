const router = require('express').Router();
const ctrl = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);
router.post('/intern/login', ctrl.internLogin);

module.exports = router;
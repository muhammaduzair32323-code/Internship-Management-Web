const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { getAll, getWeeklySummary, checkIn, checkOut, mark, exportCSV } = require('../controllers/attendanceController');

router.get('/export', exportCSV);
router.get('/', ctrl.getAll);
router.get('/weekly-summary', ctrl.getWeeklySummary);
router.post('/check-in', ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);
router.post('/', ctrl.mark);

module.exports = router;
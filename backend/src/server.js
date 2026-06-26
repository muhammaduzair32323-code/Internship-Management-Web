require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');
const cron = require('node-cron');
const AttendanceModel = require('./models/attendanceModel');
const AdminModel = require('./models/adminModel');
const emailService = require('./services/emailService');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/interns', authMiddleware, require('./routes/internRoutes'));
app.use('/api/intern', require('./routes/internPortalRoutes'));
app.use('/api/tasks', authMiddleware, require('./routes/taskRoutes'));
app.use('/api/attendance', authMiddleware, require('./routes/attendanceRoutes'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboardRoutes'));


app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/test-email', async (req, res) => {
    const emailService = require('./services/emailService');
    try {
        await emailService.sendAdminWelcome({ name: 'Test', email: process.env.GMAIL_USER });
        res.json({ success: true, message: 'Email sent' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Every Monday at 8:00 AM — send weekly attendance report
cron.schedule('0 8 * * 1', async () => {
    try {
        const now = new Date();
        const day = now.getDay();
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - (day === 0 ? 13 : day + 6));
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);

        const week_start = lastMonday.toISOString().slice(0, 10);
        const week_end = lastSunday.toISOString().slice(0, 10);

        const rows = await AttendanceModel.getWeeklySummary({ week_start, week_end });
        const admins = await AdminModel.getAll();

        for (const admin of admins) {
            await emailService.sendWeeklyReport({
                admin_email: admin.email,
                admin_name: admin.name,
                week_start,
                week_end,
                rows,
            }).catch(() => { });
        }
        console.log('Weekly report sent');
    } catch (err) {
        console.error('Cron error:', err.message);
    }
});

app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
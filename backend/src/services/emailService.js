const transporter = require('../config/email');

const emailService = {
  sendWelcomeIntern: async ({ name, email, department, tempPassword }) => {
    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to the Internship Program — Your Login Details',
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
        <h2 style="color:#0F172A;margin-bottom:8px;">Welcome, ${name}!</h2>
        <p style="color:#64748B;">You have been added to the internship portal under <strong>${department}</strong>.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#0F172A;font-weight:600;">Your Login Details</p>
          <p style="margin:0;color:#64748B;">Email: <strong>${email}</strong></p>
          <p style="margin:4px 0 0;color:#64748B;">Password: <strong>${tempPassword}</strong></p>
        </div>
        <p style="color:#64748B;">Login at <a href="${process.env.INTERN_PORTAL_URL || 'http://localhost:3000/intern/login'}"style="color:#4F46E5;">Intern Portal</a></p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
        <p style="color:#94A3B8;font-size:12px;">Intern Management Portal</p>
      </div>
    `,
    });
  },

  sendTaskAssigned: async ({ intern_name, intern_email, task_title, task_description, task_priority, task_due_date }) => {
    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: intern_email,
      subject: `New Task Assigned: ${task_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
            <h2 style="color:#0F172A;margin-bottom:8px;">New Task Assigned</h2>
            <p style="color:#64748B;">Hi <strong>${intern_name}</strong>, you have been assigned a new task.</p>
            <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:20px 0;">
            <h3 style="color:#0F172A;margin:0 0 8px;">${task_title}</h3>
            <p style="color:#64748B;margin:0;">${task_description || 'No description provided.'}</p>
            <p style="margin:8px 0 0;font-size:13px;">
                <strong>Priority:</strong> ${task_priority || 'medium'} &nbsp;|&nbsp;
                <strong>Due:</strong> ${task_due_date ? new Date(task_due_date).toDateString() : 'No due date'}
            </p>
            </div>
            <p style="color:#64748B;">Please complete it on time. Good luck!</p>
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
            <p style="color:#94A3B8;font-size:12px;">Intern Management Portal</p>
        </div>
        `,
    });
  },

  sendTaskOverdue: async ({ intern_name, intern_email, task_title, task_due_date }) => {
    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: intern_email,
      subject: `Overdue Task: ${task_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
            <h2 style="color:#EF4444;margin-bottom:8px;">Task Overdue</h2>
            <p style="color:#64748B;">Hi <strong>${intern_name}</strong>, the following task is past its due date.</p>
            <div style="background:#FEF2F2;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #EF4444;">
            <h3 style="color:#0F172A;margin:0 0 8px;">${task_title}</h3>
            <p style="color:#EF4444;margin:0;font-size:13px;">Was due: ${new Date(task_due_date).toDateString()}</p>
            </div>
            <p style="color:#64748B;">Please complete or update this task as soon as possible.</p>
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
            <p style="color:#94A3B8;font-size:12px;">Intern Management Portal</p>
        </div>
        `,
    });
  },

  sendAdminWelcome: async ({ name, email }) => {
    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Admin Account Created',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
          <h2 style="color:#0F172A;margin-bottom:8px;">Welcome, ${name}!</h2>
          <p style="color:#64748B;">Your admin account has been created successfully.</p>
          <p style="color:#64748B;margin-top:16px;">You can now manage interns, tasks, and attendance.</p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
          <p style="color:#94A3B8;font-size:12px;">Intern Management Portal</p>
        </div>
      `,
    });
  },

  sendWeeklyReport: async ({ admin_email, admin_name, week_start, week_end, rows }) => {
    const tableRows = rows.map(r => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${r.intern_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${r.department}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${r.days_present}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${r.days_absent}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">${parseFloat(r.total_hours).toFixed(2)}h</td>
    </tr>
  `).join('');

    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: admin_email,
      subject: `Weekly Attendance Report — ${week_start} to ${week_end}`,
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
        <h2 style="color:#0F172A;margin-bottom:4px;">Weekly Attendance Report</h2>
        <p style="color:#64748B;margin-bottom:24px;">Week: <strong>${week_start}</strong> → <strong>${week_end}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#F8FAFC;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Name</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Department</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Present</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Absent</th>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #E2E8F0;">Hours</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
        <p style="color:#94A3B8;font-size:12px;">Intern Management Portal — Auto Report</p>
      </div>
    `,
    });
  },

  sendTaskComment: async ({ intern_name, intern_email, task_title, comment }) => {
    await transporter.sendMail({
      from: `"Intern Portal" <${process.env.GMAIL_USER}>`,
      to: intern_email,
      subject: `New Comment on Task: ${task_title}`,
      html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #E2E8F0;border-radius:16px;">
        <h2 style="color:#0F172A;margin-bottom:8px;">New Comment on Your Task</h2>
        <p style="color:#64748B;">Hi <strong>${intern_name}</strong>, your supervisor left a note on <strong>${task_title}</strong>.</p>
        <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #4F46E5;">
          <p style="color:#0F172A;margin:0;">${comment}</p>
        </div>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
        <p style="color:#94A3B8;font-size:12px;">Intern Management Portal</p>
      </div>
    `,
    });
  },
};

module.exports = emailService;
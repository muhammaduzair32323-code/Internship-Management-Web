import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { useAuth } from '../../context/AuthContext';

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ADMIN_SYSTEM = `You are a helpful assistant for the Intern Management Portal — an admin dashboard.
You help the admin understand and use every feature of the portal. Be concise, friendly, and specific.

Here is everything the admin can do:

DASHBOARD: View total interns, tasks, completed/pending counts. See department distribution chart, task status chart, recent activity feed, and intern performance table.

INTERNS: Add new interns (name, email, department, joining date). Edit or delete interns. View intern profile (tasks, attendance, progress). Search by name. Filter by department or status (active/inactive). Toggle intern active/inactive status. Click View to open full profile.

INTERN PROFILE: Shows intern's stats, task completion progress bar, weekly hours progress, attendance rate, recent attendance records, and all assigned tasks.

TASKS: Assign tasks to one or multiple interns at once. Each task has title, description, priority (low/medium/high), due date. AI can enhance task description using Groq. Filter tasks by status or priority. Mark task done or reopen. Edit task details. Delete task. Add notes/comments on a task — intern gets email notification. Overdue tasks are highlighted in red with ⚠.

ATTENDANCE: Daily tab — mark interns present/absent, check in and check out with timestamps. Weekly tab — see total hours, days present/absent, 40hr target progress bar. Filter by date or intern. Export attendance to CSV.

EMAILS: System sends emails automatically for — new intern welcome + login credentials, task assigned, task overdue, task comment/note, weekly attendance report every Monday 8AM.

INTERN PORTAL: Interns log in at /intern/login using credentials emailed to them. They can view their dashboard, tasks (with supervisor notes), and attendance history. They can mark tasks as complete themselves.

Always answer based on this portal. If asked something unrelated, politely redirect.`;

const INTERN_SYSTEM = `You are a helpful assistant for the Intern Portal.
You help interns understand and use their portal. Be friendly, encouraging, and concise.

Here is everything an intern can do:

LOGIN: Go to /intern/login. Use the email and password sent to you when you were added by your admin.

DASHBOARD: See your total tasks, completed tasks, pending tasks, attendance rate, progress bars for task completion, weekly hours, and attendance. Also shows your 5 most recent tasks.

TASKS: See all tasks assigned to you. Each task shows title, description, priority (color-coded), due date, status, and supervisor notes/comments. You can mark pending tasks as done by clicking Mark Done. Overdue tasks are highlighted with ⚠.

ATTENDANCE: See your full attendance history — date, status (present/absent), check-in time, check-out time, and total hours worked.

EMAILS: You receive emails when — you are added to the portal (with login credentials), a task is assigned to you, a task is overdue, your supervisor adds a note on your task.

Always answer based on this intern portal. If asked something unrelated, politely redirect.`;

const AIChatBot = () => {
  const { admin, intern } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const isAdmin = !!admin;
  const isIntern = !!intern;
  const isLoggedIn = isAdmin || isIntern;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: isAdmin
          ? `Hi ${admin?.name}! 👋 I can help you with anything in the portal — interns, tasks, attendance, exports, and more. What do you need?`
          : `Hi ${intern?.name}! 👋 I can help you navigate your intern portal — tasks, attendance, and more. What do you need?`,
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isLoggedIn) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const chat = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: isAdmin ? ADMIN_SYSTEM : INTERN_SYSTEM },
          ...updated.map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 400,
      });
      const reply = chat.choices[0]?.message?.content?.trim();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: '#4F46E5', color: '#fff', fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        title="AI Assistant"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 1000,
          width: 360, height: 480, background: '#fff',
          borderRadius: 16, border: '1px solid #E2E8F0',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#4F46E5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Portal Assistant</div>
              <div style={{ color: '#C7D2FE', fontSize: 11 }}>{isAdmin ? 'Admin mode' : 'Intern mode'}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                  background: m.role === 'user' ? '#4F46E5' : '#F8FAFC',
                  color: m.role === 'user' ? '#fff' : '#0F172A',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
                  border: m.role === 'assistant' ? '1px solid #E2E8F0' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, borderBottomLeftRadius: 4, padding: '10px 14px', fontSize: 13, color: '#64748B' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about the portal..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
                fontSize: 13, outline: 'none', color: '#0F172A',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: loading || !input.trim() ? '#E2E8F0' : '#4F46E5',
                color: loading || !input.trim() ? '#94A3B8' : '#fff',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 500,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
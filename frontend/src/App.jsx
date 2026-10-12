import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const initialForm = {
  title: '',
  description: '',
  priority: 'medium',
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return body;
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = statusFilter === 'all'
        ? ''
        : `?status=${encodeURIComponent(statusFilter)}`;

      const [ticketResult, statsResult] = await Promise.all([
        request(`/tickets${query}`),
        request('/tickets/stats'),
      ]);

      setTickets(ticketResult.data || []);
      setStats(statsResult);
    } catch (err) {
      setError(`${err.message}. Check that the backend and PostgreSQL are running.`);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function createTicket(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await request('/tickets', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setForm(initialForm);
      setNotice('Ticket created successfully.');
      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    setError('');
    setNotice('');

    try {
      await request(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setNotice(`Ticket #${id} updated.`);
      await loadTickets();
    } catch (err) {
      setError(err.message);
    }
  }



  const statItems = [
  {
    label: 'Total tickets',
    value: (stats.open ?? 0) +
      (stats.in_progress ?? 0) +
      (stats.closed ?? 0),
  },
  { label: 'Open', value: stats.open ?? 0 },
  { label: 'In progress', value: stats.in_progress ?? 0 },
  { label: 'Closed', value: stats.closed ?? 0 },
];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>Ticket<span className="brand-light">Desk</span></span>
        </a>
        <span className="topbar-label">
          <span className="live-dot" /> Support workspace
        </span>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">SUPPORT OPERATIONS</p>
          <h1>Mini Ticket Tracker</h1>
          <p className="subtitle">Keep every request moving in the right direction.</p>
        </div>
        <button className="secondary-button" onClick={loadTickets} disabled={loading}>
          ↻ Refresh
        </button>
      </section>

      <section className="stats-grid" aria-label="Ticket statistics">
        {statItems.map((item, index) => (
          <article className="stat-card" key={item.label}>
            <div className={`stat-icon stat-icon-${index}`}>
              {['#', '○', '◷', '✓'][index]}
            </div>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="workspace">
        <div className="ticket-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">INBOX</p>
              <h2>Support tickets</h2>
            </div>
            <label className="filter-control">
              <span>Filter</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>

          {error && <div className="message error-message" role="alert">{error}</div>}
          {notice && <div className="message success-message" role="status">{notice}</div>}

          {loading ? (
            <div className="empty-state">
              <span className="spinner" />
              <p>Loading tickets…</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>No tickets found</h3>
              <p>Create a ticket or choose a different status filter.</p>
            </div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article className="ticket-item" key={ticket.id}>
                  <div className="ticket-main">
                    <div className="ticket-title-row">
                      <h3>{ticket.title}</h3>
                      <span className={`priority priority-${ticket.priority}`}>
                        <span /> {ticket.priority}
                      </span>
                    </div>
                    <p className="ticket-description">
                      {ticket.description || 'No description provided.'}
                    </p>
                    <div className="ticket-meta">
                      <span>#{ticket.id}</span>
                      <span>·</span>
                      <span>
                        {new Date(ticket.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <label className="status-control">
                    <span className={`status-dot status-dot-${ticket.status}`} />
                    <select
                      aria-label={`Status for ticket ${ticket.id}`}
                      className={`status-select status-${ticket.status}`}
                      value={ticket.status}
                      onChange={(event) => updateStatus(ticket.id, event.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          )}
          <footer className="panel-footer">
            Showing {tickets.length} ticket{tickets.length === 1 ? '' : 's'} on this page
          </footer>
        </div>

        <aside className="create-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEW REQUEST</p>
              <h2>Create a ticket</h2>
            </div>
            <span className="plus-icon">+</span>
          </div>
          <p className="form-intro">Capture an issue so your team can follow up.</p>

          <form onSubmit={createTicket}>
            <label className="form-field">
              <span>Ticket title <b>*</b></span>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Unable to log in"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>

            <label className="form-field">
              <span>Description <small>Optional</small></span>
              <textarea
                rows={4}
                maxLength={10000}
                placeholder="Describe the issue and any useful details…"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>

            <label className="form-field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <div className="form-hint">
              <span>ⓘ</span>
              New tickets start with <strong>Open</strong> status.
            </div>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Creating ticket…' : '+ Create ticket'}
            </button>
          </form>
        </aside>
      </section>

      <footer className="app-footer">
        <span>TicketDesk <span>·</span> Mini Ticket Tracker</span>
        <span>Built for support teams</span>
      </footer>
    </main>
  );
}

export default App;
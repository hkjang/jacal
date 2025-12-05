import { useTranslation } from 'react-i18next';

export default function WebhooksConfig() {
  const { t } = useTranslation();
  const webhooks = [
    { id: 1, name: 'Slack Notifications', url: 'https://hooks.slack.com/services/xxx', events: ['user.created', 'event.created'], active: true },
    { id: 2, name: 'Discord Bot', url: 'https://discord.com/api/webhooks/xxx', events: ['task.completed'], active: false },
  ];

  const availableEvents = [
    'user.created',
    'user.updated',
    'event.created',
    'task.created',
    'task.completed',
    'habit.logged',
  ];

  return (
    <div className="admin-section">
      <h2>{t('admin.webhooks', '웹훅')}</h2>
      <p className="section-description">Manage webhook integrations for external services</p>

      <div className="webhooks-list">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="webhook-card">
            <div className="webhook-header">
              <h3>{webhook.name}</h3>
              <div className="webhook-status">
                <span className={`status-indicator ${webhook.active ? 'active' : 'inactive'}`}>
                  {webhook.active ? '🟢 Active' : '🔴 Inactive'}
                </span>
              </div>
            </div>

            <div className="webhook-details">
              <div className="detail-row">
                <span className="detail-label">URL:</span>
                <code className="detail-value">{webhook.url}</code>
              </div>

              <div className="detail-row">
                <span className="detail-label">Events:</span>
                <div className="events-list">
                  {webhook.events.map((event) => (
                    <span key={event} className="event-badge">{event}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="webhook-actions">
              <button className="action-btn test">🧪 Test</button>
              <button className="action-btn edit">✏️ Edit</button>
              <button className="action-btn delete">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      <button className="add-webhook-btn">
        ➕ Add New Webhook
      </button>

      <div className="available-events">
        <h3>Available Events</h3>
        <div className="events-grid">
          {availableEvents.map((event) => (
            <div key={event} className="event-item">
              <code>{event}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="note">
        <p>💡 <strong>Note:</strong> Webhooks send HTTP POST requests to your specified URLs when events occur. Implement backend endpoints to create, update, and delete webhooks.</p>
      </div>

      <style>{`
        .admin-section {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }

        .section-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .webhooks-list {
          margin-bottom: 1.5rem;
        }

        .webhook-card {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .webhook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .webhook-header h3 {
          margin: 0;
        }

        .status-indicator {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-indicator.active {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-indicator.inactive {
          background: var(--danger-bg);
          color: var(--danger);
        }

        .webhook-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          align-items: flex-start;
        }

        .detail-label {
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 60px;
        }

        .detail-value {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .events-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .event-badge {
          background: var(--primary-bg);
          color: var(--primary);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .webhook-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .action-btn:hover {
          background: var(--bg-tertiary);
        }

        .add-webhook-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 2rem;
        }

        .add-webhook-btn:hover {
          opacity: 0.9;
        }

        .available-events {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .available-events h3 {
          margin: 0 0 1rem 0;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .event-item code {
          display: block;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .note {
          padding: 1rem;
          background: rgba(59, 130, 246, 0.1);
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }

        .note p {
          margin: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

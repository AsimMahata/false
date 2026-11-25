const API_BASE = '/api';

export async function fetchStatements(date) {
  const res = await fetch(`${API_BASE}/statements?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch statements (${res.status})`);
  }
  return res.json();
}

export async function createStatement(date, encryptedContent) {
  const res = await fetch(`${API_BASE}/statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date,
      content: encryptedContent,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create statement (${res.status})`);
  }
  return res.json();
}

export async function updateStatementContent(id, encryptedContent) {
  const res = await fetch(`${API_BASE}/statements/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: encryptedContent,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update statement (${res.status})`);
  }
  return res.json();
}

export async function toggleStatementStatus(id, newStatus) {
  const res = await fetch(`${API_BASE}/statements/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to change statement status (${res.status})`);
  }
  return res.json();
}

export async function deleteStatement(id) {
  const res = await fetch(`${API_BASE}/statements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete statement (${res.status})`);
  }
  return res.json();
}

export async function fetchStatementHistory(id) {
  const res = await fetch(`${API_BASE}/statements/${encodeURIComponent(id)}/history`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch history (${res.status})`);
  }
  return res.json();
}

export async function fetchStatementSummary() {
  const res = await fetch(`${API_BASE}/statements/summary`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch summary (${res.status})`);
  }
  return res.json();
}

export async function fetchActivityLogs() {
  const res = await fetch(`${API_BASE}/activity-logs`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch activity logs (${res.status})`);
  }
  return res.json();
}

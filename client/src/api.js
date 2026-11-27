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

// ==========================================
// Diary API Endpoints
// ==========================================

export async function fetchDiaryEntry(date) {
  const res = await fetch(`${API_BASE}/diary?date=${encodeURIComponent(date)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch diary entry (${res.status})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data;
}

export async function fetchDiaryEntries(date) {
  const res = await fetch(`${API_BASE}/diary?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch diary entries (${res.status})`);
  }
  return res.json();
}

export async function fetchDiaryDates() {
  const res = await fetch(`${API_BASE}/diary/dates`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch diary dates (${res.status})`);
  }
  return res.json();
}

export async function createDiaryEntry(date, encryptedContent) {
  const res = await fetch(`${API_BASE}/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date,
      content: encryptedContent,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create diary entry (${res.status})`);
  }
  return res.json();
}

export async function updateDiaryEntry(id, encryptedContent) {
  const res = await fetch(`${API_BASE}/diary/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: encryptedContent,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update diary entry (${res.status})`);
  }
  return res.json();
}

export async function deleteDiaryEntry(id) {
  const res = await fetch(`${API_BASE}/diary/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete diary entry (${res.status})`);
  }
  return res.json();
}

export async function fetchDiaryHistory(id) {
  const res = await fetch(`${API_BASE}/diary/${encodeURIComponent(id)}/history`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch diary history (${res.status})`);
  }
  return res.json();
}

export async function fetchDiarySummary() {
  const res = await fetch(`${API_BASE}/diary/summary`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch diary summary (${res.status})`);
  }
  return res.json();
}

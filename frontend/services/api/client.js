function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return url.replace(/\/$/, '');
}

async function parseJsonResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const message = data?.error?.message || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

export async function submitReport(payload) {
  const res = await fetch(`${getBaseUrl()}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res);
}

export async function uploadReportsCsv(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${getBaseUrl()}/reports/upload`, {
    method: 'POST',
    body: fd,
  });
  return parseJsonResponse(res);
}

export async function fetchJobStatus(jobId) {
  const res = await fetch(`${getBaseUrl()}/job-status/${jobId}`);
  return parseJsonResponse(res);
}

export async function fetchDashboard(month, options = {}) {
  const q = new URLSearchParams({ month });
  const { ngoId, page, pageSize } = options;
  if (ngoId && String(ngoId).trim()) q.set('ngoId', String(ngoId).trim());
  if (page != null && page > 0) q.set('page', String(page));
  if (pageSize != null && pageSize > 0) q.set('pageSize', String(pageSize));
  const res = await fetch(`${getBaseUrl()}/dashboard?${q.toString()}`);
  return parseJsonResponse(res);
}

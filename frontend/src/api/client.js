const BASE = '/api'

export async function startSearch(params) {
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getTaskStatus(taskId) {
  const res = await fetch(`${BASE}/tasks/${taskId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getTaskResults(taskId, page = 1, pageSize = 50, filters = {}) {
  const params = new URLSearchParams({ page, page_size: pageSize })
  const {
    areas, districts, salary_min, job_name, company,
    date_from, date_to, apply_min, apply_max, tags,
    sort_by, sort_dir,
  } = filters
  if (areas?.length)     params.set('areas', areas.join(','))
  if (districts?.length) params.set('districts', districts.join(','))
  if (salary_min != null && salary_min !== '') params.set('salary_min', salary_min)
  if (job_name)  params.set('job_name', job_name)
  if (company)   params.set('company', company)
  if (date_from) params.set('date_from', date_from)
  if (date_to)   params.set('date_to', date_to)
  if (apply_min != null && apply_min !== '') params.set('apply_min', apply_min)
  if (apply_max != null && apply_max !== '') params.set('apply_max', apply_max)
  if (tags?.length) params.set('tags', tags.join(','))
  if (sort_by)  params.set('sort_by', sort_by)
  if (sort_dir) params.set('sort_dir', sort_dir)

  const res = await fetch(`${BASE}/tasks/${taskId}/results?${params}`)
  if (res.status === 202) return null  // still running
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function cancelTask(taskId) {
  const res = await fetch(`${BASE}/tasks/${taskId}/cancel`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteTasks(taskIds) {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_ids: taskIds }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getHistory(limit = 20) {
  const res = await fetch(`${BASE}/history?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

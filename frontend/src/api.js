const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

async function apiRequest(endpoint, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  });

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.error ||
      (data && typeof data === "object"
        ? Object.entries(data)
            .map(([field, errors]) => {
              const text = Array.isArray(errors)
                ? errors.join(", ")
                : String(errors);

              return `${field}: ${text}`;
            })
            .join("; ")
        : null) ||
      `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

export const api = {
  register: (data) =>
    apiRequest("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    apiRequest("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (token) =>
    apiRequest("/auth/logout/", {
      method: "POST",
      token,
    }),

  getTasks: (token) =>
    apiRequest("/tasks/", { token }),

  createTask: (token, data) =>
    apiRequest("/tasks/", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  updateTask: (token, id, data) =>
    apiRequest(`/tasks/${id}/`, {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    }),

  updateStatus: (token, id, status) =>
    apiRequest(`/tasks/${id}/status/`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    }),

  deleteTask: (token, id) =>
    apiRequest(`/tasks/${id}/`, {
      method: "DELETE",
      token,
    }),
};
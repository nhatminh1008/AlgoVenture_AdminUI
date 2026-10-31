let csrf;

export async function api(path, options = {}) {
  const method = options.method || "GET";
  if (!["GET", "HEAD"].includes(method) && !csrf) {
    const response = await fetch("/api/auth/csrf", { credentials: "include" });
    if (!response.ok) throw new Error("Không kết nối được dịch vụ xác thực.");
    csrf = await response.json();
  }
  const headers = { ...options.headers };
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm) headers["Content-Type"] = "application/json";
  if (csrf && !["GET", "HEAD"].includes(method))
    headers[csrf.headerName] = csrf.token;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      method,
      headers,
      credentials: "include",
      body:
        options.body && !isForm ? JSON.stringify(options.body) : options.body,
    });
  } catch {
    throw new Error(
      "Không kết nối được backend. Hãy kiểm tra dịch vụ Spring Boot.",
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("auth-expired"));
    if (response.status === 403) csrf = undefined;
    const failure = new Error(
      error.message || `Yêu cầu thất bại (${response.status}).`,
    );
    failure.status = response.status;
    throw failure;
  }
  if (path === "/auth/login" || path === "/auth/logout") csrf = undefined;
  if (response.status === 204) return null;
  if (options.download) return response.blob();
  return response.json();
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

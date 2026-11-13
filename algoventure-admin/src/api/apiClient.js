let csrfRequest;
let sessionVersion = 0;

function resetSession() {
  sessionVersion++;
  csrfRequest = undefined;
}

function getCsrfToken() {
  if (!csrfRequest) {
    const request = fetch("/api/auth/csrf", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .catch(() => {
        if (csrfRequest === request) csrfRequest = undefined;
        throw new Error("Không kết nối được dịch vụ xác thực.");
      });
    csrfRequest = request;
  }
  return csrfRequest;
}

export async function api(path, options = {}) {
  const method = options.method || "GET";
  const isWrite = method !== "GET" && method !== "HEAD";
  const version = sessionVersion;
  const tokenRequest = isWrite ? getCsrfToken() : csrfRequest;
  const headers = { ...options.headers };
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm) headers["Content-Type"] = "application/json";
  if (isWrite) {
    const csrf = await tokenRequest;
    if (version !== sessionVersion) throw new Error("Vui lòng đăng nhập.");
    headers[csrf.headerName] = csrf.token;
  }
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
    if (version === sessionVersion) {
      if (response.status === 401 && path !== "/auth/login") {
        resetSession();
        window.dispatchEvent(new Event("auth-expired"));
      }
      if (response.status === 403 && csrfRequest === tokenRequest) {
        csrfRequest = undefined;
      }
    }
    const failure = new Error(
      error.message || `Yêu cầu thất bại (${response.status}).`,
    );
    failure.status = response.status;
    throw failure;
  }
  if (path === "/auth/login" || path === "/auth/logout") resetSession();
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

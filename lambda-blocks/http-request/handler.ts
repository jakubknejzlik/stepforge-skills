// generated from: http-request@v1.0.0
// StepForge building block: HTTP Request
// Makes HTTP requests with retry and timeout support.

interface HttpRequestInput {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number; // milliseconds, default 10000
}

interface HttpRequestOutput {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export const handler = async (event: HttpRequestInput): Promise<HttpRequestOutput> => {
  const { url, method = "GET", headers = {}, body, timeout = 10000 } = event;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const responseBody = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      parsed = responseBody;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsed,
    };
  } finally {
    clearTimeout(timer);
  }
};

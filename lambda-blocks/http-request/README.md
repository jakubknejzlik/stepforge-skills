# http-request (v1.0.0)

Generic HTTP request with timeout support.

## Input
```typescript
{
  url: string;              // required
  method?: string;          // GET, POST, PUT, PATCH, DELETE (default: GET)
  headers?: Record<string, string>;
  body?: unknown;           // JSON-serializable
  timeout?: number;         // ms, default 10000
}
```

## Output
```typescript
{
  status: number;           // HTTP status code
  headers: Record<string, string>;
  body: unknown;            // parsed JSON or raw string
}
```

## Error Handling
- Timeout: throws AbortError (caught by SFn retry)
- Network error: throws (caught by SFn retry)
- HTTP 4xx/5xx: returns normally with status code — use SFn choice to branch on status

## Example in SFn
```typescript
const fetchData = sst.aws.StepFunctions.lambdaInvoke({
  name: "FetchData",
  function: "src/blocks/http-request.handler",
  payload: {
    url: "{% $states.input.apiUrl %}",
    method: "GET",
    timeout: 5000,
  },
});
```

# json-transform@1.0.0

Transforms JSON data using JSONata expressions. Ideal for mapping API responses, reshaping payloads between workflow steps, and computing derived values.

## Input

| Field | Type | Required | Description |
|---|---|---|---|
| `data` | any | yes | Source data to transform |
| `expression` | string | yes | JSONata expression |
| `timeout` | number | no | Eval timeout in ms (default: 5000) |

## Output

| Field | Type | Description |
|---|---|---|
| `result` | any | Transformation result |

## JSONata Examples

```jsonata
/* Pick fields */
{ "name": firstName & " " & lastName, "total": $sum(items.price) }

/* Filter array */
orders[status = "active"]

/* Conditional */
amount > 1000 ? "high" : "low"
```

## Step Functions Usage

```typescript
definition
  .lambdaInvoke("Transform Response", {
    handler: "src/blocks/json-transform/handler.handler",
    payload: {
      "data.$": "$.apiResponse",
      "expression": "{ \"id\": data.id, \"name\": data.attributes.name }"
    },
  })
```

## Dependencies

- `jsonata` — must be included in workspace `package.json`

## Error Handling

- Throws on invalid JSONata syntax
- Throws on evaluation timeout
- Returns `undefined` result if expression matches nothing

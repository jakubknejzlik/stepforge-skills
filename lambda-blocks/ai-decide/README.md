# ai-decide@1.0.0

Uses an LLM (Claude) to make decisions within a workflow. Useful for classification, routing, content moderation, or any step that needs judgment rather than deterministic logic.

## Input

| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | yes | What to decide |
| `context` | object | no | Relevant data for the decision |
| `options` | string[] | no | Constrained choices (LLM picks one) |
| `model` | string | no | Model ID (default: claude-sonnet-5) |
| `maxTokens` | number | no | Max response tokens (default: 1024) |

## Output

| Field | Type | Description |
|---|---|---|
| `decision` | string | The decision or answer |
| `reasoning` | string | Why this decision was made |
| `confidence` | string | `high`, `medium`, or `low` |
| `selectedOption` | number | Index of chosen option (if options provided) |

## Step Functions Usage

```typescript
definition
  .lambdaInvoke("Classify Ticket", {
    handler: "src/blocks/ai-decide/handler.handler",
    payload: {
      "prompt": "Classify this support ticket by urgency and department",
      "context.$": "$.ticket",
      "options": ["billing", "technical", "general"]
    },
  })
  .choice("Route by Department", {
    choices: [
      { condition: "{% selectedOption = 0 %}", next: "BillingQueue" },
      { condition: "{% selectedOption = 1 %}", next: "TechQueue" },
    ],
    fallback: "GeneralQueue",
  })
```

## Secrets

Requires `ANTHROPIC_API_KEY` as an SST secret:
```bash
sst secret set AnthropicApiKey <value> --stage dev
```

Link to Lambda in SST config:
```typescript
new sst.aws.Function("AiDecide", {
  handler: "src/blocks/ai-decide/handler.handler",
  environment: {
    ANTHROPIC_API_KEY: anthropicApiKey.value,
  },
});
```

## Error Handling

- Throws if `ANTHROPIC_API_KEY` not set
- Throws on API errors (rate limit, auth, server error)
- Throws if LLM response is not valid JSON

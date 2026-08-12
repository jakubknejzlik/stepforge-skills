# Lambda Building Blocks Skill

Reusable Lambda functions for common workflow tasks.

## Principles

1. Each block is a single-purpose Lambda function
2. Blocks are versioned — tag generated code with `// generated from: <block>@<version>`
3. Blocks handle their own error reporting
4. Input/output follows a consistent JSON schema
5. Blocks are stateless — state lives in Step Functions or DynamoDB

## Available Blocks

### http-request (v1)
Generic HTTP request with retry and timeout.
- Input: `{ url, method, headers?, body?, timeout? }`
- Output: `{ status, headers, body }`

### json-transform (v1)
JSONata transformation on input data.
- Input: `{ data, expression }`
- Output: transformed data

### slack-notify (v1)
Send Slack message via webhook or API.
- Input: `{ webhook_url?, channel?, text, blocks? }`
- Output: `{ ok, ts? }`

### ai-decide (v1)
Claude API call for decisions requiring reasoning.
- Input: `{ prompt, context?, model? }`
- Output: `{ decision, reasoning }`

### s3-storage (v1)
Read/write S3 objects.
- Input: `{ action: "get"|"put", bucket, key, body? }`
- Output: `{ body? }` or `{ etag }`

### dynamo-crud (v1)
DynamoDB basic operations.
- Input: `{ action: "get"|"put"|"query"|"delete", table, key, item? }`
- Output: `{ item? }` or `{ items? }`

## Creating a New Block

1. Create handler in `src/blocks/<name>.ts`
2. Export `handler` function with typed input/output
3. Add documentation to this skill
4. Register in `infra/blocks.ts`
5. Version: start at v1, bump on breaking changes

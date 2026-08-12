# Step Functions Skill

How to build AWS Step Functions workflows using SST v3.

## SST v3 Component

`sst.aws.StepFunctions` — fluent TypeScript API for defining state machines.

### Basic Pattern
```typescript
const step1 = sst.aws.StepFunctions.lambdaInvoke({
  name: "Step1",
  function: "src/workflows/my-workflow/step1.handler",
});

const step2 = sst.aws.StepFunctions.lambdaInvoke({
  name: "Step2",
  function: "src/workflows/my-workflow/step2.handler",
});

const fail = sst.aws.StepFunctions.fail({ name: "Failed" });

new sst.aws.StepFunctions("MyWorkflow", {
  definition: step1
    .catch(fail)
    .retry({ maxAttempts: 3, backoffRate: 2, interval: "1 second" })
    .next(step2),
});
```

### Available State Types
- `lambdaInvoke` — invoke a Lambda function
- `sqsSendMessage` — send to SQS (supports task token for async)
- `snsPublish` — publish to SNS topic
- `eventBridgePutEvents` — put events on EventBridge
- `ecsRunTask` — run an ECS task
- `task` — generic (any ASL resource ARN)
- `pass` — transform/pass data
- `wait` — wait for duration or timestamp
- `choice` — conditional branching (JSONata)
- `parallel` — fan-out parallel branches
- `map` — iterate over a list
- `succeed` / `fail` — terminal states

### Data Transforms (JSONata)
SST v3 uses JSONata (not JSONPath) for all expressions:
```typescript
// Access input
"{% $states.input.orderId %}"

// Access previous step result
"{% $states.result.Payload.status %}"

// Conditions in choice
choice.when("{% $states.result.amount > 1000 %}", approvalStep)

// Math/string operations
"{% $states.input.price * $states.input.quantity %}"
```

### Error Handling
```typescript
step
  .catch(failState)                    // catch all errors
  .catch(retryState, { errors: ["States.TaskFailed"] })  // specific
  .retry({ maxAttempts: 3, backoffRate: 2, interval: "1 second" })
```

### Async Task Token
For steps that need external callback (human approval, async processing):
```typescript
const sendMessage = sst.aws.StepFunctions.sqsSendMessage({
  name: "WaitForApproval",
  integration: "token",  // pauses until SendTaskSuccess
  queue: approvalQueue,
  messageBody: { token: "{% $states.context.Task.Token %}" },
});
```

## Patterns

See `patterns/` directory for common workflow patterns:
- Sequential (A → B → C)
- Fan-out (parallel branches)
- Approval (task token + human input)
- Retry with DLQ
- Scheduled (EventBridge → SFn)

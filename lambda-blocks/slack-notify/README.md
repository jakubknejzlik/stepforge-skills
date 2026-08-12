# slack-notify (v1.0.0)

Send messages to Slack via incoming webhook.

## Input
```typescript
{
  webhook_url: string;      // Slack incoming webhook URL
  text: string;             // Message text (supports Slack markdown)
  blocks?: unknown[];       // Optional Block Kit blocks
  username?: string;        // Override bot username
  icon_emoji?: string;      // Override bot icon
}
```

## Output
```typescript
{
  ok: boolean;
}
```

## Secrets
The `webhook_url` should come from SST secrets, not hardcoded:
```typescript
const slackWebhook = new sst.Secret("SlackWebhookUrl");

sst.aws.StepFunctions.lambdaInvoke({
  name: "Notify",
  function: {
    handler: "src/blocks/slack-notify.handler",
    link: [slackWebhook],
  },
});
```
In the handler, read via `Resource.SlackWebhookUrl.value`.

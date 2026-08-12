// generated from: slack-notify@v1.0.0
// StepForge building block: Slack Notification
// Sends messages to Slack via webhook URL.

interface SlackNotifyInput {
  webhook_url: string;
  text: string;
  blocks?: unknown[];
  username?: string;
  icon_emoji?: string;
}

interface SlackNotifyOutput {
  ok: boolean;
}

export const handler = async (event: SlackNotifyInput): Promise<SlackNotifyOutput> => {
  const { webhook_url, text, blocks, username, icon_emoji } = event;

  const payload: Record<string, unknown> = { text };
  if (blocks) payload.blocks = blocks;
  if (username) payload.username = username;
  if (icon_emoji) payload.icon_emoji = icon_emoji;

  const response = await fetch(webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${await response.text()}`);
  }

  return { ok: true };
};

// ai-decide@1.0.0 — AI decision block
// Uses an LLM to make a decision based on context and options

interface AiDecideInput {
  /** Description of the decision to make */
  prompt: string;
  /** Contextual data for the decision */
  context?: Record<string, unknown>;
  /** Available options (if constrained choice) */
  options?: string[];
  /** Model to use (default: claude-sonnet-5) */
  model?: string;
  /** Max tokens for response (default: 1024) */
  maxTokens?: number;
}

interface AiDecideOutput {
  /** The decision or answer */
  decision: string;
  /** Reasoning behind the decision */
  reasoning: string;
  /** Confidence: high | medium | low */
  confidence: "high" | "medium" | "low";
  /** Selected option index (if options were provided) */
  selectedOption?: number;
}

export const handler = async (
  event: AiDecideInput
): Promise<AiDecideOutput> => {
  const {
    prompt,
    context = {},
    options,
    model = "claude-sonnet-5",
    maxTokens = 1024,
  } = event;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured — use sst secret set");
  }

  const systemPrompt = options
    ? `You are a decision engine. Analyze the context and choose from the given options. Respond in JSON: {"decision": "your choice", "reasoning": "why", "confidence": "high|medium|low", "selectedOption": index}`
    : `You are a decision engine. Analyze the context and provide your decision. Respond in JSON: {"decision": "your answer", "reasoning": "why", "confidence": "high|medium|low"}`;

  const userMessage = [
    prompt,
    context && Object.keys(context).length > 0
      ? `\nContext:\n${JSON.stringify(context, null, 2)}`
      : "",
    options ? `\nOptions:\n${options.map((o, i) => `${i}: ${o}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content[0]?.text ?? "{}";

  return JSON.parse(text) as AiDecideOutput;
};

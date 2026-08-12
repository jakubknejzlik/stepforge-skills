// json-transform@1.0.0 — JSON data transformation block
// Uses JSONata expressions for flexible data mapping

import jsonata from "jsonata";

interface JsonTransformInput {
  /** Source data to transform */
  data: unknown;
  /** JSONata expression string */
  expression: string;
  /** Optional timeout in milliseconds (default: 5000) */
  timeout?: number;
}

interface JsonTransformOutput {
  result: unknown;
}

export const handler = async (
  event: JsonTransformInput
): Promise<JsonTransformOutput> => {
  const { data, expression, timeout = 5000 } = event;

  const expr = jsonata(expression);
  expr.assign("now", Date.now());

  const result = await expr.evaluate(data, undefined, {
    timeout,
  });

  return { result };
};

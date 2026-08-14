const VARIABLE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderTemplate(
  template: string,
  variables: Record<string, unknown> = {},
): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = getNestedValue(variables, key);
    return value === undefined || value === null ? '' : String(value);
  });
}

function getNestedValue(
  source: Record<string, unknown>,
  path: string,
): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

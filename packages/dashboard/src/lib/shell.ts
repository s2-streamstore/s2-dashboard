export function shellQuote(value: string): string {
  // Keep user-controlled values literal in copy-paste shell commands.
  return `'${value.replace(/'/g, "'\\''")}'`;
}

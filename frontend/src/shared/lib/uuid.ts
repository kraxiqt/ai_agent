//crypto.randomUUID с запасным вариантом для небезопасных контекстов (http без localhost) TODO()
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = (Math.random() * 16) | 0;
    return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

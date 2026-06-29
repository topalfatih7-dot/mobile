function readEnv(key: string): string {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export { readEnv };

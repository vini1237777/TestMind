export function createRunLogger(scope: string) {
  const startedAt = Date.now();

  return {
    start(message: string, meta?: Record<string, unknown>) {
      console.log(`[${scope}] START: ${message}`, meta ?? {});
    },
    info(message: string, meta?: Record<string, unknown>) {
      console.log(`[${scope}] INFO: ${message}`, meta ?? {});
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(`[${scope}] ERROR: ${message}`, meta ?? {});
    },
    end(message: string, meta?: Record<string, unknown>) {
      const durationMs = Date.now() - startedAt;
      console.log(`[${scope}] END: ${message}`, { durationMs, ...(meta ?? {}) });
    },
  };
}

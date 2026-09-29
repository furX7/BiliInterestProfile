export function measureJsCssBytes(outputDir: string): number

export function assertBundleBudget(
  budget: unknown,
  actualByBrowser: { chrome: number; edge: number },
): void

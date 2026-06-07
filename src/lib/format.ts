/** Round to whole, RU thousands grouping. */
export function fmt0(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

/** One decimal, RU formatting (drops trailing .0). */
export function fmt1(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  });
}

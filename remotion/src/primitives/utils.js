export function renderLines(text) {
  if (!text) return null;
  return text.split('\n').flatMap((line, j, arr) =>
    j < arr.length - 1 ? [line, <br key={j} />] : [line]
  );
}

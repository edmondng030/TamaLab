type Color = [number, number, number];
// Device-independent median-cut palette. Transparency is not counted as a color.
export function quantize(rgba: Uint8ClampedArray, count: number) {
  if (![2, 4, 16, 256].includes(count))
    throw new Error("Choose 2, 4, 16, or 256 colors.");
  if (rgba.length % 4)
    throw new Error("RGBA data must contain complete pixels.");
  const colors: Color[] = [];
  for (let i = 0; i < rgba.length; i += 4)
    if (rgba[i + 3] > 0) colors.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  if (!colors.length) return { pixels: rgba.slice(), palette: [] as Color[] };
  const boxes: Color[][] = [colors];
  while (boxes.length < count) {
    let chosen = -1;
    let widest = 0;
    let axis = 0;
    boxes.forEach((box, index) => {
      for (let channel = 0; channel < 3; channel++) {
        let min = 255;
        let max = 0;
        for (const color of box) {
          min = Math.min(min, color[channel]);
          max = Math.max(max, color[channel]);
        }
        if (max - min > widest) {
          chosen = index;
          widest = max - min;
          axis = channel;
        }
      }
    });
    if (chosen < 0) break;
    const box = boxes[chosen].sort((a, b) => a[axis] - b[axis]);
    let middle = Math.floor(box.length / 2);
    // Never split a run of identical channel values: doing so can dilute a rare
    // color even when the source already fits in the requested palette.
    while (middle < box.length && box[middle - 1][axis] === box[middle][axis])
      middle++;
    if (middle === box.length) {
      middle = Math.floor(box.length / 2);
      while (middle > 0 && box[middle - 1][axis] === box[middle][axis])
        middle--;
    }
    boxes.splice(chosen, 1, box.slice(0, middle), box.slice(middle));
  }
  const palette: Color[] = boxes.map(
    (box) =>
      [0, 1, 2].map((channel) =>
        Math.round(
          box.reduce((sum, color) => sum + color[channel], 0) / box.length,
        ),
      ) as Color,
  );
  const pixels = rgba.slice();
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    let best = palette[0];
    let distance = Infinity;
    for (const color of palette) {
      const d =
        (color[0] - pixels[i]) ** 2 +
        (color[1] - pixels[i + 1]) ** 2 +
        (color[2] - pixels[i + 2]) ** 2;
      if (d < distance) {
        distance = d;
        best = color;
      }
    }
    pixels.set(best, i);
  }
  return { pixels, palette };
}

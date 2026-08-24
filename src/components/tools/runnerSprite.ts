/**
 * The pixel run cycle, shared by the Tools terrain and the footer wordmark.
 *
 * Frames are authored as bitmaps so the shapes stay legible in the source —
 * `#` is a filled pixel. The cycle alternates contact / passing on each leg,
 * which is the minimum that reads as running rather than sliding.
 */
export const FRAMES: string[][] = [
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '..#######...',
    '.########...',
    '##..#####...',
    '....#####...',
    '....####....',
    '...###.##...',
    '..###...##..',
    '.###.....##.',
    '###.......##',
    '##.........#',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '...#####.#..',
    '..######.##.',
    '.#######..#.',
    '...#####....',
    '...#####....',
    '...#####....',
    '...##.###...',
    '..##...###..',
    '.###....###.',
    '###......##.',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '...#######..',
    '...########.',
    '...#####..##',
    '...#####....',
    '....####....',
    '...##.###...',
    '..##...###..',
    '.##.....###.',
    '##.......###',
    '#.........##',
  ],
  [
    '....####....',
    '....####....',
    '....####....',
    '.....##.....',
    '..#.#####...',
    '.##.######..',
    '.#..#######.',
    '....#####...',
    '....#####...',
    '....#####...',
    '...###.##...',
    '..###...##..',
    '.###....###.',
    '.##......###',
  ],
];

export const FRAME_W = 12;
export const FRAME_H = 14;

/** Frames of the run cycle per second. */
export const CYCLE_FPS = 10;

/**
 * Paints one frame of the sprite with its feet on `baselineY`, in `scale`-sized
 * pixels. Callers set `ctx.fillStyle` first — the Tools terrain draws it in
 * ink, the footer inherits whatever the wordmark is using.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: number,
  x: number,
  baselineY: number,
  scale: number
): void {
  const bitmap = FRAMES[((frame % FRAMES.length) + FRAMES.length) % FRAMES.length];
  const top = baselineY - FRAME_H * scale;

  for (let y = 0; y < FRAME_H; y += 1) {
    const row = bitmap[y];
    for (let px = 0; px < FRAME_W; px += 1) {
      if (row[px] !== '#') continue;
      ctx.fillRect(
        Math.round(x + px * scale),
        Math.round(top + y * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      );
    }
  }
}

declare module "gifuct-js" {
  interface GifFrame {
    dims: { width: number; height: number; top: number; left: number };
    delay: number;
    disposalType: number;
    patch: ArrayLike<number>;
  }
  interface ParsedGif {
    lsd: { width: number; height: number };
  }
  export function parseGIF(buffer: ArrayBuffer): ParsedGif;
  export function decompressFrames(
    gif: ParsedGif,
    buildPatch: boolean,
  ): GifFrame[];
}

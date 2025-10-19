/**
 * Type declarations for Web APIs available in Cloudflare Workers
 * These declarations ensure TypeScript recognizes OffscreenCanvas and createImageBitmap
 */

declare global {
  /**
   * OffscreenCanvas provides a canvas that can be rendered off screen.
   * It is available in Cloudflare Workers for image processing.
   */
  class OffscreenCanvas {
    constructor(width: number, height: number);
    width: number;
    height: number;
    getContext(contextId: "2d"): OffscreenCanvasRenderingContext2D | null;
    getContext(contextId: "bitmaprenderer"): ImageBitmapRenderingContext | null;
    getContext(contextId: "webgl"): WebGLRenderingContext | null;
    getContext(contextId: "webgl2"): WebGL2RenderingContext | null;
    getContext(contextId: "webgpu"): GPUCanvasContext | null;
    convertToBlob(options?: ImageEncodeOptions): Promise<Blob>;
    transferToImageBitmap(): ImageBitmap;
  }

  /**
   * OffscreenCanvasRenderingContext2D provides the 2D rendering context for the drawing surface of an OffscreenCanvas.
   */
  interface OffscreenCanvasRenderingContext2D
    extends CanvasState,
      CanvasTransform,
      CanvasCompositing,
      CanvasImageSmoothing,
      CanvasFillStrokeStyles,
      CanvasShadowStyles,
      CanvasFilters,
      CanvasRect,
      CanvasDrawPath,
      CanvasUserInterface,
      CanvasText,
      CanvasDrawImage,
      CanvasImageData,
      CanvasPathDrawingStyles,
      CanvasTextDrawingStyles,
      CanvasPath {
    readonly canvas: OffscreenCanvas;
  }

  /**
   * ImageBitmapRenderingContext provides the rendering context for transferring an ImageBitmap to a canvas.
   */
  interface ImageBitmapRenderingContext {
    readonly canvas: OffscreenCanvas;
    transferFromImageBitmap(bitmap: ImageBitmap | null): void;
  }

  /**
   * ImageEncodeOptions for canvas conversion
   */
  interface ImageEncodeOptions {
    type?: string;
    quality?: number;
  }

  /**
   * createImageBitmap creates an ImageBitmap from various sources
   */
  function createImageBitmap(
    image: ImageBitmapSource,
    sx?: number,
    sy?: number,
    sw?: number,
    sh?: number,
    options?: ImageBitmapOptions
  ): Promise<ImageBitmap>;

  /**
   * ImageBitmapSource union type for createImageBitmap
   */
  type ImageBitmapSource =
    | HTMLImageElement
    | SVGImageElement
    | HTMLVideoElement
    | HTMLCanvasElement
    | Blob
    | ImageData
    | ImageBitmap
    | OffscreenCanvas
    | File;

  /**
   * ImageBitmapOptions for createImageBitmap
   */
  interface ImageBitmapOptions {
    imageOrientation?: ImageOrientation;
    premultiplyAlpha?: PremultiplyAlpha;
    colorSpaceConversion?: ColorSpaceConversion;
    resizeWidth?: number;
    resizeHeight?: number;
    resizeQuality?: ResizeQuality;
  }

  /**
   * ImageBitmap represents a bitmap image which can be drawn to a canvas
   */
  interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
  }

  /**
   * Enums for ImageBitmapOptions
   */
  type ImageOrientation = "none" | "flipY";
  type PremultiplyAlpha = "none" | "premultiply" | "default";
  type ColorSpaceConversion = "none" | "default";
  type ResizeQuality = "pixelated" | "low" | "medium" | "high";
}

export {};

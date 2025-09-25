import { Viewport, ScreenshotOptions, PDFOptions } from "puppeteer";
import { Data } from "ejs";

export interface ImageRenderConfig {
  viewport?: Viewport;
  options: ScreenshotOptions;
  data?: Data;
  delayMs?: number;
}

export interface PDFRenderConfig {
  options: PDFOptions;
  data?: Data;
  delayMs?: number;
}

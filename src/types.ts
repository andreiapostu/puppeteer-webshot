import { Viewport, ScreenshotOptions, PDFOptions } from "puppeteer";
import { Data } from "ejs";

export interface ImageRenderConfig {
    viewport?: Viewport;
    options: ScreenshotOptions;
    data?: Data;
    delayMs?: number;
    metadata?: ImageMetadata;
}

export interface PDFRenderConfig {
    options: PDFOptions;
    data?: Data;
    delayMs?: number;
    metadata?: PDFMetadata;
}

export interface ImageMetadata {
    // todo
}

export interface PDFMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modDate?: Date;
    language?: string;
    custom?: Record<string, string | number | boolean>;
}

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { applyImageMetadata, applyPdfMetadata } from "../../src/metadata";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import exifReader from "exif-reader";

describe("Metadata Processor", () => {
    const fixturesDir = path.resolve(__dirname, "../fixtures");
    const tempDir = path.resolve(__dirname, "../tmp-meta");

    beforeAll(async () => {
        await fs.mkdir(tempDir, { recursive: true });
    });

    afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    const mockImageMetadata = {
        title: "Sunset Over Mountains",
        author: "Andrei Apostu",
        copyright: "(C) 2026 Andrei Apostu",
        software: "Test Generator",
        creationDate: new Date("2026-04-29T12:00:00.000Z"),
        keywords: ["nature", "sunset", "mountains"],
        custom: {
            campaignId: "camp_123",
            score: 85,
            version: "1.0.0",
        }
    };

    const mockPdfMetadata = {
        title: "Sunset Over Mountains",
        author: "Andrei Apostu",
        subject: "Test Subject",
        keywords: ["nature", "sunset", "mountains"],
        creator: "Test Creator",
        producer: "Test Producer",
        creationDate: new Date("2026-04-29T12:00:00.000Z"),
        modDate: new Date("2026-05-01T15:00:00.000Z"),
        language: "es-MX",
        custom: {
            campaignId: "camp_123",
            version: "2.0.0",
            score: 95,
        },
    };

    describe("Image Formats (PNG, JPG, WebP)", () => {
        it.each([
            { ext: "png", file: "test.png" },
            { ext: "jpg", file: "test.jpg" },
            { ext: "webp", file: "test.webp" },
        ])("should apply all Exif metadata fields to $ext files", async ({ file, ext }) => {
            const originalPath = path.join(fixturesDir, file);
            const tempPath = path.join(tempDir, `test-copy.${ext}`);
            await fs.copyFile(originalPath, tempPath);

            await applyImageMetadata(tempPath, mockImageMetadata);

            const imgAfter = sharp(tempPath);
            const metaAfter = await imgAfter.metadata();

            expect(metaAfter.exif).toBeDefined();

            const parsedExif = exifReader(metaAfter.exif!);
            expect(parsedExif).toBeDefined();

            expect(parsedExif?.Image?.ImageDescription).toBe(mockImageMetadata.title);
            expect(parsedExif?.Image?.Artist).toBe(mockImageMetadata.author);
            expect(parsedExif?.Image?.Copyright).toBe(mockImageMetadata.copyright);
            expect(parsedExif?.Image?.Software).toBe(mockImageMetadata.software);

            expect(parsedExif?.Photo?.DateTimeOriginal).toEqual(mockImageMetadata.creationDate);

            if (parsedExif?.Photo?.UserComment) {
                const commentString = parsedExif.Photo.UserComment.toString();

                mockImageMetadata.keywords.forEach(keyword => {
                    expect(commentString).toContain(keyword);
                });

                if (mockImageMetadata.custom) {
                    Object.entries(mockImageMetadata.custom).forEach(([key, value]) => {
                        expect(commentString).toContain(`"${key}":${typeof value === 'string' ? `"${value}"` : value}`);
                    });
                }
            } else {
                throw new Error(`Exif Photo.UserComment block is missing in ${ext}`);
            }
        });
    });

    describe("Document Formats (PDF)", () => {
        it("should apply all metadata fields to PDF files correctly", async () => {
            const originalPath = path.join(fixturesDir, "test.pdf");
            const tempPath = path.join(tempDir, "test-copy.pdf");
            await fs.copyFile(originalPath, tempPath);

            await applyPdfMetadata(tempPath, mockPdfMetadata);

            const docBytes = await fs.readFile(tempPath);
            const doc = await PDFDocument.load(docBytes);

            expect(doc.getTitle()).toBe(mockPdfMetadata.title);
            expect(doc.getAuthor()).toBe(mockPdfMetadata.author);
            expect(doc.getCreator()).toBe(mockPdfMetadata.creator);
            expect(doc.getCreationDate()).toEqual(mockPdfMetadata.creationDate);
            expect(doc.getSubject()).toBe(mockPdfMetadata.subject);
            expect(doc.getProducer()).toBe(mockPdfMetadata.producer);
            expect(doc.getModificationDate()).toEqual(mockPdfMetadata.modDate);

            const docKeywords = doc.getKeywords() || [];

            mockPdfMetadata.keywords.forEach(keyword => {
                expect(docKeywords).toContain(keyword);
            });

            expect(docKeywords).toContain(`Language=${mockPdfMetadata.language}`);

            if (mockPdfMetadata.custom) {
                Object.entries(mockPdfMetadata.custom).forEach(([key, value]) => {
                    expect(docKeywords).toContain(`${key}=${String(value)}`);
                });
            }
        });
    });
});

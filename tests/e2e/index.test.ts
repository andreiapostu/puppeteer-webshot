import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Renderer } from "../../src/renderer";
import { WebServer } from "../../src/webserver";
import path from "path";
import fs from "fs/promises";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import exifReader from "exif-reader";

describe("Renderer E2E", { timeout: 15000 }, () => {
    const fixturesDir = path.resolve(__dirname, "../fixtures");
    const tempDir = path.resolve(__dirname, "../tmp-e2e");
    let renderer: Renderer;

    beforeAll(async () => {
        await fs.mkdir(tempDir, { recursive: true });
        renderer = await Renderer.init();
    });

    afterAll(async () => {
        if (renderer) {
            await renderer.close();
        }
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("should render a remote URL to an image", async () => {
        const outputPath = path.join(tempDir, "remote.png");
        const htmlPath = path.join(fixturesDir, "test.html");
        
        const mockRemoteServer = new WebServer(0, htmlPath);
        const url = `http://127.0.0.1:${mockRemoteServer.port}`;

        await renderer.image(url, {
            viewport: { width: 1280, height: 720 },
            options: { path: outputPath as `${string}.png` },
        });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);
        
        mockRemoteServer.stop();
    });

    it("should render a local EJS template to a PDF with injected data and metadata", async () => {
        const templatePath = path.join(fixturesDir, "test.ejs");
        const outputPath = path.join(tempDir, "local.pdf");
        
        const testData = { title: "Example Report" };
        const testMetadata = {
            title: "Example PDF",
            author: "Andrei Apostu",
        };

        await renderer.pdf(templatePath, {
            options: { path: outputPath, format: "A4" },
            data: testData,
            metadata: testMetadata,
        });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);

        const pdfBytes = await fs.readFile(outputPath);
        const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
        
        expect(doc.getTitle()).toBe(testMetadata.title);
        expect(doc.getAuthor()).toBe(testMetadata.author);
    });

    it("should render a local HTML directory to an image with metadata", async () => {
        const htmlPath = path.join(fixturesDir, "test.html");
        const outputPath = path.join(tempDir, "local-dir.jpg");

        const testMetadata = {
            author: "Andrei Apostu",
            software: "puppeteer-webshot",
        };

        await renderer.image(htmlPath, {
            options: { path: outputPath as `${string}.jpeg`, type: "jpeg" },
            metadata: testMetadata,
        });

        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);

        const img = sharp(outputPath);
        const meta = await img.metadata();
        expect(meta.exif).toBeDefined();

        const parsedExif = exifReader(meta.exif!);
        expect(parsedExif?.Image?.Artist).toBe(testMetadata.author);
        expect(parsedExif?.Image?.Software).toBe(testMetadata.software);
    });

    it("should throw an error when rendering a non-existent remote URL and leave no garbage files", async () => {
        const outputPath = path.join(tempDir, "fail.png");

        await expect(
            renderer.image("http://this-url-is-fake-and-should-fail.test", {
                options: { path: outputPath as `${string}.png` },
            })
        ).rejects.toThrow();

        await expect(fs.stat(outputPath)).rejects.toThrow();
    });

    it("should throw an error when rendering a non-existent local file and leave no garbage files", async () => {
        const outputPath = path.join(tempDir, "fail.pdf");
        const fakePath = path.join(fixturesDir, "does-not-exist.html");

        await expect(
            renderer.pdf(fakePath, {
                options: { path: outputPath },
            })
        ).rejects.toThrow();

        await expect(fs.stat(outputPath)).rejects.toThrow();
    });

    it("should respect the delayMs configuration before capturing", async () => {
        const htmlPath = path.join(fixturesDir, "test.html");
        const outputPath = path.join(tempDir, "delayed.png");
        const delay = 1000; 

        const startTime = performance.now();
        
        await renderer.image(htmlPath, {
            options: { path: outputPath as `${string}.png` },
            delayMs: delay,
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        expect(executionTime).toBeGreaterThanOrEqual(delay);
        
        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);
    });
});
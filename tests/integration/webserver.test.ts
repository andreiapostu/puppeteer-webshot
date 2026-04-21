import { describe, it, expect } from "vitest";
import { WebServer } from "../../src/webserver";
import path from "path";
import fs from "fs";
import { createServer } from "net";

async function getAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = (server.address() as any).port;
            server.close(() => resolve(port));
        });
    });
}

describe("WebServer", () => {
    const fixturesDir = path.resolve(__dirname, "../fixtures");

    it("should start up, respond to requests, and shut down gracefully", async () => {
        const port = await getAvailablePort();
        const htmlPath = path.join(fixturesDir, "test.html");

        const server = new WebServer(port, htmlPath);

        const res = await fetch(`http://127.0.0.1:${port}`, { headers: { 'Connection': 'close' } });
        await res.text();
        expect(res.status).toBe(200);

        server.stop();

        await expect(fetch(`http://127.0.0.1:${port}`, { headers: { 'Connection': 'close' } })).rejects.toThrow();
    });

    it("should serve the right HTML content", async () => {
        const port = await getAvailablePort();
        const htmlPath = path.join(fixturesDir, "test.html");

        const server = new WebServer(port, htmlPath);

        const res = await fetch(`http://127.0.0.1:${port}`, { headers: { 'Connection': 'close' } });
        expect(res.status).toBe(200);

        const text = await res.text();
        const expectedHtml = fs.readFileSync(htmlPath, "utf-8");
        expect(text).toBe(expectedHtml);

        server.stop();
    });

    it("should render the right EJS content", async () => {
        const port = await getAvailablePort();
        const ejsPath = path.join(fixturesDir, "test.ejs");

        const renderData = { title: "Test" };
        const server = new WebServer(port, ejsPath, renderData);

        const res = await fetch(`http://127.0.0.1:${port}`, { headers: { 'Connection': 'close' } });
        expect(res.status).toBe(200);

        const text = await res.text();

        const ejs = await import('ejs');
        const expectedOutput = await ejs.renderFile(ejsPath, renderData);

        expect(text).toBe(expectedOutput);

        server.stop();
    });
});

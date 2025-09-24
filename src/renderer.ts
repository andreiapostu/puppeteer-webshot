import puppeteer, { Browser, Page, ScreenshotOptions, PDFOptions, Viewport } from 'puppeteer';
import { Data } from 'ejs';
import { WebServer } from './webserver';

export class Renderer {
    private browser: Browser;
    private port: number;

    private constructor(browser: Browser, port: number = 4732) {
        this.browser = browser;
        this.port = port;
    }

    public static async init(port?: number): Promise<Renderer> {
        const browser = await puppeteer.launch();
        return new Renderer(browser, port);
    }

    public async close(): Promise<void> {
        await this.browser.close();
    }

    public async image(
        url: string,
        viewport: Viewport,
        options: ScreenshotOptions,
        data?: Data,
        delayMs?: number,
    ): Promise<void> {
        const page = await this.loadPage(url, viewport, data, delayMs);

        await page.screenshot(options);

        await page.close();
    }

    public async pdf(
        url: string,
        options: PDFOptions,
        data?: Data,
        delayMs?: number,
    ): Promise<void> {
        const page = await this.loadPage(url, undefined, data, delayMs);

        await page.pdf(options);

        await page.close();
    }

    private async loadPage(url: string, viewport?: Viewport, data?: Data, delayMs?: number): Promise<Page> {
        const page = await this.browser.newPage();
        if (viewport)
            page.setViewport(viewport);

        if (url.startsWith("http"))
            await this.loadRemoteDir(page, url);
        else
            await this.loadLocalDir(page, url, data);

        if (delayMs)
            await Renderer.sleep(delayMs);

        return page;
    }

    private async loadRemoteDir(page: Page, url: string): Promise<void> {
        await page.goto(
            url,
            {
                waitUntil: "networkidle0",
            }
        )
    }

    private async loadLocalDir(page: Page, path: string, data?: Data): Promise<void> {
        const webserver = new WebServer(this.port, path, data);
        await this.loadRemoteDir(page, `http://localhost:${this.port}/`);
        webserver.stop();
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

import puppeteer, { Browser, Page } from 'puppeteer';
import { WebServer } from './webserver';
import { applyImageMetadata, applyPdfMetadata } from './metadata';
import { ImageRenderConfig, PDFRenderConfig } from './types';
import { Data } from 'ejs';

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
        config: ImageRenderConfig,
    ): Promise<void> {
        const page = await this.loadPage(url, config);

        await page.screenshot(config.options);

        await page.close();

        if (config.metadata && config.options.path)
            await applyImageMetadata(config.options.path, config.metadata);
    }

    public async pdf(
        url: string,
        config: PDFRenderConfig,
    ): Promise<void> {
        const page = await this.loadPage(url, config);

        await page.pdf(config.options);

        await page.close();

        if (config.metadata && config.options.path)
            await applyPdfMetadata(config.options.path, config.metadata);
    }

    private async loadPage(url: string, config: ImageRenderConfig | PDFRenderConfig): Promise<Page> {
        const page = await this.browser.newPage();
        if ("viewport" in config && config.viewport)
            page.setViewport(config.viewport);

        if (url.startsWith("http"))
            await this.loadRemoteDir(page, url);
        else
            await this.loadLocalDir(page, url, config.data);

        if (config.delayMs)
            await Renderer.sleep(config.delayMs);

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

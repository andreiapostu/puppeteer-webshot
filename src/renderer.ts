import puppeteer, { Browser, Page, ScreenshotOptions, Viewport } from 'puppeteer';
import ejs, { Data } from 'ejs';

export class Renderer {
    private browser: Browser;
    private viewport: Viewport;

    private constructor(browser: Browser, viewport: Viewport) {
        this.browser = browser;
        this.viewport = viewport;
    }

    public static async create(viewport: Viewport): Promise<Renderer> {
        const browser = await puppeteer.launch();
        return new Renderer(browser, viewport);
    }

    public setViewport(viewport: Viewport): void {
        this.viewport = viewport;
    }

    public async close(): Promise<void> {
        await this.browser.close();
    }

    public async render(
        url: string,
        options: ScreenshotOptions,
        data?: Data,
        ms?: number,
    ): Promise<void> {
        const page = await this.browser.newPage();
        page.setViewport(this.viewport);

        if (url.startsWith("http"))
            await this.loadRemoteDir(page, url);
        else
            await this.loadLocalDir(page, url, data);

        if (ms)
            await Renderer.sleep(ms);

        await page.screenshot(options);

        await page.close();
    }

    private async loadRemoteDir(page: Page, url: string): Promise<void> {
        await page.goto(
            url,
            {
                waitUntil: "networkidle0",
            }
        )
    }

    private async loadLocalDir(page: Page, url: string, data?: Data): Promise<void> {
        // todo
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

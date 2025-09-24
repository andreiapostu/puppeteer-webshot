# puppeteer-webshot

Render web content into images or PDFs with Puppeteer.  
Supports local files, remote URLs, and EJS templates.

## Install

```bash
npm install puppeteer-webshot
````

## Example

```ts
import { Renderer } from "puppeteer-webshot";

const renderer = await Renderer.init();
await renderer.image("https://example.com", { width: 1280, height: 720 }, { path: "shot.png" });
await renderer.close();
```

# puppeteer-webshot 📸

[![npm version](https://img.shields.io/npm/v/puppeteer-webshot.svg)](https://www.npmjs.com/package/puppeteer-webshot)
[![npm downloads](https://img.shields.io/npm/dm/puppeteer-webshot.svg)](https://www.npmjs.com/package/puppeteer-webshot)

Render web content into **images** or **PDFs**  with [Puppeteer](https://pptr.dev/) and optional [EJS](https://ejs.co/) template rendering. 
This package provides a thin wrapper around Puppeteer for simple, high-quality output generation with metadata support.

---

## Features

- Render from **remote URLs** or **local HTML/EJS templates**  
- Output to **images** (PNG, JPEG, WebP)  
- Output to **PDFs** (configurable format, margins, etc.)  
- Supports **EJS templates** with dynamic data injection  
- Inject custom **metadata** to generated images and PDFs  

---

## 📦 Install

```bash
npm install puppeteer-webshot
````

---

## Quick Example

```ts
import { Renderer } from "puppeteer-webshot";

async function main() {
  // Initialize the renderer
  const renderer = await Renderer.init();

  // Render a remote webpage to an image with metadata
  await renderer.image("https://example.com", {
    viewport: { width: 1280, height: 720 },
    options: { path: "shot.png" },
  });

  // Render a local webpage to PDF with metadata
  await renderer.pdf("./example.html", {
    options: { path: "shot.pdf", format: "A4" },
    metadata: {
      title: "Example Report",
      author: "Andrei",
      producer: "puppeteer-webshot",
    }
  });

  // Close the renderer when done
  await renderer.close();
}

main();
```

---

## 📚 API

### `Renderer.init(port?: number): Promise<Renderer>`

Initializes a new `Renderer` instance and launches the underlying Puppeteer browser.

* **`port`** *(optional, number)*: The port used by the internal server to serve local files. 
    * **Default:** `0` (The OS will automatically assign the next available ephemeral port).
    * If a specific port is provided, the renderer will attempt to use it exactly as requested.

---

### `renderer.close(): Promise<void>`

Closes the underlying Puppeteer browser instance.
Call this when you’re finished with rendering.

---

### `renderer.image(url: string, config: ImageRenderConfig): Promise<void>`

Renders a webpage (local or remote) into an **image**.

**Config (`ImageRenderConfig`):**

* **`viewport`** *(optional, [Viewport](https://pptr.dev/api/puppeteer.viewport))*: The viewport dimensions (e.g. `{ width: 1280, height: 720 }`).
* **`options`** *([ScreenshotOptions](https://pptr.dev/api/puppeteer.screenshotoptions))*: Options for the output image (path, format, quality, etc.).
* **`data`** *(optional, [EJS Data](https://ejs.co/))*: Values to inject into `.ejs` templates.
* **`delayMs`** *(optional, number)*: Wait time (in ms) before capturing.
* **`metadata`** *(optional, [ImageMetadata](#imagemetadata))*: Metadata fields to embed in the image file.

---

### `renderer.pdf(url: string, config: PDFRenderConfig): Promise<void>`

Renders a webpage (local or remote) into a **PDF**.

**Config (`PDFRenderConfig`):**

* **`options`** *([PDFOptions](https://pptr.dev/api/puppeteer.pdfoptions))*: Options for the output PDF (path, format, margins, etc.).
* **`data`** *(optional, [EJS Data](https://ejs.co/))*: Values to inject into `.ejs` templates.
* **`delayMs`** *(optional, number)*: Wait time (in ms) before generating the PDF.
* **`metadata`** *(optional, [PDFMetadata](#pdfmetadata))*: Metadata fields to embed in the PDF.

---

## 📝 Metadata

### ImageMetadata

Metadata supported for **images** (`PNG`, `JPEG`, `WebP`):

* **`title`** *(string)*: Title or description of the image.
* **`author`** *(string)*: Image creator/photographer.
* **`copyright`** *(string)*: Copyright notice.
* **`software`** *(string)*: Name of the software used to generate the file.
* **`creationDate`** *(Date)*: Creation time.
* **`keywords`** *(string[])*: List of keywords/tags.
* **`custom`** *(Record<string, string | number | boolean>)*: Arbitrary metadata fields.

---

### PDFMetadata

Metadata supported for **PDFs**:

* **`title`** *(string)*: Title of the document.
* **`author`** *(string)*: Author of the document.
* **`subject`** *(string)*: Subject or description.
* **`keywords`** *(string[])*: List of keywords/tags.
* **`creator`** *(string)*: Original creator software.
* **`producer`** *(string)*: Producer software.
* **`creationDate`** *(Date)*: Document creation date.
* **`modDate`** *(Date)*: Last modification date.
* **`language`** *(string)*: Language of the document (stored in metadata).
* **`custom`** *(Record<string, string | number | boolean>)*: Arbitrary metadata fields.

---

## 🧩 Examples

### Render from local EJS with data injection

If you have a file `template.ejs`:

```html
<html>
  <body>
    <h1>Hello <%= name %>!</h1>
  </body>
</html>
```

You can render it with:

```ts
const renderer = await Renderer.init();

await renderer.image("./template.ejs", {
  viewport: { width: 800, height: 600 },
  options: { path: "greeting.png" },
  data: { name: "Andrei" },
});

await renderer.close();
```

---

### Render from a folder with metadata

If you pass a **folder path** instead of a file, the renderer will look for an `index.html` or `index.ejs` inside that folder.

```
template/
  index.ejs
  style.css
  script.js
```

You can render it with:

```ts
const renderer = await Renderer.init();

await renderer.pdf("./template", {
  options: { path: "page.pdf", format: "A4" },
  data: { name: "Andrei" },
});

await renderer.close();
```

---

## 📄 License

[MIT](./LICENSE)



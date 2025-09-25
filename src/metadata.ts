import { ImageMetadata, PDFMetadata } from "./types";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";

export async function applyImageMetadata(
    path: string,
    metadata: ImageMetadata
): Promise<void> {
    const input = await fs.readFile(path);

    const sharpMetadata: Record<string, any> = {};

    if (metadata.title) sharpMetadata.title = metadata.title;
    if (metadata.author) sharpMetadata.author = metadata.author;
    if (metadata.copyright) sharpMetadata.copyright = metadata.copyright;
    if (metadata.software) sharpMetadata.software = metadata.software;
    if (metadata.creationDate)
        sharpMetadata.creationTime = metadata.creationDate.toISOString();

    if (metadata.keywords || metadata.custom) {
        sharpMetadata.comment = JSON.stringify({
            keywords: metadata.keywords,
            custom: metadata.custom,
        });
    }

    const image = sharp(input).withMetadata(sharpMetadata);
    const buffer = await image.toBuffer();
    await fs.writeFile(path, buffer);
}

export async function applyPdfMetadata(
    path: string,
    metadata: PDFMetadata
): Promise<void> {
    const input = await fs.readFile(path);
    const doc = await PDFDocument.load(input);

    if (metadata.title) doc.setTitle(metadata.title);
    if (metadata.author) doc.setAuthor(metadata.author);
    if (metadata.subject) doc.setSubject(metadata.subject);
    if (metadata.keywords) doc.setKeywords(metadata.keywords);
    if (metadata.creator) doc.setCreator(metadata.creator);
    if (metadata.producer) doc.setProducer(metadata.producer);
    if (metadata.creationDate) doc.setCreationDate(metadata.creationDate);
    if (metadata.modDate) doc.setModificationDate(metadata.modDate);

    const customEntries: string[] = [];
    if (metadata.language) {
        customEntries.push(`Language=${metadata.language}`);
    }
    if (metadata.custom) {
        for (const [key, value] of Object.entries(metadata.custom)) {
            customEntries.push(`${key}=${String(value)}`);
        }
    }

    if (customEntries.length > 0) {
        const currentKeywords = metadata.keywords ?? [];
        doc.setKeywords([...currentKeywords, ...customEntries]);
    }

    const updated = await doc.save();
    await fs.writeFile(path, updated);
}

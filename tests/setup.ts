import path from 'path';
import fs, { mkdirSync } from 'fs';
import puppeteer from 'puppeteer-core';

jest.setTimeout(10000);

export const dist = path.resolve(__dirname, '../dist');

/**
  * - temp/
  *   - A/
  *     - B/
  *     - b.md
  *   - a.md
  *   - a.txt
  * */
export const rootDir = path.resolve(__dirname, 'temp');
export const dirA = path.join(rootDir, 'A');
export const dirAB = path.join(dirA, 'B');
export const mdA = path.join(rootDir, 'A.md');
export const txtA = path.join(rootDir, 'A.txt');
export const mdb = path.join(dirA, 'b.md');

let browser: puppeteer.Browser;

beforeAll(async () => {
  if (fs.existsSync(rootDir)) {
    fs.rmSync(rootDir, { force: true, recursive: true });
  }
  mkdirSync(rootDir);
  mkdirSync(dirA);
  mkdirSync(dirAB);
  fs.writeFileSync(mdA, '# A');
  fs.writeFileSync(txtA, '# A');
  fs.writeFileSync(mdb, '# b');

  browser = await puppeteer.launch({ executablePath: 'google-chrome' });
});

afterAll(async () => {
  fs.rmSync(rootDir, { force: true, recursive: true });
  await browser.close();
});

export const getPage = async (url: string) => {
  const page = await browser.newPage();

  await page.goto(url);

  return page;
};

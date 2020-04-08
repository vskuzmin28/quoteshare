import * as puppeteer from "puppeteer";
import { NewQuote } from "../../model/quote.model";

export const checkQuoteExists = async (quoteRequest: NewQuote) => {
  const { url, selector, quote } = quoteRequest;

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-fullscreen", "--window-size=1920,1080"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });

  await page.goto(url, { waitUntil: "networkidle0" });

  const targetElement = await page.$(selector);
  const textContentOfTargetElement = await targetElement?.evaluate(
    (targetElement) => targetElement.textContent,
    targetElement
  );

  await browser.close();

  return (
    typeof textContentOfTargetElement === "string" &&
    textContentOfTargetElement.includes(quote)
  );
};

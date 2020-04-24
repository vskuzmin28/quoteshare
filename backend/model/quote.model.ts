import { strict, string, TypeOf } from "io-ts";

export const newQuoteIO = strict({
  selector: string,
  quote: string,
  url: string,
});

export type NewQuote = TypeOf<typeof newQuoteIO>;

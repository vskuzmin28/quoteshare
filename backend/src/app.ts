import * as express from "express";
import * as H from "hyper-ts";
import { toRequestHandler, fromRequestHandler } from "hyper-ts/lib/express";
import { pipe } from "fp-ts/lib/pipeable";
import { either } from "fp-ts";
import { constUndefined, constant, flow } from "fp-ts/lib/function";
import { failure } from "io-ts/lib/PathReporter";
import { newQuoteIO } from "../model/quote.model";
import { checkQuoteExists } from "./controllers/quote.controller";

const json = express.json();

const jsonMiddleware = fromRequestHandler(json, constUndefined);

const newQuoteBodyDecoder = pipe(
  jsonMiddleware,
  H.ichain(() =>
    H.decodeBody((u) =>
      pipe(
        newQuoteIO.decode(u),
        either.mapLeft(
          (errors) => `invalid body: ${failure(errors).join("\n")}`
        )
      )
    )
  )
);

const processNewQuoteRequest = pipe(
  newQuoteBodyDecoder,
  H.ichain((quoteRequest) =>
    pipe(
      H.tryCatch(
        () => checkQuoteExists(quoteRequest),
        constant("Error in delay")
      ),
      H.ichain((v) =>
        pipe(
          H.status(v ? H.Status.OK : H.Status.BadRequest),
          H.ichain(() => H.json({ isAuthenticQuote: v }, () => "error"))
        )
      )
    )
  )
);

const hello: H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> = pipe(
  H.status(H.Status.OK), // writes the response status
  H.ichain(() => H.closeHeaders()), // tells hyper-ts that we're done with the headers
  H.ichain(() => H.send("Hello hyper-ts on express!")) // sends the response as text
);

export const app = express();

app.set("port", 3333);

app.get("/", toRequestHandler(hello));
app.post("/newquote", toRequestHandler(processNewQuoteRequest));

app.listen(() => console.log("Express listening on port 3333. Use: GET /"));

/* 

test payload
{"selector": "#story > section > div:nth-child(8) > div > p:nth-child(1)", "quote": "On Tuesday, Mr. Cuomo announced that 731 more people had died of the virus, the state’s highest one-day total yet. The overall death toll in New York is 5,489 people.", "url": "https://www.nytimes.com/2020/04/08/nyregion/new-york-coronavirus-response-delays.html?action=click&module=Top%20Stories&pgtype=Homepage"}

*/

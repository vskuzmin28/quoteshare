import * as express from "express";
import * as H from "hyper-ts";
import { toRequestHandler, fromRequestHandler } from "hyper-ts/lib/express";
import { pipe } from "fp-ts/lib/pipeable";
import { either } from "fp-ts";
import { constUndefined, constant, flow } from "fp-ts/lib/function";
import { strict, string } from "io-ts";
import { failure } from "io-ts/lib/PathReporter";

const json = express.json();

const jsonMiddleware = fromRequestHandler(json, constUndefined);

const NewQuote = strict({
  selector: string,
  quote: string,
  url: string,
});

const newQuoteBodyDecoder = pipe(
  jsonMiddleware,
  H.ichain(() =>
    H.decodeBody((u) =>
      pipe(
        NewQuote.decode(u),
        either.mapLeft(
          (errors) => `invalid body: ${failure(errors).join("\n")}`
        )
      )
    )
  )
);

// test
const delay: (ms: number) => () => Promise<void> = (ms: number) => () =>
  new Promise((resolve) => setTimeout(resolve, ms, undefined));

const processNewQuoteRequest = pipe(
  newQuoteBodyDecoder,
  H.ichain(({ selector, quote, url }) =>
    pipe(
      H.tryCatch(delay(5000), constant("Error in delay")),
      H.ichain(() => H.status(H.Status.OK)),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() =>
        pipe(
          either.stringifyJSON(
            JSON.stringify({ selector, quote, url }),
            either.toError
          ),
          flow(either.fold(() => H.send("Error"), H.send))
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

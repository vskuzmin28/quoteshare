import * as express from "express";
import * as H from "hyper-ts";
import { toRequestHandler } from "hyper-ts/lib/express";
import { pipe } from "fp-ts/lib/pipeable";

const hello: H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> = pipe(
  H.status(H.Status.OK), // writes the response status
  H.ichain(() => H.closeHeaders()), // tells hyper-ts that we're done with the headers
  H.ichain(() => H.send("Hello hyper-ts on express!")) // sends the response as text
);

export const app = express();

app
  .set("port", 3333)
  .get("/", toRequestHandler(hello))
  .listen(() => console.log("Express listening on port 3333. Use: GET /"));

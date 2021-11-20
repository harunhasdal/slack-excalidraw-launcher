import { listenAndServe } from "https://deno.land/std@0.111.0/http/server.ts";
import { HookParameters } from "./types.ts";
import { boardCommandHandler } from "./commandHandler.ts";
import { crypto } from "https://deno.land/std@0.111.0/crypto/mod.ts";

const SLACK_SIGNING_SECRET = Deno.env.get("SLACK_SIGNING_SECRET");
const verifySignature = Deno.env.get("VERIFY_SIGNATURE") || false;

async function slackSlashCommandHandler(request: Request) {
  console.log(`Serving request from`, request.headers.get("user-agent"));
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }
  const requestSignature = request.headers.get("x-slack-signature") as string;
  if (!requestSignature) {
    return new Response(null, {
      status: 403,
      statusText: "Invalid request signature",
    });
  }
  if (verifySignature) {
    const textEncoder = new TextEncoder();
    const verified = await crypto.subtle.verify?.(
      { name: "HMAC" },
      SLACK_SIGNING_SECRET,
      textEncoder.encode(requestSignature),
      textEncoder.encode(JSON.stringify(request.body))
    );
    if (!verified) {
      console.log("Signature verification failed");
      return new Response(null, {
        status: 403,
        statusText: "Invalid signature",
      });
    }
  }

  const contentType = request.headers.get("content-type");
  if (
    !(
      contentType?.includes("application/x-www-form-urlencoded") ||
      contentType?.includes("multipart/form-data")
    )
  ) {
    return new Response(null, {
      status: 400,
      statusText: "Content-Type not supported",
    });
  }
  // Handle request.
  const formData = await request.formData();
  const params = Object.fromEntries(formData) as unknown as HookParameters;

  return boardCommandHandler(params);
}

console.log("Listening on http://localhost:8000");
await listenAndServe(":8000", slackSlashCommandHandler);

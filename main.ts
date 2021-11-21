import { listenAndServe } from "https://deno.land/std@0.111.0/http/server.ts";
import { HookParameters } from "./types.ts";
import { boardCommandHandler } from "./commandHandler.ts";
import { crypto } from "https://deno.land/std@0.111.0/crypto/mod.ts";

// Read environment variables from Deno runtime
const SLACK_SIGNING_SECRET = Deno.env.get("SLACK_SIGNING_SECRET");
const verifySignature = Deno.env.get("VERIFY_SIGNATURE") || false;

/**
 * `slackSlashCommandHandler` Handles incoming http requests and returns the HTTP response.
 *
 * Based on slack slash command guidelines it validates the requests and verifies the signature
 * before invoking the particular command handler
 */
async function slackSlashCommandHandler(request: Request): Promise<Response> {
  console.log(`Serving request from`, request.headers.get("user-agent"));

  // Only POST requests are allowed
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  // Verify request
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

  // Verify content type
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

  // Handle request by passing the request parameters to the handler function
  const formData = await request.formData();
  const params = Object.fromEntries(formData) as unknown as HookParameters;

  return boardCommandHandler(params);
}

console.log("Listening on http://localhost:8000");
await listenAndServe(":8000", slackSlashCommandHandler);

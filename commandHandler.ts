// deno-lint-ignore-file no-unused-vars
import { HookParameters } from "./types.ts";

const SLACK_BOT_TOKEN = Deno.env.get("SLACK_BOT_TOKEN");

export const boardCommandHandler = (params: HookParameters) => {
  const baseUrl = "https://excalidraw.com/";
  const roomId = globalThis.crypto.randomUUID();
  const roomUrl = `${baseUrl}#room=${roomId
    .replaceAll("-", "")
    .substring(0, 20)},${roomId.substring(0, 22)}`;

  const responseBlocks = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${roomUrl}|Launch whiteboard> to collaborate on ${params.text}`,
        },
      },
    ],
  };

  return new Response(JSON.stringify(responseBlocks), {
    headers: {
      "content-type": "application/json",
    },
  });
};

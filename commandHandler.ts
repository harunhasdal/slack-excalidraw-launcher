import { HookParameters } from "./types.ts";

/**
 * `boardCommandHandler` handles the `/board` command.
 *
 * It builds a live session URL on the fly and immediately responds to the slack channel with the link
 */
export const boardCommandHandler = (params: HookParameters): Response => {
  // Build a live whiteboarding session URL as documented in
  // https://github.com/excalidraw/excalidraw/blob/master/README.md#create-a-collaboration-session-manually
  const baseUrl = "https://excalidraw.com/";
  const roomId = globalThis.crypto.randomUUID();
  const roomUrl = `${baseUrl}#room=${roomId
    .replaceAll("-", "")
    .substring(0, 20)},${roomId.substring(0, 22)}`;

  // Build a response for the message using slack block-kit API
  // Reference: https://api.slack.com/block-kit
  const responseBlocks = {
    // deno-lint-ignore camelcase
    response_type: "in_channel",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hello, ${params.user_name} invites you to a <${roomUrl}|live whiteboarding session> to collaborate.`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Click "Launch" to jump into the whiteboard: ${params.text}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Launch",
            emoji: true,
          },
          value: "click_me_123",
          url: roomUrl,
          action_id: "button-action",
        },
      },
      {
        type: "image",
        image_url:
          "https://github.com/excalidraw/excalidraw/raw/master/public/og-image-sm.png",
        alt_text: "excalidraw",
      },
    ],
  };

  return new Response(JSON.stringify(responseBlocks), {
    headers: {
      "content-type": "application/json",
    },
  });
};

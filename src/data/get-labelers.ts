import "@atcute/bluesky/lexicons";

import { simpleFetchHandler, XRPC } from "@atcute/client";
import type { AppBskyLabelerDefs, At } from "@atcute/client/lexicons";
import { RichText, AtpAgent } from "@atproto/api";

const agent = new AtpAgent({ service: "https://example.com" });

const chunked = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0, il = arr.length; i < il; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
};

export type Labeler = Omit<
  AppBskyLabelerDefs.LabelerViewDetailed,
  "creator"
> & {
  creator: Omit<
    AppBskyLabelerDefs.LabelerViewDetailed["creator"],
    "description"
  > & {
    description: Array<
      | { type: "text"; text: string }
      | { type: "link"; uri: string; text: string }
      | { type: "mention"; did: string; text: string }
    >;
  };
};

export async function getLabelers() {
  const resp = await fetch(
    "https://blue.mackuba.eu/xrpc/blue.feeds.mod.getLabellers"
  );
  const json = await resp.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dids: At.DID[] = json.labellers.map((labeler: any) => labeler.did);
  const rpc = new XRPC({
    handler: simpleFetchHandler({ service: "https://public.api.bsky.app" }),
  });

  const labelers = (
    await Promise.all(
      chunked(dids, 10).map(async (chunk) => {
        const { data } = await rpc.get("app.bsky.labeler.getServices", {
          params: {
            dids: chunk,
            detailed: true,
          },
        });

        return data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
      })
    )
  ).flat();

  const labelersWithFacets = await Promise.all(
    labelers.map(async (labeler) => {
      const rt = new RichText({
        text: labeler.creator.description || "",
      });

      await rt.detectFacets(agent);

      const description = [];

      for (const segment of rt.segments()) {
        if (segment.isLink()) {
          description.push({
            type: "link",
            uri: segment.link?.uri,
            text: segment.text,
          });
        } else if (segment.isMention()) {
          description.push({
            type: "mention",
            did: segment.mention?.did,
            text: segment.text,
          });
        } else {
          description.push({ type: "text", text: segment.text });
        }
      }

      return {
        ...labeler,
        creator: {
          ...labeler.creator,
          description,
        },
      };
    })
  );

  return labelersWithFacets.sort(
    (a, b) => (b.likeCount || 0) - (a.likeCount || 0)
  );
}

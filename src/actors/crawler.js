import R from "ramda";
import url from "url";
import { dispatch } from "nact";

import dnsActor from "./dns";
import archiveCrawler from "./archiveCrawler";

import { defineActor } from "../actorsUtil";

import {
	foundArchiveForCrawling,
	foundLink,
	requestDNS,
	resolveDNS,
} from "../messages";

export default defineActor(
	function crawlerNameBuilder() {
		return "root-crawler";
	},
	{},
	{
		...foundLink.respond(async (state, { source, sink }, ctx) => {
			const { protocol, hostname, pathname } = url.parse(sink);

			if (protocol.includes("dat")) {
				const sinkHash = R.path(["mapHostnameToHash", hostname], state);

				if (sinkHash) {
				} else {
					dispatch(
						dnsActor.summon(ctx),
						requestDNS.create({ hostname }),
						ctx.self,
					);
				}
			}
		}),

		...resolveDNS.respond(async (state, { hostname, hash }, ctx) => {
			dispatch(ctx.self, foundArchiveForCrawling.create({ hash }));
			return R.assocPath(["mapHostnameToHash", hostname], hash);
		}),

		...foundArchiveForCrawling.respond(async (state, { hash }, ctx) => {
			const hasAlreadyMountedArchive = archiveCrawler.exists(ctx, hash);

			if (!hasAlreadyMountedArchive) {
				dispatch(
					archiveCrawler.summon(ctx, hash),
					foundArchiveForCrawling.create({ hash }),
					ctx.self,
				);
			}
		}),
	},
);

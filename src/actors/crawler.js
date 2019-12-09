import R from "ramda";
import url from "url";
import { dispatch } from "nact";

import dnsActor from "./dns";
import archiveCrawler from "./archiveCrawler";
import pageRanks from "./pageRanks";

import { defineActor } from "../actorsUtil";

import {
	foundArchiveForCrawling,
	foundLinks,
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
		...foundLinks.respond(async (state, { source, sinks }, ctx) => {
			for (const sink of sinks) {
				dispatch(
					ctx.self,
					foundLink.create({ source, sink }),
					ctx.self,
				);
			}

			dispatch(
				pageRanks.summon(ctx),
				foundLinks.create({
					source,
					sinks,
				}),
				ctx.self,
			);
		}),
		...foundLink.respond(async (state, { source, sink }, ctx) => {
			process.stdout.write(".");
			const { protocol, hostname, pathname } = url.parse(sink);

			if (protocol.includes("dat")) {
				const sinkHash = R.path(["mapHostnameToHash", hostname], state);

				if (!sinkHash) {
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

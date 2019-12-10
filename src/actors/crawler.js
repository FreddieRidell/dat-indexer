import R from "ramda";
import url from "url";
import { dispatch, query } from "nact";

import dnsActor from "./dns";
import archiveCrawler from "./archiveCrawler";
import pageRanks from "./pageRanks";

import { defineActor } from "../actorsUtil";

import {
	foundArchiveForCrawling,
	foundArchivePageForCrawling,
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
		...foundLinks.respond(async (state, { sourceUrl, sinkUrls }, ctx) => {
			for (const sinkUrl of sinkUrls) {
				dispatch(
					ctx.self,
					foundLink.create({
						sourceUrl,
						sinkUrl,
					}),
				);
			}
		}),
		...foundLink.respond(async (state, { sinkUrl, sourceUrl }, ctx) => {
			console.log(sourceUrl, "=>", sinkUrl);

			const { hostname: sinkHostname, path: sinkPath } = url.parse(
				sinkUrl,
			);

			const sinkDnsLookup = await query(
				dnsActor.summon(ctx),
				requestDNS.create({
					hostname: sinkHostname,
				}),
				10000,
			);

			if (sinkDnsLookup.success) {
				// the link points to a dat archive
				const { hash: sinkHash } = sinkDnsLookup;

				dispatch(
					archiveCrawler.summon(ctx, sinkHash),
					foundArchivePageForCrawling.create({
						hash: sinkHash,
						path: sinkPath,
					}),
					ctx.self,
				);
			}
		}),
	},
);

import R from "ramda";
import url from "url";
import { dispatch, query } from "nact";

import dnsActor from "./dns";
import archiveCrawler from "./archiveCrawler";
import pageRanks from "./pageRanks";

import { defineActor } from "../actorsUtil";

import {
	foundArchivePageForCrawling,
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
		...foundLink.respond(async (state, { sink, source }, ctx) => {
			dispatch(
				dnsActor.summon(ctx),
				requestDNS.create({
					host: sink.host,
					responseMsg: foundArchivePageForCrawling.create({
						host: null,
						hash: null,
						path: sink.path,
					}),
				}),
				ctx.self,
			);
		}),

		...foundArchivePageForCrawling.respond(
			async (state, { host, hash, path }, ctx) => {
				console.log(
					"foundArchivePageForCrawling",
					`${hash}${path} \t (${host})`,
				);

				dispatch(
					archiveCrawler.summon(ctx, hash),
					foundArchivePageForCrawling.create({
						host,
						hash,
						path,
					}),
					ctx.self,
				);
			},
		),
	},
);

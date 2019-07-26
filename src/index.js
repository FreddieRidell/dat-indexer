import * as R from "ramda";
import SDK from "dat-sdk";
import cheerio from "cheerio";
import url from "url";
import { promisify } from "util";

import {
	itterateThroughArchives,
	printDebug,
	addArchiveByDNS,
} from "./archivesCollection";

import { crawlArchive } from "./archiveCrawler";

async function main() {
	await addArchiveByDNS(0, "dat://explore.beakerbrowser.com");

	for await (const { archive, meta } of itterateThroughArchives()) {
		await crawlArchive(archive, meta);
	}
}

main();

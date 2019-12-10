import R from "ramda";
import cheerio from "cheerio";
import path from "path";
import keb from "@freddieridell/kebab-case";
import url from "url";
import { dispatch } from "nact";
import { DatArchive } from "dat-sdk/auto";

import { defineActor } from "../actorsUtil";
import { sanitiseUrl } from "../util";

import { foundArchivePageForCrawling, foundLinks } from "../messages";

const PARTIAL_URL_REGEXP = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

function safeJSONParse(s) {
	try {
		return JSON.parse(s);
	} catch (e) {
		return false;
	}
}

export default defineActor(
	function archiveCrawlerNameBuilder(hash) {
		return `archive-crawler-${keb(hash)}`;
	},
	{},
	{
		...foundArchivePageForCrawling.respond(async (state, msg, ctx) => {
			if (state.hash && state.hash !== msg.hash) {
				// you've sent this link to the wrong actor, but I don't care
				return;
			}

			// get the archive
			const archive = await (state.archive
				? Promise.resolve(state.archive)
				: DatArchive.load(msg.hash, {
						persist: true,
				  }));

			// try multiple possible filepaths for the given url path
			const waysToGetFilePathFromUrlPath = [
				urlPath => path.join(urlPath, "index.html"),
				urlPath =>
					path.format({
						...path.parse(urlPath),
						ext: ".html",
					}),
			];

			// get the raw string for the page at the given path
			let pageFileString = false;
			for (const fn of waysToGetFilePathFromUrlPath) {
				try {
					pageFileString = await archive.readFile(
						fn(msg.path || "/"),
						"utf8",
					);

					break;
				} catch (e) {
					//console.error(e);
					continue;
				}
			}

			// scan for links:
			const $ = cheerio.load(pageFileString);

			const sinksSet = new Set();
			$("a").each(function(i, el) {
				//href is an outgoing link from this page
				const href = $(this).attr("href");
				if (!href) {
					return true;
				}

				const sink = sanitiseUrl({
					defaultProtcol: "dat:",
					defaultHostname: msg.hash,
				})(href);

				if (url.parse(sink).protocol === "dat:") {
					sinksSet.add(sink);
				}
			});

			// report all links I've discovered out from this page
			dispatch(
				ctx.sender,
				foundLinks.create({
					sourceUrl: url.format({
						protocol: "dat:",
						slashes: true,
						hostname: msg.hash,
						path: msg.path,
					}),
					sinkUrls: [...sinksSet],
				}),
			);

			return R.pipe(R.assoc("archive", archive));
		}),
	},
);

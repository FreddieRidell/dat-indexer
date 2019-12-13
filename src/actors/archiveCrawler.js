import R from "ramda";
import PATH from "path";
import URL from "url";

import cheerio from "cheerio";
import keb from "@freddieridell/kebab-case";
import { dispatch } from "nact";
import { DatArchive } from "dat-sdk/auto";

import { defineActor } from "../actorsUtil";
import { sanitiseUrl } from "../util";

import { foundArchivePageForCrawling, foundLink } from "../messages";

const PARTIAL_URL_REGEXP = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

function safeJSONParse(s) {
	try {
		return JSON.parse(s);
	} catch (e) {
		return false;
	}
}

function* generatePossibleFilePaths(path) {
	const waysToGetFilePathFromUrlPath = [
		R.identity,
		urlPath => PATH.join(urlPath, "index.html"),
		urlPath =>
			PATH.format({
				...PATH.parse(urlPath),
				ext: ".html",
			}),
	];

	for (const fn of waysToGetFilePathFromUrlPath) {
		yield fn(path || "/");
	}
}

async function generateOutgoingLinksFromPath(archive, { host, hash, path }) {
	// get the raw string for the page at the given path
	let pageFileString = false;
	for (const filePath of generatePossibleFilePaths(path)) {
		try {
			pageFileString = await archive.readFile(filePath, "utf8");

			break;
		} catch (e) {
			continue;
		}
	}

	// scan for links:
	const $ = cheerio.load(pageFileString);

	const outgoingLinksCollection = new Map();
	$("a").each(function(i, el) {
		//href is an outgoing link from this page
		const href = $(this).attr("href");

		if (!href) {
			return true;
		}

		//is this a link that we care about indexing?
		const parsedHref = URL.parse(href);

		if (parsedHref.protocol === "dat:") {
			const linkCacheKey = parsedHref.hostname + parsedHref.pathname;

			if (outgoingLinksCollection.has(linkCacheKey)) {
				return true;
			}

			outgoingLinksCollection.set(linkCacheKey, {
				host: parsedHref.hostname,
				path: parsedHref.pathname || "/",
			});
			return true;
		}

		if (parsedHref.protocol === null && parsedHref.pathname !== null) {
			const linkCacheKey = host + parsedHref.pathname;

			if (outgoingLinksCollection.has(linkCacheKey)) {
				return true;
			}

			outgoingLinksCollection.set(linkCacheKey, {
				host: host,
				path: parsedHref.pathname || "/",
			});

			return true;
		}
	});

	return outgoingLinksCollection.values();
}

export default defineActor(
	function archiveCrawlerNameBuilder(hash) {
		return `archive-crawler-${keb(hash)}`;
	},
	{
		archives: {},
		crawled: {},
	},
	{
		...foundArchivePageForCrawling.respond(
			async (state, { host, hash, path }, ctx) => {
				if (state.hash && state.hash !== hash) {
					// you've sent this link to the wrong actor, but I don't care
					return;
				}

				if (state.crawled[path]) {
					return;
				}

				// get the archive
				const archive = await (state.archive
					? Promise.resolve(state.archive)
					: DatArchive.load(hash, {
							persist: true,
					  }));

				const outgoingLinks = await generateOutgoingLinksFromPath(
					archive,
					{ host, hash, path },
				);

				for (const outgoingLink of outgoingLinks) {
					console.log(
						"foundOutgoingLinkFromPageTo",
						`${hash}${path} \t `,
						`${outgoingLink.host}${outgoingLink.path}`,
					);
					dispatch(
						ctx.parent,
						foundLink.create({
							source: {
								host,
								hash,
								path,
							},
							sink: outgoingLink,
						}),
						ctx.self,
					);
				}

				return R.pipe(
					R.assocPath(["crawled", path], true),
					R.assoc("hash", hash),
					R.assoc("archive", archive),
				);
			},
		),
	},
);

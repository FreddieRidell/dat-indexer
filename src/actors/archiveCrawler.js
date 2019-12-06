import R from "ramda";
import path from "path";
import keb from "@freddieridell/kebab-case";
import url from "url";
import { dispatch } from "nact";
import { DatArchive } from "dat-sdk/auto";

import { defineActor } from "../actorsUtil";

import {
	foundFolderForCrawling,
	foundJSONForCrawling,
	foundLink,
	foundArchiveForCrawling,
	foundTextForCrawling,
} from "../messages";

function safeJSONParse(s) {
	try {
		return JSON.parse(s);
	} catch (e) {
		return false;
	}
}

const PARTIAL_URL_REGEXP = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
function recursivePartialUrlSearch(s) {
	switch (typeof s) {
		case "object":
			return R.pipe(
				R.defaultTo({}),
				R.values,
				R.map(recursivePartialUrlSearch),
				R.flatten,
				R.filter(Boolean),
				R.uniqBy(R.identity),
			)(s);

		case "string":
			return R.uniqBy(
				R.identity,
				PARTIAL_URL_REGEXP.exec(s) || [],
			).filter(Boolean);

		default:
			return [];
	}
}

function filePathToUrlPath(fp) {
	return fp
		.replace(/index\.html$/, "")
		.replace(/\.html$/, "")
		.replace(/\/$/, "");
}

function dispatchFindsFromPartialUrls(
	{ hash, filePath, ctx },
	foundPartialUrls,
) {
	for (const partialUrl of foundPartialUrls) {
		const { protocol, path, hostname } = url.parse(partialUrl);

		if (protocol && !protocol.startsWith("http")) {
			continue;
		}

		if (!path && !hostname) {
			continue;
		}

		const qualifiedUrl = url.format({
			host: hostname || hash,
			hostname: hostname || hash,
			path,
			pathname: path,
			protocol: "dat:",
			slashes: true,
		});

		dispatch(
			ctx.self,
			foundLink.create({
				source: url.format({
					hostname: hash,
					protocol: "dat:",
					pathname: filePathToUrlPath(filePath),
					slashes: true,
				}),
				sink: qualifiedUrl,
			}),
		);
	}
}

export default defineActor(
	function archiveCrawlerNameBuilder(hash) {
		return `archive-crawler-${keb(hash)}`;
	},
	{},
	{
		...foundArchiveForCrawling.respond(async (state, msg, ctx) => {
			if (state.archive) {
				return;
			}

			console.log("foundArchiveForCrawling", msg.hash);

			const archive = await DatArchive.load(msg.hash, {
				persist: true,
			});

			dispatch(
				ctx.self,
				foundFolderForCrawling.create({ folderPath: "/" }),
			);

			return R.pipe(
				R.assoc("archive", archive),
				R.assoc("hash", msg.hash),
			);
		}),

		...foundFolderForCrawling.respond(
			async ({ archive }, { folderPath }, ctx) => {
				const fileNames = await archive.readdir(folderPath);

				for (const fileName of fileNames) {
					const fullPath = path.join(folderPath, fileName);
					const fileStat = await archive.stat(fullPath);
					if (fileStat.isDirectory()) {
						dispatch(
							ctx.self,
							foundFolderForCrawling.create({
								folderPath: fullPath,
							}),
						);
					} else if (fileName.endsWith(".json")) {
						dispatch(
							ctx.self,
							foundJSONForCrawling.create({
								filePath: fullPath,
							}),
						);
					} else if (
						fileName.endsWith(".html") ||
						fileName.endsWith(".txt")
					) {
						dispatch(
							ctx.self,
							foundTextForCrawling.create({
								filePath: fullPath,
							}),
						);
					}
				}
			},
		),

		...foundJSONForCrawling.respond(
			async ({ archive, hash }, { filePath }, ctx) => {
				const contentString = await archive.readFile(filePath, "utf8");

				const obj = safeJSONParse(contentString);

				if (!obj) {
					return;
				}

				const foundPartialUrls = recursivePartialUrlSearch(obj);

				dispatchFindsFromPartialUrls(
					{ hash, filePath, ctx },
					foundPartialUrls,
				);
			},
		),

		...foundTextForCrawling.respond(
			async ({ archive, hash }, { filePath }, ctx) => {
				const contentString = await archive.readFile(filePath, "utf8");

				const foundPartialUrls = recursivePartialUrlSearch(
					contentString,
				);

				dispatchFindsFromPartialUrls(
					{ hash, filePath, ctx },
					foundPartialUrls,
				);
			},
		),

		...foundLink.forwardUp(),
	},
);

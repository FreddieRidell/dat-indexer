import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import createFileCrawler, { createFileCrawlerName } from "./fileCrawler";

function getOrCreateFileCrawler(ctx, archive, domain, file) {
	return ctx.children.has(createFileCrawlerName(domain, file))
		? ctx.children.get(createFileCrawlerName(domain, file))
		: createFileCrawler(ctx.self, archive, domain, file);
}

function getHostName(a) {
	return url.parse(a).hostname;
}
function areSameArchive(a, b) {
	return getHostName(a) === getHostName(b);
}
async function isValidDatName(name) {
	try {
		resolveName(name);
		return true;
	} catch (e) {
		console.log(name, "is not a valid dat name");
		return false;
	}
}

export const createFolderCrawlerName = (domain, folder) =>
	keb(["folderCrawler", domain, folder].join("-"));

export default function createFolderCrawler(parent, archive, domain, folder) {
	return spawnStateless(
		parent,
		(msg, ctx) =>
			((
				{
					foundUrl: async () => {
						const isAValidDatName = isValidDatName(msg.url);

						if (
							isAValidDatName &&
							getHostName(msg.url) &&
							!areSameArchive(msg.url, domain)
						) {
							const { hostname } = url.parse(msg.url);

							dispatch(
								ctx.parent,
								{
									type: "foundNewDomain",
									domain: hostname,
								},
								ctx.self,
							);
						}
					},

					crawlFolder: async () => {
						const filesInFolder = await archive.readdir(folder);

						for (const fileName of filesInFolder.reverse()) {
							const fullFileName = [folder, fileName]
								.join("/")
								.replace(/\/+/, "/");

							const stat = await archive.stat(fullFileName);

							if (stat.isDirectory()) {
								dispatch(
									ctx.parent,
									{
										type: "foundFolder",
										path: fullFileName,
									},
									ctx.self,
								);
							} else if (
								["js", "html", "txt", "json"].includes(
									fileName.split(".").reverse()[0],
								)
							) {
								const fileCrawler = getOrCreateFileCrawler(
									ctx,
									archive,
									domain,
									fullFileName,
								);

								dispatch(
									fileCrawler,
									{
										type: "crawlFile",
									},
									ctx.self,
								);
							}
						}
					},
				}[msg.type] ||
				(() => {
					console.log("invalid msg", ctx.name, msg.type);
				})
			)()),
		createFolderCrawlerName(domain, folder),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

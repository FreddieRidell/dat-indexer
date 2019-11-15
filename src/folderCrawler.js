import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import { snooze } from "./util";

import createFileCrawler, { createFileCrawlerName } from "./fileCrawler";

function getOrCreateFileCrawler(ctx, archive, domain, file) {
	return ctx.children.has(createFileCrawlerName(domain, file))
		? ctx.children.get(createFileCrawlerName(domain, file))
		: createFileCrawler(ctx.self, archive, domain, file);
}

export const createFolderCrawlerName = (domain, folder) =>
	keb(["folderCrawler", domain, folder].join("-"));

export default function createFolderCrawler(parent, archive, domain, folder) {
	return spawnStateless(
		parent,
		(msg, ctx) =>
			((
				{
					foundUrl: () => {
						dispatch(ctx.parent, msg, msg.sender);
					},

					crawlFolder: async () => {
						const filesInFolder = await archive.readdir(folder);

						for (const fileName of filesInFolder.reverse()) {
							const fullFileName = [folder, fileName]
								.join("/")
								.replace(/\/+/, "/");

							const stat = await archive.stat(fullFileName);

							if (stat.isDirectory()) {
								await snooze(2);

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

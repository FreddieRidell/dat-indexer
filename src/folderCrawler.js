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

export const createFolderCrawlerName = (domain, folder) =>
	keb(["folderCrawler", domain, folder].join("-"));

export default function createFolderCrawler(parent, archive, domain, folder) {
	return spawn(
		parent,
		async function(state = {}, msg, ctx) {
			//console.log(ctx.name, JSON.stringify(folder), msg.type);

			switch (msg.type) {
				case "crawlFolder": {
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

							break;
						} else {
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

					return {
						...state,
					};
				}

				default:
					console.log("invalid msg", ctx.name, msg.type);
					return state;
			}
		},
		createFolderCrawlerName(domain, folder),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

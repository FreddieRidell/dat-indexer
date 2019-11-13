import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import createFolderCrawler, { createFolderCrawlerName } from "./folderCrawler";

function getOrCreateFolderCrawler(ctx, archive, domain, folder) {
	return ctx.children.has(createFolderCrawlerName(domain, folder))
		? ctx.children.get(createFolderCrawlerName(domain, folder))
		: createFolderCrawler(ctx.self, archive, domain, folder);
}

export const createDomainCrawlerName = domain => keb(`domainCrawler-${domain}`);

export default function createDomainCrawler(parent, domain) {
	return spawn(
		parent,
		async function(state = {}, msg, ctx) {
			//console.log(ctx.name, msg.type);

			switch (msg.type) {
				case "mountDomain": {
					const archive = await (state.archive
						? Promise.resolve(state.archive)
						: DatArchive.load(domain, { persist: true }));

					const rootFolderCrawler = getOrCreateFolderCrawler(
						ctx,
						archive,
						domain,
						"/",
					);

					dispatch(
						rootFolderCrawler,
						{
							type: "crawlFolder",
						},
						ctx.self,
					);

					return {
						...state,
						archive,
						hopsRemaining: Math.max(
							state.hopsRemaining,
							msg.hopsRemaining,
						),
					};
				}

				case "foundFolder": {
					const { archive } = state;

					const folderCrawler = getOrCreateFolderCrawler(
						ctx,
						archive,
						domain,
						msg.path,
					);

					dispatch(
						folderCrawler,
						{
							type: "crawlFolder",
							archive,
						},
						ctx.self,
					);

					return state;
				}
				default:
					console.log("invalid msg", ctx.name, msg.type);
					return state;
			}
			//switch (msg.type) {
			//case "crawl": {
			//console.log("trying to load dat archive @", msg.domain);
			//try {
			//const archive = await DatArchive.load(msg.domain);
			//const someData = await archive.readdir("/").then(xs =>
			//Promise.all(
			//xs.map(x =>
			//archive.stat(x).then(stat => ({
			//isDirectory: stat.isDirectory(),
			//fileName: x,
			//})),
			//),
			//),
			//);
			//console.log(someData);
			//} catch (e) {
			//console.error(e);
			//}
			//}
			//}
		},
		createDomainCrawlerName(domain),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

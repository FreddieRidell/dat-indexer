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
		(state = { hopsRemaining: 0 }, msg, ctx) =>
			((
				{
					foundNewDomain: () => {
						dispatch(
							ctx.parent,
							{
								...msg,
								hopsRemaining: state.hopsRemaining - 1,
							},
							ctx.sender,
						);

						return state;
					},
					mountDomain: async () => {
						console.log(
							"mountDomain",
							Math.max(state.hopsRemaining, msg.hopsRemaining),
							domain,
						);

						await new Promise(done =>
							setTimeout(done, Math.random() * 1000),
						);

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
					},

					foundFolder: async () => {
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
					},
				}[msg.type] ||
				(() => {
					console.log("invalid msg", ctx.name, msg.type);
				})
			)()),
		createDomainCrawlerName(domain),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

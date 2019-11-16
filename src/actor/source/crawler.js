import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { query, dispatch } from "nact";

import { createChildSummoner, createActorDefinition } from "../util";

const fileTypeWhitelist = new Set([".xml", ".html", ".json"]);
const protocolWhitelist = new Set(["https:", "http:", "dat:"]);
const datUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;

export function crawlerNameBuilder(hash) {
	return keb(`crawler-${hash}`);
}

const initialState = {};

const logic = {
	crawlDir: async (state, msg, ctx) => {
		const { entries } = await query(
			ctx.parent,
			{ ...msg, type: "requestDirContents" },
			10000,
		);

		for (const { fullPath, isDir } of entries) {
			if (isDir) {
				dispatch(ctx.self, { type: "crawlDir", path: fullPath });
			} else {
				if (fileTypeWhitelist.has(path.parse(fullPath).ext)) {
					dispatch(ctx.parent, { type: "crawlFile", path: fullPath });
				}
			}
		}

		console.log("succeedded crawling dir", msg.path);
	},

	crawlFile: async (state, msg, ctx) => {
		const { contents } = await query(
			ctx.parent,
			{
				...msg,
				type: "requestFileContents",
			},
			10000,
		);

		const linksTo = (contents.match(datUrlRegex) || []).filter(link =>
			protocolWhitelist.has(url.parse(link).protocol),
		);

		for (const linkTo of linksTo) {
			const { hostname, pathname } = url.parse(linkTo);
			dispatch(ctx.parent, {
				type: "foundLink",
				from: {
					pathname: msg.path,
				},
				to: {
					hostname,
					pathname,
				},
			});
		}
	},
};

const crashLogic = {
	crawlDir: async (msg, err, ctx) => {
		console.log("timeout trying to crawl dir", msg.path);
		await new Promise(done => setTimeout(done, Math.random() * 10000));
		return ctx.resume;
	},

	crawlFile: async (msg, err, ctx) => {
		console.log("timeout trying to crawl file", msg.path);
		await new Promise(done => setTimeout(done, Math.random() * 10000));
		return ctx.resume;
	},
};

export const createCrawlerActor = createActorDefinition(
	crawlerNameBuilder,
	initialState,
	logic,
	crashLogic,
);

export default createChildSummoner(crawlerNameBuilder, createCrawlerActor);

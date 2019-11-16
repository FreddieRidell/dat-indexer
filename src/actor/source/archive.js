import path from "path";
import url from "url";
import * as R from "ramda";

import { DatArchive } from "dat-sdk/auto";
import keb from "@freddieridell/kebab-case";
import { query, dispatch } from "nact";

import { createChildSummoner, createActorDefinition } from "../util";

import summonCrawlerActorChild from "./crawler";

export function archiveNameBuilder(hash) {
	return keb(`archive-${hash}`);
}

const initialState = {};

const logic = {
	beginCrawling: async (state, msg, ctx) => {
		if (state.archive) {
			dispatch(ctx.sender, { type: "alreadyMountedArchive" });
			return state;
		}

		const archive = await DatArchive.load(state.hash, {
			persist: true,
		});

		dispatch(ctx.sender, { type: "mountedArchive" });

		const crawlerActor = summonCrawlerActorChild(ctx, state.hash);

		dispatch(crawlerActor, {
			type: "crawlDir",
			path: "/",
		});

		return {
			...state,
			archive,
		};
	},

	crawlFile: async (state, msg, ctx) => {
		const urlPath = msg.path
			.replace(/\/index.html$/, "")
			.replace(/.html/, "");

		const crawlerActor = summonCrawlerActorChild(ctx, state.hash);

		dispatch(crawlerActor, {
			type: "crawlFile",
			path: msg.path,
			urlPath,
		});
	},

	foundLink: async (state, msg, ctx) => {
		const { hash: toHash } = await query(
			state.dnsActor,
			{
				type: "hostnameToHash",
				hostname: msg.to.hostname,
			},
			10000,
		);

		if (toHash) {
			dispatch(
				ctx.parent,
				R.pipe(
					R.assocPath(["from", "hash"], state.hash),
					R.assocPath(["to", "hash"], toHash),
					R.dissocPath(["from", "hostname"]),
					R.dissocPath(["to", "hostname"]),
				)(msg),
			);
		}
	},

	requestDirContents: async (state, msg, ctx) => {
		const fileNames = await state.archive.readdir(msg.path);

		const entries = await Promise.all(
			fileNames.map(async fileName => {
				const fullPath = path.join(msg.path, fileName);

				const statted = await state.archive.stat(fullPath);

				return {
					fileName,
					fullPath,
					isDir: statted.isDirectory(),
				};
			}),
		);

		dispatch(ctx.sender, { type: "respondDirContents", entries });

		return state;
	},

	requestFileContents: async (state, msg, ctx) => {
		const contents = await state.archive.readFile(msg.path, "utf8");

		dispatch(ctx.sender, {
			...msg,
			type: "respondFileContents",
			contents,
		});
	},
};

const crashLogic = {
	foundLink: async (msg, err, ctx) => {
		console.log("timeout finding link", msg.to.hostname);
		await new Promise(done => setTimeout(done, Math.random() * 10000));
		return ctx.resume;
	},
};

export const createArchiveActor = createActorDefinition(
	archiveNameBuilder,
	initialState,
	logic,
	crashLogic,
);

export default createChildSummoner(archiveNameBuilder, createArchiveActor);

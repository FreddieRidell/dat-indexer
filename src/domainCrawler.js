import keb from "@freddieridell/kebab-case";
import url from "url";
import { query, spawn, start, dispatch, stop, spawnStateless } from "nact";

import {
	resolveDatName,
	createActorDefinition,
	createChildSummoner,
	datUrlRegex,
} from "./util";

export function domainCrawlerNameBuilder(archiveHash, dnsName) {
	return keb(["domain", archiveHash].join("-"));
}

const initialState = { hopsRemaining: 0 };

const logic = {
	provideArchiveActor: async (state, msg, ctx) => {
		return {
			...state,
			archiveActor: msg.archiveActor,
		};
	},

	beginCrawlingFromRoot: async (state, msg, ctx, archiveHash, dnsName) => {
		dispatch(ctx.self, { type: "crawlDir", dirPath: "/" });

		return {
			...state,
			hopsRemaining: Math.max(
				state.hopsRemaining || 0,
				msg.hopsRemaining || 0,
			),
		};
	},

	crawlDir: async (state, msg, ctx, archiveHash, dnsName) => {
		const { dirPath } = msg;

		try {
			const dirContentsResponse = await query(
				state.archiveActor,
				{ type: "requestContentsOfDir", dirPath, archiveHash },
				10000,
			);

			for (const {
				fileName,
				fullPath,
				isDir,
			} of dirContentsResponse.entries) {
				if (isDir) {
					dispatch(ctx.self, { type: "crawlDir", dirPath: fullPath });
				} else {
					dispatch(ctx.self, {
						type: "crawlFile",
						filePath: fullPath,
					});
				}
			}
		} catch (e) {}
	},

	crawlFile: async (state, msg, ctx, archiveHash, dns) => {
		const { filePath } = msg;

		const linksFoundResponse = await query(
			state.archiveActor,
			{ type: "requestLinksFoundInFile", filePath, archiveHash },
			10000,
		);

		for (const foundLink of linksFoundResponse.foundUrls) {
			const sanitisedLink = url.format({
				...url.parse(foundLink),
				pathname: "",
			});
			const parsedHash = await resolveDatName(sanitisedLink);
			if (parsedHash && state.hopsRemaining > 0) {
				dispatch(ctx.parent, {
					type: "discoveredDatDomain",
					archiveKey: parsedHash,
					domain: sanitisedLink,
					hopsRemaining: state.hopsRemaining - 1,
				});
			}
		}
	},
};

export const createDomainCrawlerActor = createActorDefinition(
	domainCrawlerNameBuilder,
	initialState,
	logic,
);

export default createChildSummoner(
	domainCrawlerNameBuilder,
	createDomainCrawlerActor,
);

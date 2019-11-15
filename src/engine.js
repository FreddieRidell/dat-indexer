import { query, spawn, start, dispatch, stop, spawnStateless } from "nact";

import { resolveDatName, createActorDefinition } from "./util";

import summonChildArchiveActor from "./archiveActor";
import summonChildDomainCrawlerActor from "./domainCrawler";

export function engineNameBuilder() {
	return "engine";
}

const initialState = { domains: {} };

const logic = {
	mountDomain: async (state, msg, ctx) => {
		const { domain, hopsRemaining } = msg;

		const archiveKey = await resolveDatName(domain);

		console.log("mountDomain", archiveKey, domain);

		const archiveActor = summonChildArchiveActor(ctx, archiveKey, domain);
		const domainCrawlerActor = summonChildDomainCrawlerActor(
			ctx,
			archiveKey,
			domain,
		);

		await query(archiveActor, { type: "mount" }, 60000);

		console.log("mounted dat", archiveKey, domain);

		dispatch(domainCrawlerActor, {
			type: "provideArchiveActor",
			archiveActor,
		});

		dispatch(domainCrawlerActor, {
			type: "beginCrawlingFromRoot",
			hopsRemaining,
		});

		return {
			...state,
			domains: {
				...state.domains,
				[archiveKey]: Math.max(
					state.domains[archiveKey] || 0,
					msg.hopsRemaining || 0,
				),
			},
		};
	},

	discoveredDatDomain: async (state, msg, ctx) => {
		if (
			state.domains[msg.archiveKey] ||
			state.domains[msg.archiveKey] >= msg.hopsRemaining
		) {
			return;
		}

		dispatch(ctx.self, {
			type: "mountDomain",
			domain: msg.domain,
			hopsRemaining: msg.hopsRemaining,
		});
	},
};

export default createActorDefinition(engineNameBuilder, initialState, logic);

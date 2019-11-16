import * as R from "ramda";
import { query, dispatch } from "nact";
import keb from "@freddieridell/kebab-case";

import { createChildSummoner, createActorDefinition } from "../util";

import summonArchiveActorChild from "./archive";

export function sourceNameBuilder() {
	return "source";
}

const initialState = {};

const logic = {
	foundArchive: async (state, msg, ctx) => {
		const currentHopsRemainingForArchive = R.path(
			["hopsRemaining", msg.hash],
			state,
		);

		if (currentHopsRemainingForArchive >= msg.hopsRemaining) {
			return;
		}

		const archiveActor = summonArchiveActorChild(ctx, msg.hash);

		dispatch(archiveActor, {
			type: "mountActor",
			hash: msg.hash,
			dnsActor: state.dnsActor,
		});

		dispatch(archiveActor, {
			type: "beginCrawling",
		});

		return R.evolve({
			hopsRemaining: {
				[msg.hash]: R.max(msg.hopsRemaining),
			},
		});
	},

	foundLink: async (state, msg, ctx) => {
		console.log(
			`dat://${msg.from.hash}${msg.from.pathname} => dat://${msg.to.hash}${msg.to.pathname}`,
		);
	},
};

export const createSourceActor = createActorDefinition(
	sourceNameBuilder,
	initialState,
	logic,
);

export default createChildSummoner(sourceNameBuilder, createSourceActor);

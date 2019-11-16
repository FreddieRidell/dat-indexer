import * as R from "ramda";
import { query, dispatch } from "nact";

import { createChildSummoner, createActorDefinition } from "./util";

import summonDnsActorChild from "./dns";
import summonSourceActorChild from "./source";

export function engineNameBuilder() {
	return "engine";
}

const initialState = {};

const logic = {
	beginIndexing: async (state, msg, ctx) => {
		const dnsActor = summonDnsActorChild(ctx);
		const sourceActor = summonSourceActorChild(ctx);

		const { hash: rootHash } = await query(
			dnsActor,
			{ type: "hostnameToHash", hostname: state.rootDomain },
			10000,
		);

		dispatch(sourceActor, {
			type: "mountActor",
			dnsActor,
		});

		dispatch(sourceActor, {
			type: "foundArchive",
			hash: rootHash,
			hopsRemaining: state.hops,
		});
	},
};

export default createActorDefinition(engineNameBuilder, initialState, logic);

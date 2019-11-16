import SDK from "dat-sdk";
import * as R from "ramda";
import { dispatch } from "nact";

import { createChildSummoner, createActorDefinition } from "./util";

const { resolveName } = SDK();

async function resolveDatName(hostname) {
	try {
		const hash = await resolveName(hostname);
		return hash;
	} catch (e) {
		return false;
	}
}

export function dnsNameBuilder() {
	return "dns";
}

const initialState = {};

const logic = {
	hostnameToHash: async (state, msg, ctx) => {
		const cached = R.path(["hostnameToHash", msg.hostname], state);

		if (cached !== undefined) {
			return cached;
		}

		const hash = await resolveDatName(msg.hostname);

		dispatch(ctx.sender, {
			...msg,
			hash,
		});

		return R.evolve({
			hostnameToHash: {
				[msg.hostname]: () => hash,
			},
			hashToHostname: {
				[hash]: [msg.hostname],
			},
		})(state);
	},
};

export const createDnsActor = createActorDefinition(
	dnsNameBuilder,
	initialState,
	logic,
);

export default createChildSummoner(dnsNameBuilder, createDnsActor);

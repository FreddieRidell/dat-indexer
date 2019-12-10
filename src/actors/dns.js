import { dispatch } from "nact";
import SDK from "dat-sdk";
import * as R from "ramda";

import { defineActor } from "../actorsUtil";

const { resolveName } = SDK();

async function resolveDatName(hostname) {
	try {
		const hash = await resolveName(hostname);
		return hash;
	} catch (e) {
		return false;
	}
}

import { requestDNS, resolveDNS } from "../messages";

export default defineActor(
	function dnsResolverNameBuilder() {
		return "dns-resolver";
	},
	{},
	{
		...requestDNS.respond(async (state, { hostname }, ctx) => {
			const cachedHash = state[hostname];

			const hash = await (cachedHash === undefined
				? resolveDatName(hostname)
				: Promise.resolve(cachedHash));

			if (hash) {
				dispatch(
					ctx.sender,
					resolveDNS.create({
						success: true,
						hostname,
						hash,
					}),
					ctx.self,
				);

				return R.assoc(hostname, hash);
			} else {
				dispatch(
					ctx.sender,
					resolveDNS.create({
						success: false,
						hostname,
						hash: null,
					}),
					ctx.self,
				);

				return R.assoc(hostname, false);
			}
		}),
	},
);

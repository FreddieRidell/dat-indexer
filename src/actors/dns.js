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
			const hash = await resolveDatName(hostname);

			if (hash) {
				dispatch(
					ctx.sender,
					resolveDNS.create({
						hostname,
						hash,
					}),
					ctx.self,
				);
			}
		}),
	},
);

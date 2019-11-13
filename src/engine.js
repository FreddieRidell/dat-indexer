import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import createDomainCrawler, { createDomainCrawlerName } from "./domainCrawler";

function getOrCreateDomainCrawler(msg, ctx) {
	return ctx.children.has(createDomainCrawlerName(msg.domain))
		? ctx.children.get(createDomainCrawlerName(msg.domain))
		: createDomainCrawler(ctx.self, msg.domain);
}

export default function createEngine(parent) {
	return spawnStateless(
		parent,
		function(msg, ctx) {
			console.log(ctx.name, msg.type);

			switch (msg.type) {
				case "mountDomain": {
					const domainCrawlerActor = getOrCreateDomainCrawler(
						msg,
						ctx,
					);

					dispatch(domainCrawlerActor, msg, ctx.self);

					return;
				}

				default:
					console.log("invalid msg", ctx.name, msg.type);
			}
		},
		"engine",
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

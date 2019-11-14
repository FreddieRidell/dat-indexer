import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import createDomainCrawler, { createDomainCrawlerName } from "./domainCrawler";

function getOrCreateDomainCrawler(ctx, domain) {
	return ctx.children.has(createDomainCrawlerName(domain))
		? ctx.children.get(createDomainCrawlerName(domain))
		: createDomainCrawler(ctx.self, domain);
}

export default function createEngine(parent) {
	return spawnStateless(
		parent,
		(msg, ctx) =>
			((
				{
					foundNewDomain: () => {
						const domainCrawlerActor = getOrCreateDomainCrawler(
							ctx,
							msg.domain,
						);

						dispatch(
							domainCrawlerActor,
							{
								...msg,
								type: "mountDomain",
							},
							ctx.self,
						);

						return;
					},
					mountDomain: () => {
						const domainCrawlerActor = getOrCreateDomainCrawler(
							ctx,
							msg.domain,
						);

						dispatch(domainCrawlerActor, msg, ctx.self);

						return;
					},
				}[msg.type] ||
				(() => {
					console.log("invalid msg", ctx.name, msg.type);
				})
			)()),
		"engine",
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

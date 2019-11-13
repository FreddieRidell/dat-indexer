import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";

export const createFileCrawlerName = (domain, file) =>
	keb(["fileCrawler", domain, file].join("-"));

export default function createFileCrawler(parent, archive, domain, file) {
	return spawn(
		parent,
		async function(state = {}, msg, ctx) {
			//console.log(ctx.name, JSON.stringify(file), msg.type);

			switch (msg.type) {
				default:
					console.log("invalid msg", ctx.name, msg.type);
					return state;
			}
		},
		createFileCrawlerName(domain, file),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

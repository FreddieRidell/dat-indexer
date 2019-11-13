import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import { datUrlRegex } from "./util";

export const createFileCrawlerName = (domain, file) =>
	keb(["fileCrawler", domain, file].join("-"));

export default function createFileCrawler(parent, archive, domain, file) {
	return spawn(
		parent,
		async function(state = {}, msg, ctx) {
			switch (msg.type) {
				case "crawlFile": {
					const fileString = await archive.readFile(file, "utf8");

					const datUrls = datUrlRegex.match(fileString);

					console.log({ datUrls });

					return state;
				}
				default:
					console.log("invalid msg", ctx.name, msg.type);
					return state;
			}
		},
		createFileCrawlerName(domain, file),
		{ onCrash: (msg, err) => console.error(msg.type, err) },
	);
}

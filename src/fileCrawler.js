import keb from "@freddieridell/kebab-case";
import url from "url";
import path from "path";
import { spawn, start, dispatch, stop, spawnStateless } from "nact";

import { snooze, datUrlRegex } from "./util";

export const createFileCrawlerName = (domain, file) =>
	keb(["fileCrawler", domain, file].join("-"));

const urlBlackList = [/^www.w3.org/];

export default function createFileCrawler(parent, archive, domain, file) {
	return spawn(
		parent,
		async function(state = {}, msg, ctx) {
			switch (msg.type) {
				case "crawlFile": {
					await snooze();

					const fileString = await archive.readFile(file, "utf8");

					const datUrls = fileString.match(datUrlRegex) || [];
					for (const url of datUrls) {
						if (
							!urlBlackList.reduce(
								(acc, regex) => acc || regex.test(url),
								false,
							)
						) {
							dispatch(
								ctx.sender,
								{
									type: "foundUrl",
									url,
								},
								ctx.self,
							);
						}
					}

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

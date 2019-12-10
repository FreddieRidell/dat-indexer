import url from "url";
import R from "ramda";

import { start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import crawler from "./actors/crawler";
import { foundLink } from "./messages";

const system = start();

const crawlerInstance = crawler.create(system);

dispatch(
	crawlerInstance,
	foundLink.create({
		sink: {
			host: "explore.beakerbrowser.com",
			path: "/",
		},
		source: {
			host: null,
			path: null,
		},
	}),
);

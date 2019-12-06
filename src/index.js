import { start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import crawler from "./actors/crawler";
import { foundLink } from "./messages";

const system = start();

const crawlerInstance = crawler.create(system);

dispatch(
	crawlerInstance,
	foundLink.create({ source: null, sink: "dat://explore.beakerbrowser.com" }),
);

import { start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import createEngine from "./actor/engine";

const system = start();

const engine = createEngine(system);

dispatch(engine, {
	type: "mountActor",
	rootDomain: "dat://beakerbrowser.com",
	hops: 3,
});

dispatch(engine, { type: "beginIndexing" });

//engine => domainCrawler => folderCrawler => fileCrawler;
//stop(system);

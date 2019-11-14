import { start, dispatch, stop, spawnStateless } from "nact";
import { DatArchive } from "dat-sdk/auto";

import createEngine from "./engine";

const system = start();

const engine = createEngine(system);

dispatch(engine, {
	type: "mountDomain",
	domain: "dat://beakerbrowser.com",
	hopsRemaining: 3,
});

//engine => domainCrawler => folderCrawler => fileCrawler;
//stop(system);

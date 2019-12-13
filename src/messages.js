import { query, dispatch } from "nact";

import { createMessageDefinition } from "./actorsUtil";

export const foundLink = createMessageDefinition(
	"FOUND_LINK",
	({ sink, source }) => ({
		sink, // {host, hash, path}
		source, // { host, hash, path}
	}),
);

export const requestDNS = createMessageDefinition(
	"REQUEST_DNS",
	({ host, responseMsg }) => ({
		host,
		responseMsg,
	}),
);

export const foundArchivePageForCrawling = createMessageDefinition(
	"FOUND_ARCHIVE_PAGE_FOR_CRAWLING",
	({ host, hash, path, distanceFromRoot }) => ({
		host,
		hash,
		path,
		distanceFromRoot,
	}),
);

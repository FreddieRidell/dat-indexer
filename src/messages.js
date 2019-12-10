import { query, dispatch } from "nact";

import { createMessageDefinition } from "./actorsUtil";

export const foundLinks = createMessageDefinition(
	"FOUND_LINKS",
	({ sourceUrl, sinkUrls }) => ({
		sourceUrl,
		sinkUrls,
	}),
);

export const foundLink = createMessageDefinition(
	"FOUND_LINK",
	({ sourceUrl, sinkUrl }) => ({
		sourceUrl,
		sinkUrl,
	}),
);

export const requestDNS = createMessageDefinition(
	"REQUEST_DNS",
	({ hostname }) => ({
		hostname,
	}),
);

export const resolveDNS = createMessageDefinition(
	"RESOLVE_DNS",
	({ hostname, hash, success }) => ({
		success,
		hostname,
		hash,
	}),
);

export const foundArchiveForCrawling = createMessageDefinition(
	"FOUND_ARCHIVE_FOR_CRAWLING",
	({ hash }) => ({
		hash,
	}),
);

export const foundArchivePageForCrawling = createMessageDefinition(
	"FOUND_ARCHIVE_PAGE_FOR_CRAWLING",
	({ hash, path }) => ({
		hash,
		path,
	}),
);

export const updatePageRank = createMessageDefinition(
	"UPDATE_PAGE_RANK",
	({ page, rankSet, rankAdd }) => ({
		page,
		rankSet,
		rankAdd,
	}),
);

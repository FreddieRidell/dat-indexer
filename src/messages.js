import { query, dispatch } from "nact";

import { createMessageDefinition } from "./actorsUtil";

export const foundLink = createMessageDefinition(
	"FOUND_LINK",
	({ source, sink }) => ({
		source,
		sink,
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
	({ hostname, hash }) => ({
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

export const foundFolderForCrawling = createMessageDefinition(
	"FOUND_FOLDER_FOR_CRAWLING",
	({ folderPath }) => ({
		folderPath,
	}),
);

export const foundJSONForCrawling = createMessageDefinition(
	"FOUND_JSON_FOR_CRAWLING",
	({ filePath }) => ({
		filePath,
	}),
);

export const foundTextForCrawling = createMessageDefinition(
	"FOUND_TEXT_FOR_CRAWLING",
	({ filePath }) => ({
		filePath,
	}),
);

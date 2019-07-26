import { promisify } from "util";
import SDK from "dat-sdk";

import { reallyReady } from "./util";

const { Hyperdrive, resolveName, deleteStorage } = SDK();

const archiveKeysIHaveSeen = new Set([]);

const archiveKeyToMetaData = {};

function resolveNameRetryFalloff(name, falloff = 100) {
	if (falloff > 10000) {
		return Promise.reject(`can't resolve name ${name}`);
	}

	return promisify(resolveName)(name).catch(() =>
		new Promise(done => {
			console.error(`could not resolve name "${name}", retrying`);

			setTimeout(done, falloff);
		}).then(() => resolveNameRetryFalloff(name, falloff * 2)),
	);
}

export function printDebug() {
	console.log({ archiveKeysIHaveSeen, archiveKeyToMetaData });
}

export async function addArchiveByKey(distanceFromStartArchive, key) {
	archiveKeysIHaveSeen.add(key);
	archiveKeyToMetaData[key] = {
		...archiveKeyToMetaData[key],
		distanceFromStartArchive: Math.min(
			distanceFromStartArchive,
			(archiveKeyToMetaData[key] || {}).distanceFromStartArchive ||
				Infinity,
		),
	};
}

export async function addArchiveByDNS(distanceFromStartArchive, dns) {
	const key = await resolveNameRetryFalloff(dns);
	addArchiveByKey(distanceFromStartArchive, key);

	archiveKeyToMetaData[key] = {
		...archiveKeyToMetaData[key],
		dns,
	};
}

export async function* itterateThroughArchives() {
	for (const archiveKey of archiveKeysIHaveSeen) {
		const archive = await Hyperdrive(archiveKey);

		yield {
			archive,
			meta: archiveKeyToMetaData[archiveKey],
		};
	}
}

import R from "ramda";
import url from "url";
import SDK from "dat-sdk";

let snoozePresure = 0;

export async function snooze(x = 1) {
	snoozePresure++;

	await new Promise(done =>
		setTimeout(done, Math.pow(10, x) * Math.sqrt(snoozePresure)),
	);

	snoozePresure--;

	return;
}

export const sanitiseUrlPath = ({ defaultPath }) =>
	R.pipe(
		R.defaultTo(defaultPath || "/"),
		R.split("/"),
		R.filter(R.prop("length")),
		R.join("/"),
	);

export const sanitiseUrl = ({
	defaultPath,
	defaultProtcol,
	defaultHostname,
} = {}) =>
	R.pipe(
		url.parse,
		R.evolve({
			protocol: defaultProtcol ? R.defaultTo(defaultProtcol) : R.identity,
			slashes: defaultProtcol ? R.defaultTo(true) : R.identity,
			host: defaultHostname ? R.defaultTo(defaultHostname) : R.identity,
			hostname: defaultHostname
				? R.defaultTo(defaultHostname)
				: R.identity,
			path: sanitiseUrlPath({ defaultPath }),
			pathname: sanitiseUrlPath({ defaultPath }),
			hash: R.always(null),
			search: R.always(null),
			query: R.always(null),
		}),
		url.format,
	);

import * as R from "ramda";
import SDK from "dat-sdk";
import cheerio from "cheerio";
import url from "url";
import { promisify } from "util";

const { Hyperdrive, resolveName, deleteStorage } = SDK();

async function reallyReady(archive) {
	await promisify(archive.ready)();

	return new Promise(cb => {
		if (archive.metadata.peers.length) {
			archive.metadata.update({ ifAvailable: true }, cb);
		} else {
			archive.metadata.once("peer-add", () => {
				archive.metadata.update({ ifAvailable: true }, cb);
			});
		}
	});
}

async function openNamedArchive(dnsName) {
	try {
		const archive = await Hyperdrive(dnsName);

		return archive;
	} catch (e) {
		const rn = promisify(resolveName);
		const archiveUrl = await rn(dnsName)
			.catch(() => rn(dnsName))
			.catch(() => rn(dnsName))
			.catch(() => rn(dnsName))
			.catch(() => rn(dnsName))
			.catch(() => rn(dnsName))
			.catch(() => rn(dnsName));

		const archive = await Hyperdrive(archiveUrl);
		return archive;
	}
}

async function readFileFromArchive(archive, path) {
	return new Promise((done, fail) => {
		archive.readFile(path, "utf8", (err, data) => {
			if (err) {
				fail(err);
			} else {
				done(data);
			}
		});
	});
}

async function* extractLinksFromPage(
	distanceFromRoot,
	archiveDnsName,
	pathname,
) {
	const currentlyParsingPathObj = {
		...url.parse(archiveDnsName),
		pathname: pathname,
	};

	const archive = await openNamedArchive(archiveDnsName);

	await reallyReady(archive);

	const pageSrc = await readFileFromArchive(archive, pathname)
		.catch(() => readFileFromArchive(archive, pathname + ".html"))
		.catch(() => readFileFromArchive(archive, pathname + "/index.html"));

	const $ = cheerio.load(pageSrc);

	const allLinks = $("a")
		.map(function(i, elem) {
			return $(this).attr("href");
		})
		.get();

	const links = R.pipe(
		R.map(x => url.resolve(url.format(currentlyParsingPathObj), x)),
		R.map(url.parse),
		R.filter(Boolean),
		R.filter(R.propEq("protocol", "dat:")),
		R.map(
			R.over(
				R.lensProp("host"),
				R.unless(
					R.prop("length"),
					R.always(currentlyParsingPathObj.host),
				),
			),
		),
		R.map(R.pick(["host", "pathname"])),
		R.map(R.over(R.lensProp("pathname"), R.defaultTo("/"))),
		R.uniqBy(({ host, pathname }) => host + pathname),
		R.map(R.assoc("distanceFromRoot", distanceFromRoot - 1)),
	)(allLinks);

	for (const link of links) {
		yield link;
	}
}

async function main() {
	const foundLinks = {
		//"explore.beakerbrowser.com/": {
		//distanceFromRoot: 3,
		//host: "explore.beakerbrowser.com",
		//pathname: "/",
		//},
		"b6201615277a04b958afd25b3531b90083f9dc4e2c38e3cbedb0a257def456fe/": {
			distanceFromRoot: 3,
			host:
				"b6201615277a04b958afd25b3531b90083f9dc4e2c38e3cbedb0a257def456fe",
			pathname: "/",
		},
	};

	while (Object.keys(foundLinks)[0]) {
		const key = Object.keys(foundLinks)[0];

		const { distanceFromRoot, host, pathname } = foundLinks[key];
		console.log(
			distanceFromRoot,
			host
				.split(".")
				.reverse()
				.join("."),
			pathname,
		);

		if (distanceFromRoot > 0) {
			try {
				for await (const link of extractLinksFromPage(
					distanceFromRoot,
					host,
					pathname,
				)) {
					foundLinks[link.host + link.pathname] = link;
				}

				delete foundLinks[key];
			} catch (e) {
				console.error(e);

				delete foundLinks[key];
				//foundLinks[key] = { distanceFromRoot, host, pathname };

				await new Promise(x => setTimeout(x, 1000));
			}
		}
	}
}

main();

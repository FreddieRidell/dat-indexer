export async function reallyReady(archive) {
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

async function* extractLinksFromPage(archive, path) {
	const currentlyParsingPathObj = {
		...url.parse(archiveDnsName),
		pathname: pathname,
	};

	const archive = await openNamedArchive(archiveDnsName);

	await reallyReady(archive);

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

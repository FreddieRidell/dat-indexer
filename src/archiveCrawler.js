import { addArchiveByKey, addArchiveByDNS } from "./archivesCollection";
import { readFileFromArchive } from "./util";

export async function crawlArchive(archive, meta) {
	const internalPathsIHaveSeen = new Set(["/"]);

	function* itterateThroughPages() {
		for (const internalPath of internalPathsIHaveSeen) {
			yield internalPath;
		}
	}

	function addInternalPath(path) {
		internalPathsIHaveSeen.add(path);
	}

	async function extractLinksFromPage(archive, internalPage) {
		const pageSrc = await readFileFromArchive(archive, pathname)
			.catch(() => readFileFromArchive(archive, pathname + ".html"))
			.catch(() =>
				readFileFromArchive(archive, pathname + "/index.html"),
			);

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
		)(allLinks);
	}

	console.log({ archive, meta });
}

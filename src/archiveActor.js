import * as R from "ramda";
import keb from "@freddieridell/kebab-case";
import path from "path";
import { DatArchive } from "dat-sdk/auto";
import { dispatch } from "nact";

import {
	datUrlRegex,
	createActorDefinition,
	createChildSummoner,
} from "./util";

// archiveHash is required, but dnsName may not be known
export function archiveActorNameBuilder(archiveHash, dnsName) {
	return keb(["archive", archiveHash].join("-"));
}

const initialState = {};

const logic = {
	mount: async (state, msg, ctx, archiveHash, dnsName) => {
		if (state.archive) {
			dispatch(ctx.sender, { type: "alreadyMountedArchive" });
			return state;
		}

		const archive = await DatArchive.load(archiveHash, {
			persist: true,
		});

		dispatch(ctx.sender, { type: "mountedArchive" });

		return {
			...state,
			archive,
		};
	},

	requestContentsOfDir: async (state, msg, ctx, archiveHash) => {
		if (msg.archiveHash !== archiveHash) {
			return;
		}

		try {
			const fileNames = await state.archive.readdir(msg.dirPath);

			const entries = await Promise.all(
				fileNames.map(async fileName => {
					const fullPath = path.join(msg.dirPath, fileName);

					const statted = await state.archive.stat(fullPath);

					return {
						fileName,
						fullPath,
						isDir: statted.isDirectory(),
					};
				}),
			);

			dispatch(ctx.sender, { type: "respondContentsOfDir", entries });
		} catch {
			dispatch(ctx.sender, { type: "respondContentsOfDir", entries: [] });
		}
	},

	requestLinksFoundInFile: async (state, msg, ctx, archiveHash) => {
		if (msg.archiveHash !== archiveHash) {
			return;
		}

		const stringFileContents = await state.archive.readFile(
			msg.filePath,
			"utf8",
		);

		const foundUrls = stringFileContents.match(datUrlRegex) || [];

		dispatch(ctx.sender, {
			type: "respondLinksFoundInFile",
			foundUrls,
		});
	},
};

export const createArchiveActor = createActorDefinition(
	archiveActorNameBuilder,
	initialState,
	logic,
);

export default createChildSummoner(archiveActorNameBuilder, createArchiveActor);

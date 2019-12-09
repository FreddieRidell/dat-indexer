import R from "ramda";
import url from "url";
import { dispatch } from "nact";

import { defineActor } from "../actorsUtil";

import { updatePageRank, foundLinks } from "../messages";

const DAMPER = 0.8;
const DEFAULT = 0.0;
const START = 10.0;

export default defineActor(
	function crawlerNameBuilder() {
		return "page-ranks";
	},
	{
		null: START,
	},
	{
		...updatePageRank.respond(
			async (state, { page, rankSet, rankAdd }, ctx) => {
				return R.over(
					R.lensProp(page),
					R.pipe(
						...[
							R.defaultTo(DEFAULT),
							rankSet ? () => rankSet : R.identity,
							rankAdd ? R.add(rankAdd) : R.identity,
							//R.tap(rank => {
							//if (rank) {
							//console.log(page, rank);
							//}
							//}),
						].filter(Boolean),
					),
				);
			},
		),

		...foundLinks.respond(async (state, { source, sinks }, ctx) => {
			const sourceRank = state[source] || 0;

			for (const sink of sinks) {
				dispatch(
					ctx.self,
					updatePageRank.create({
						page: sink,
						rankAdd: sourceRank / sinks.length,
					}),
				);
			}
		}),
	},
);

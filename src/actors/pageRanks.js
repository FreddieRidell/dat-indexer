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
	{},
);

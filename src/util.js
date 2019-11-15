import SDK from "dat-sdk";

import { spawn, start, dispatch, stop, spawnStateless } from "nact";

let snoozePresure = 0;

export async function snooze(x = 1) {
	snoozePresure++;

	await new Promise(done =>
		setTimeout(done, Math.pow(10, x) * Math.sqrt(snoozePresure)),
	);

	snoozePresure--;

	return;
}

export const datUrlRegex = /(((dat:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;

export function createChildSummoner(nameBuilder, actorCreator) {
	return (ctx, ...args) => {
		const name = nameBuilder(...args);

		return ctx.children.has(name)
			? ctx.children.get(name)
			: actorCreator(ctx.self, ...args);
	};
}

const defaultOnCrash = (msg, err, ctx) =>
	console.error(`Error @ "${ctx.name}" => "${msg.type}"`, err);

export function createActorDefinition(
	nameBuilder,
	initialState,
	logic,
	onCrash = defaultOnCrash,
) {
	return (parent, ...args) =>
		spawn(
			parent,
			async (state = initialState, msg, ctx) => {
				const handler = logic[msg.type];

				if (!handler) {
					console.log(`invalid msg @ "${ctx.name}" => "${msg.type}"`);

					return state;
				}

				const newState = await handler(state, msg, ctx, ...args);

				return newState === undefined ? state : newState;
			},
			nameBuilder(...args),
			{
				onCrash: (msg, err, ctx) => onCrash(msg, err, ctx, ...args),
			},
		);
}

const { resolveName } = SDK();

export async function resolveDatName(datDnsName) {
	try {
		const hash = await resolveName(datDnsName);
		return hash;
	} catch (e) {
		return false;
	}
}

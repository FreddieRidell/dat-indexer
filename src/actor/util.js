import * as R from "ramda";

import { spawn, start, dispatch, stop, spawnStateless } from "nact";

export function createChildSummoner(nameBuilder, actorCreator) {
	return (ctx, ...args) => {
		const name = nameBuilder(...args);

		return ctx.children.has(name)
			? ctx.children.get(name)
			: actorCreator(ctx.self, ...args);
	};
}

export function createActorDefinition(
	nameBuilder,
	initialState,
	logic,
	crashLogic = {},
) {
	return (parent, ...args) =>
		spawn(
			parent,
			async (state = initialState, msg, ctx) => {
				if (msg.type === "mountActor") {
					return R.mergeLeft(R.dissoc("type", msg), state);
				}

				const handler = logic[msg.type];

				if (!handler) {
					console.log(`invalid msg @ "${ctx.name}" => "${msg.type}"`);

					return state;
				}

				const newState = await handler(state, msg, ctx);

				return newState === undefined
					? state
					: typeof newState === "function"
					? newState(state)
					: newState;
			},
			nameBuilder(...args),
			{
				onCrash: async (msg, err, ctx) => {
					const handler = crashLogic[msg.type];

					if (!handler) {
						console.error(
							`Error @ "${ctx.name}" => "${msg.type}"`,
							err,
						);
						return ctx.escalate;
					}

					const response = await handler(msg, err, ctx);

					return response;
				},
			},
		);
}

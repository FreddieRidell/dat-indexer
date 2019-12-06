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

export function defineActor(nameBuilder, initialState, logic, crashLogic = {}) {
	const create = (parent, ...args) =>
		spawn(
			parent,
			async (state = initialState, msg, ctx) => {
				const handler = logic[msg.type];

				if (!handler) {
					console.log(
						`unhandled msg @ "${ctx.name}" => "${msg.type}"`,
					);

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

	const summon = createChildSummoner(nameBuilder, create);
	const exists = (ctx, ...args) => ctx.children.has(nameBuilder(...args));
	const locate = (ctx, ...args) => ctx.children.get(nameBuilder(...args));

	return {
		exists,
		locate,
		summon,
		create,
	};
}

export function createMessageDefinition(type, factory) {
	return {
		create: (...args) => ({
			type,
			...factory(...args),
		}),
		respond: handler => ({
			[type]: handler,
		}),
		forwardUp: () => ({
			[type]: (_, msg, ctx) => {
				dispatch(ctx.parent, msg);
			},
		}),
	};
}

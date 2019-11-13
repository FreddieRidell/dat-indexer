import { spawn, start, dispatch, stop, spawnStateless } from "nact";

export default function createSearchRootPage(parent) {
	return spawn(
		parent,
		(state = {}, msg, ctx) => {
			const hasPreviouslyGreetedMe = state[msg.name] !== undefined;
			if (hasPreviouslyGreetedMe) {
				console.log(`Hello again ${msg.name}.`);
				return state;
			} else {
				console.log(
					`Good to meet you, ${msg.name}.\nI am the ${ctx.name} service!`,
				);
				return { ...state, [msg.name]: true };
			}
		},
		"searchRootPage",
	);
}

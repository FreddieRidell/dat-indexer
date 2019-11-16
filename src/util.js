import SDK from "dat-sdk";

let snoozePresure = 0;

export async function snooze(x = 1) {
	snoozePresure++;

	await new Promise(done =>
		setTimeout(done, Math.pow(10, x) * Math.sqrt(snoozePresure)),
	);

	snoozePresure--;

	return;
}

import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The daemon the tests run: `GARMIN_CODE_MINI_ENV_DAEMON` (CI points it at release builds), else the one `cargo build` built in
 * ../daemon.
 */
export const daemon =
	process.env.GARMIN_CODE_MINI_ENV_DAEMON ??
	resolve(
		import.meta.dirname,
		`../daemon/target/debug/garmin-code-mini-env${process.platform === "win32" ? ".exe" : ""}`,
	);
if (!existsSync(daemon)) {
	throw new Error(`Build the daemon first: npm run build:daemon in packages/env (missing ${daemon})`);
}

/**
 * Custom entry rendering example.
 *
 * Shows how to render durable extension data inside the chat without sending it
 * to the LLM. Custom entries are stored in the session via garminCodeMini.appendEntry() and
 * rendered in interactive mode via garminCodeMini.registerEntryRenderer().
 *
 * Usage: /status-card [message]
 */

import { Box, Text } from "@garmin-code-mini/tui";
import type { ExtensionAPI } from "garmin-code-mini";

interface StatusCardData {
	message: string;
	timestamp: number;
}

export default function (garminCodeMini: ExtensionAPI) {
	garminCodeMini.registerEntryRenderer<StatusCardData>("status-card", (entry, { expanded }, theme) => {
		const data = entry.data ?? { message: "No data", timestamp: Date.now() };
		const box = new Box(1, 1, (text) => theme.bg("customMessageBg", text));
		box.addChild(new Text(`${theme.fg("accent", "[status]")} ${data.message}`, 0, 0));

		if (expanded) {
			box.addChild(new Text(theme.fg("dim", new Date(data.timestamp).toLocaleString()), 0, 0));
		}

		return box;
	});

	garminCodeMini.registerCommand("status-card", {
		description: "Render a durable status card that is not sent to the LLM",
		handler: async (args) => {
			garminCodeMini.appendEntry<StatusCardData>("status-card", {
				message: args.trim() || "Status card",
				timestamp: Date.now(),
			});
		},
	});
}

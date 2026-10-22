import type { ExtensionAPI } from "garmin-code-mini";

export default function widgetPlacementExtension(garminCodeMini: ExtensionAPI) {
	garminCodeMini.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.setWidget("widget-above", ["Above editor widget"]);
		ctx.ui.setWidget("widget-below", ["Below editor widget"], { placement: "belowEditor" });
	});
}

import * as durable from "@garmin-code-mini/durable";
import * as environment from "@garmin-code-mini/durable/env";
import * as jsonl from "@garmin-code-mini/durable/storage/jsonl";
import * as sqlite from "@garmin-code-mini/durable/storage/sqlite";

// Keep runtime-neutral public entry points live so the browser smoke build
// catches accidental imports of Node-only adapters or built-ins.
console.log(Object.keys(durable), Object.keys(environment), Object.keys(jsonl), Object.keys(sqlite));

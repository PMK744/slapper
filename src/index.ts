import type { Serenity } from "@serenityjs/serenity";
import type { Plugin } from "@serenityjs/plugins";
import { Slapper } from "./slapper";

/**
 * Fired when the plugin is initialized
 * @param serenity The serenity instance of the server
 * @param data The data of the plugin, such as the logger and config
 */
export function onInitialize(serenity: Serenity, data: Plugin): void {
	// Create a new instance of the slapper plugin
	new Slapper(serenity);
}

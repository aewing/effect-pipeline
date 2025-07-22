import { Effect } from "effect";
import type { RuntimeEvent } from "../../core/event";
import type { Plugin } from "./plugin";

export const LoggingPlugin: Plugin = {
  name: "console-logger",
  onEvent: (event: RuntimeEvent) =>
    Effect.sync(() => {
      const timestamp = new Date().toISOString();
      const name =
        "nodeName" in event
          ? event.nodeName
          : "pipelineName" in event
          ? event.pipelineName
          : "deploymentName" in event
          ? event.deploymentName
          : "clusterName" in event
          ? event.clusterName
          : "";
      console.log(`[${timestamp}] ${event._tag}: ${name}`);
    })
}; 
import { describe, it, expect } from "bun:test";
import type { RuntimeEvent } from "./event";

describe("RuntimeEvent", () => {
  it("should support NodeStarted event", () => {
    const event: RuntimeEvent = {
      _tag: "NodeStarted",
      nodeName: "test-node"
    };

    expect(event._tag).toBe("NodeStarted");
    expect(event.nodeName).toBe("test-node");
  });

  it("should support NodeCompleted event", () => {
    const event: RuntimeEvent = {
      _tag: "NodeCompleted",
      nodeName: "test-node"
    };

    expect(event._tag).toBe("NodeCompleted");
    expect(event.nodeName).toBe("test-node");
  });

  it("should support NodeErrored event", () => {
    const error = new Error("Test error");
    const event: RuntimeEvent = {
      _tag: "NodeErrored",
      nodeName: "test-node",
      error
    };

    expect(event._tag).toBe("NodeErrored");
    expect(event.nodeName).toBe("test-node");
    expect(event.error).toBe(error);
  });

  it("should support PipelineStarted event", () => {
    const event: RuntimeEvent = {
      _tag: "PipelineStarted",
      pipelineName: "test-pipeline"
    };

    expect(event._tag).toBe("PipelineStarted");
    expect(event.pipelineName).toBe("test-pipeline");
  });

  it("should support PipelineCompleted event", () => {
    const event: RuntimeEvent = {
      _tag: "PipelineCompleted",
      pipelineName: "test-pipeline"
    };

    expect(event._tag).toBe("PipelineCompleted");
    expect(event.pipelineName).toBe("test-pipeline");
  });

  it("should support PipelineErrored event", () => {
    const error = new Error("Pipeline failed");
    const event: RuntimeEvent = {
      _tag: "PipelineErrored",
      pipelineName: "test-pipeline",
      error
    };

    expect(event._tag).toBe("PipelineErrored");
    expect(event.pipelineName).toBe("test-pipeline");
    expect(event.error).toBe(error);
  });
}); 
/**
 * Runtime events emitted by the engine – can be consumed by plugins or CLI
 * components for real-time feedback.
 */
export type RuntimeEvent =
  | { _tag: "NodeStarted"; nodeName: string }
  | { _tag: "NodeCompleted"; nodeName: string }
  | { _tag: "NodeErrored"; nodeName: string; error: unknown }
  | { _tag: "PipelineStarted"; pipelineName: string }
  | { _tag: "PipelineCompleted"; pipelineName: string }
  | { _tag: "PipelineErrored"; pipelineName: string; error: unknown }
  // NEW events below
  | { _tag: "DeploymentStarted"; deploymentName: string }
  | { _tag: "DeploymentCompleted"; deploymentName: string }
  | { _tag: "DeploymentErrored"; deploymentName: string; error: unknown }
  | { _tag: "ClusterStarted"; clusterName: string }
  | { _tag: "ClusterCompleted"; clusterName: string }
  | { _tag: "ClusterErrored"; clusterName: string; error: unknown }; 
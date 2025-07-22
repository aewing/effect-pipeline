import { cluster } from "../src/core/clusterBuilder";
import apiPipeline from "./api.pipeline";
import dataPipeline from "./dataProcessing.pipeline";

export default cluster("example-cluster")
  .addDeployment({ name: "api", pipe: apiPipeline })
  .addDeployment({ name: "data", pipe: dataPipeline })
  .withConfig({ env: "local" })
  .build(); 
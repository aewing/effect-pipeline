import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node } from "../src/core/node";

// Data Processing Pipeline - demonstrates complex transformations
const dataIngress: Node<any, any> = {
  kind: NodeKind.Ingress,
  name: "data-ingress",
  run: async () => [
    { id: 1, name: "Alice", age: 25, score: 85 },
    { id: 2, name: "Bob", age: 30, score: 92 },
    { id: 3, name: "Charlie", age: 22, score: 78 },
    { id: 4, name: "Diana", age: 28, score: 95 },
    { id: 5, name: "Eve", age: 35, score: 88 }
  ]
};

const filterAdults: Node<any, any> = {
  kind: NodeKind.Transform,
  name: "filter-adults",
  run: async (input: any[]) => {
    return input.filter(person => person.age >= 18);
  }
};

const calculateStats: Node<any, any> = {
  kind: NodeKind.Transform,
  name: "calculate-stats",
  run: async (input: any[]) => {
    const totalScore = input.reduce((sum, person) => sum + person.score, 0);
    const avgScore = totalScore / input.length;
    const highPerformers = input.filter(person => person.score >= 90);
    
    return {
      totalPeople: input.length,
      averageScore: Math.round(avgScore * 100) / 100,
      highPerformers: highPerformers.length,
      people: input
    };
  }
};

const formatOutput: Node<any, any> = {
  kind: NodeKind.Transform,
  name: "format-output",
  run: async (input: any) => {
    return {
      summary: `Processed ${input.totalPeople} people with average score of ${input.averageScore}`,
      highPerformers: input.highPerformers,
      details: input.people.map((p: any) => ({
        name: p.name,
        score: p.score,
        performance: p.score >= 90 ? "Excellent" : p.score >= 80 ? "Good" : "Needs Improvement"
      }))
    };
  }
};

const dataOutput: Node<any, any> = {
  kind: NodeKind.Egress,
  name: "data-output",
  run: async (input: any) => {
    console.log("📊 Data Processing Results:");
    console.log("=" .repeat(50));
    console.log(input.summary);
    console.log(`High performers: ${input.highPerformers}`);
    console.log("\nIndividual Results:");
    input.details.forEach((person: any) => {
      console.log(`  ${person.name}: ${person.score} (${person.performance})`);
    });
    return input;
  }
};

export default pipeline("data-processing")
  .from(dataIngress)
  .through(filterAdults)
  .through(calculateStats)
  .through(formatOutput)
  .to(dataOutput)
  .build(); 
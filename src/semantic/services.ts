// Simple service management for the Semantic API
// Hides Effect's Context.Tag complexity behind familiar patterns

import type { SemanticService } from "./types";

/**
 * Create a semantic service that can be injected into nodes.
 * Services provide reusable functionality with dependency injection.
 * 
 * @param name - Unique name for the service
 * @param implementation - Object containing the service methods
 */
export function service<T extends Record<string, (...args: any[]) => Promise<any> | any>>(
  name: string,
  implementation: T
): SemanticService {
  return {
    name,
    implementation
  };
}

/**
 * Internal helper to create a service registry from an array of services.
 * This is used by the pipeline executor to provide services to nodes.
 */
export function createServiceRegistry(services: readonly SemanticService[]): Record<string, any> {
  const registry: Record<string, any> = {};
  
  for (const svc of services) {
    registry[svc.name] = svc.implementation;
  }
  
  return registry;
}

/**
 * Internal helper to validate that all required services are available.
 * Throws a descriptive error if any services are missing.
 */
export function validateServices(
  requiredServices: readonly string[],
  availableServices: readonly SemanticService[]
): void {
  const availableNames = new Set(availableServices.map(s => s.name));
  const missing = requiredServices.filter(name => !availableNames.has(name));
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required services: ${missing.join(", ")}. ` +
      `Available services: ${Array.from(availableNames).join(", ")}`
    );
  }
}

/**
 * Internal helper to extract services needed by a node from the registry.
 * Returns an object where service names are keys and implementations are values.
 */
export function extractServicesForNode(
  requiredServices: readonly string[],
  serviceRegistry: Record<string, any>
): Record<string, any> {
  const nodeServices: Record<string, any> = {};
  
  for (const serviceName of requiredServices) {
    nodeServices[serviceName] = serviceRegistry[serviceName];
  }
  
  return nodeServices;
} 
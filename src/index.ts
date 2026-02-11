/**
 * @tinyland-inc/tinyland-prometheus
 *
 * Prometheus-compatible metrics registry with counters, gauges, and histograms.
 * Exports metrics in Prometheus text exposition format for scraping.
 *
 * @example
 * ```typescript
 * import { incrementCounter, setGauge, observeHistogram, exportMetrics } from '@tinyland-inc/tinyland-prometheus';
 *
 * incrementCounter('http_requests_total', { method: 'GET', status: '200' });
 * setGauge('active_connections', 42);
 * observeHistogram('request_duration_seconds', 0.123);
 *
 * const prometheusText = exportMetrics();
 * ```
 */

// Re-export types
export type { Metric, HistogramBucket, HistogramMetric } from './types.js';

// Re-export the class
export { MetricsRegistry } from './registry.js';

// Import for singleton creation
import { MetricsRegistry } from './registry.js';

/**
 * Global singleton registry instance.
 */
export const metricsRegistry = new MetricsRegistry();

/**
 * Increment a counter metric on the global registry.
 *
 * @param name - The metric name
 * @param labels - Optional label key-value pairs
 * @param value - The amount to increment by
 */
export function incrementCounter(name: string, labels?: Record<string, string>, value?: number): void {
  metricsRegistry.incrementCounter(name, labels, value);
}

/**
 * Set a gauge metric on the global registry.
 *
 * @param name - The metric name
 * @param value - The gauge value
 * @param labels - Optional label key-value pairs
 */
export function setGauge(name: string, value: number, labels?: Record<string, string>): void {
  metricsRegistry.setGauge(name, value, labels);
}

/**
 * Record a histogram observation on the global registry.
 *
 * @param name - The metric name
 * @param value - The observed value
 * @param buckets - Optional bucket boundaries
 * @param labels - Optional label key-value pairs
 */
export function observeHistogram(
  name: string,
  value: number,
  buckets?: number[],
  labels?: Record<string, string>
): void {
  metricsRegistry.observeHistogram(name, value, buckets, labels);
}

/**
 * Export all metrics from the global registry in Prometheus text format.
 *
 * @returns A string in Prometheus text exposition format
 */
export function exportMetrics(): string {
  return metricsRegistry.export();
}

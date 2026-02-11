/**
 * Prometheus Metrics Type Definitions
 *
 * Core type interfaces for the Prometheus-compatible metrics registry.
 */

/**
 * Base metric descriptor.
 */
export interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number | Map<string, number>;
  labels?: Record<string, string>;
}

/**
 * A single histogram bucket boundary and its observation count.
 */
export interface HistogramBucket {
  le: number;
  count: number;
}

/**
 * Internal representation of a histogram metric with buckets, sum, and count.
 */
export interface HistogramMetric {
  name: string;
  help: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
  labels?: Record<string, string>;
}

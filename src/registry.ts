/**
 * Prometheus Metrics Registry
 *
 * Provides a Prometheus-compatible metrics registry supporting counters,
 * gauges, and histograms. Metrics are exported in the Prometheus text
 * exposition format for scraping by a Prometheus server.
 */

import type { HistogramMetric } from './types.js';

/**
 * In-memory metrics registry that tracks counters, gauges, and histograms
 * and exports them in Prometheus text exposition format.
 */
export class MetricsRegistry {
  private counters = new Map<string, Map<string, number>>();
  private gauges = new Map<string, Map<string, number>>();
  private histograms = new Map<string, HistogramMetric>();

  /**
   * Increment a counter metric.
   *
   * @param name - The metric name
   * @param labels - Optional label key-value pairs
   * @param value - The amount to increment by (default: 1)
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const labelKey = this.getLabelKey(labels);

    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }

    const current = this.counters.get(name)!.get(labelKey) || 0;
    this.counters.get(name)!.set(labelKey, current + value);
  }

  /**
   * Set a gauge metric to a specific value.
   *
   * @param name - The metric name
   * @param value - The gauge value
   * @param labels - Optional label key-value pairs
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelKey = this.getLabelKey(labels);

    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Map());
    }

    this.gauges.get(name)!.set(labelKey, value);
  }

  /**
   * Record a histogram observation.
   *
   * @param name - The metric name
   * @param value - The observed value
   * @param buckets - Bucket boundaries (default: standard Prometheus buckets)
   * @param labels - Optional label key-value pairs
   */
  observeHistogram(
    name: string,
    value: number,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    labels: Record<string, string> = {}
  ): void {
    const labelKey = this.getLabelKey(labels);
    const metricKey = `${name}_${labelKey}`;

    if (!this.histograms.has(metricKey)) {
      this.histograms.set(metricKey, {
        name,
        help: '',
        buckets: buckets.map(le => ({ le, count: 0 })),
        sum: 0,
        count: 0,
        labels
      });
    }

    const histogram = this.histograms.get(metricKey)!;
    histogram.sum += value;
    histogram.count += 1;

    // Update bucket counts
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count += 1;
      }
    }
  }

  /**
   * Generate a label key for internal storage. Keys are sorted for consistency.
   */
  private getLabelKey(labels: Record<string, string>): string {
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(key => `${key}="${labels[key]}"`).join(',');
  }

  /**
   * Format labels for Prometheus text output.
   */
  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }

  /**
   * Export all metrics in Prometheus text exposition format.
   *
   * @returns A string in Prometheus text format
   */
  export(): string {
    const lines: string[] = [];

    // Export counters
    this.counters.forEach((labelMap, name) => {
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`# TYPE ${name} counter`);

      labelMap.forEach((value, labelKey) => {
        const labels = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}${labels} ${value}`);
      });
      lines.push('');
    });

    // Export gauges
    this.gauges.forEach((labelMap, name) => {
      lines.push(`# HELP ${name} Gauge metric`);
      lines.push(`# TYPE ${name} gauge`);

      labelMap.forEach((value, labelKey) => {
        const labels = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}${labels} ${value}`);
      });
      lines.push('');
    });

    // Export histograms
    this.histograms.forEach((histogram) => {
      const labelsStr = this.formatLabels(histogram.labels || {});

      lines.push(`# HELP ${histogram.name} Histogram metric`);
      lines.push(`# TYPE ${histogram.name} histogram`);

      // Bucket counts
      for (const bucket of histogram.buckets) {
        const bucketLabels = labelsStr
          ? `${labelsStr.slice(0, -1)},le="${bucket.le}"}`
          : `{le="${bucket.le}"}`;
        lines.push(`${histogram.name}_bucket${bucketLabels} ${bucket.count}`);
      }

      // +Inf bucket
      const infLabels = labelsStr
        ? `${labelsStr.slice(0, -1)},le="+Inf"}`
        : `{le="+Inf"}`;
      lines.push(`${histogram.name}_bucket${infLabels} ${histogram.count}`);

      // Sum and count
      lines.push(`${histogram.name}_sum${labelsStr} ${histogram.sum}`);
      lines.push(`${histogram.name}_count${labelsStr} ${histogram.count}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Reset all metrics, clearing counters, gauges, and histograms.
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

#!/usr/bin/env sh
set -eu

DURATION_MINUTES=${1:-60}
INTERVAL_SECONDS=${2:-60}
OUTPUT_FILE=${3:-./reports/memory_monitor.log}

mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "timestamp,container,name,cpu_percent,mem_usage,mem_percent" > "$OUTPUT_FILE"

end_epoch=$(( $(date +%s) + DURATION_MINUTES * 60 ))

while [ "$(date +%s)" -lt "$end_epoch" ]; do
  timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" | while IFS= read -r line; do
    echo "$timestamp,$line" >> "$OUTPUT_FILE"
  done
  sleep "$INTERVAL_SECONDS"
done

echo "Memory monitor report: $OUTPUT_FILE"

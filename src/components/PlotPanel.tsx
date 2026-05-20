import { useEffect, useRef } from "react";

export interface Trace {
  x: number[];
  y: Array<number | null>;
  name: string;
  color: string;
  mode?: "lines" | "lines+markers" | "markers";
  fill?: "tozeroy";
  fillColor?: string;
  dash?: "solid" | "dot" | "dash";
  width?: number;
}

export interface MarkerPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
}

interface PlotPanelProps {
  traces: Trace[];
  title?: string;
  markers?: MarkerPoint[];
  height?: number;
  xTitle?: string;
  yTitle?: string;
  equalAspect?: boolean;
  variant?: "analysis" | "integral" | "complex" | "sequence";
  showEndLabels?: boolean;
}

type Range = [number, number];

export function PlotPanel({
  traces,
  title,
  markers = [],
  height = 390,
  xTitle = "x",
  yTitle = "y",
  equalAspect = false,
  variant = "analysis",
  showEndLabels = true
}: PlotPanelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function render() {
      if (!ref.current) return;
      const { default: Plotly } = await import("plotly.js-dist-min");
      if (!active || !ref.current) return;

      const ranges = computeRanges(traces, markers, equalAspect);
      const data: any[] = traces.flatMap((trace) => buildTraceLayers(trace, xTitle, yTitle));

      if (markers.length) {
        data.push({
          x: markers.map((point) => point.x),
          y: markers.map((point) => point.y),
          type: "scatter",
          mode: "markers",
          name: "Punkthalo",
          showlegend: false,
          hoverinfo: "skip",
          marker: {
            color: markers.map((point) => toRgba(point.color ?? "#8b1e3f", 0.18)),
            size: 22,
            line: { color: "rgba(255,255,255,0)", width: 0 }
          }
        });
        data.push({
          x: markers.map((point) => point.x),
          y: markers.map((point) => point.y),
          type: "scatter",
          mode: "markers+text",
          name: "markierte Punkte",
          text: markers.map((point) => point.label),
          textposition: "top center",
          line: { color: "#8b1e3f", width: 0 },
          marker: {
            color: markers.map((point) => point.color ?? "#8b1e3f"),
            size: 10,
            line: { color: "#ffffff", width: 2 }
          },
          hovertemplate: `<b>%{text}</b><br>${xTitle}=%{x:.5g}<br>${yTitle}=%{y:.5g}<extra></extra>`
        });
      }

      const annotations = [
        ...axisAnnotations(ranges.x, ranges.y),
        ...(showEndLabels ? endLabelAnnotations(traces, ranges.x, ranges.y) : [])
      ];

      const layout = {
        title: title ? { text: title, font: { size: 15, color: "#132033", family: "Georgia, 'Times New Roman', serif" }, x: 0.02 } : undefined,
        height,
        margin: { l: 62, r: 42, t: title ? 58 : 30, b: 62 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(255,255,255,0.74)",
        font: { family: "Inter, system-ui, sans-serif", color: "#263247" },
        hovermode: "closest",
        dragmode: "pan",
        uirevision: "mathchem-plot",
        shapes: axisShapes(ranges.x, ranges.y),
        xaxis: {
          title: xTitle,
          range: ranges.x,
          showgrid: true,
          zeroline: false,
          gridcolor: "#dbe4ef",
          griddash: "dot",
          linecolor: "rgba(9,33,63,0)",
          linewidth: 0,
          mirror: false,
          ticks: "outside",
          tickcolor: "#a8b2c0",
          ticklen: 4,
          tickfont: { size: 11, color: "#607086" },
          titlefont: { size: 12, color: "#344256" },
          showspikes: true,
          spikemode: "across",
          spikesnap: "cursor",
          spikecolor: "rgba(139, 30, 63, 0.34)",
          spikethickness: 1,
          minor: {
            showgrid: true,
            gridcolor: "rgba(216, 224, 235, 0.54)",
            griddash: "dot"
          }
        },
        yaxis: {
          title: yTitle,
          range: ranges.y,
          showgrid: true,
          zeroline: false,
          gridcolor: "#dbe4ef",
          griddash: "dot",
          linecolor: "rgba(9,33,63,0)",
          linewidth: 0,
          mirror: false,
          ticks: "outside",
          tickcolor: "#a8b2c0",
          ticklen: 4,
          tickfont: { size: 11, color: "#607086" },
          titlefont: { size: 12, color: "#344256" },
          showspikes: true,
          spikemode: "across",
          spikesnap: "cursor",
          spikecolor: "rgba(139, 30, 63, 0.34)",
          spikethickness: 1,
          scaleanchor: equalAspect ? "x" : undefined,
          scaleratio: equalAspect ? 1 : undefined,
          minor: {
            showgrid: true,
            gridcolor: "rgba(216, 224, 235, 0.54)",
            griddash: "dot"
          }
        },
        legend: {
          orientation: "h",
          y: -0.24,
          x: 0.01,
          font: { size: 12, color: "#435168" },
          bgcolor: "rgba(255,255,255,0.74)",
          bordercolor: "rgba(196,207,221,0.65)",
          borderwidth: 1
        },
        annotations
      };

      const config = {
        responsive: true,
        scrollZoom: true,
        displaylogo: false,
        toImageButtonOptions: {
          format: "svg",
          filename: "mathchem-plot",
          height,
          width: 980,
          scale: 1
        },
        modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d", "toggleSpikelines"]
      };

      await Plotly.react(ref.current, data, layout, config);
    }

    render();
    return () => {
      active = false;
      if (ref.current) {
        import("plotly.js-dist-min").then(({ default: Plotly }) => {
          if (ref.current) Plotly.purge(ref.current);
        });
      }
    };
  }, [equalAspect, height, markers, showEndLabels, title, traces, xTitle, yTitle]);

  return <div className={`plot-panel plot-panel--${variant}`} ref={ref} aria-label={title ?? "Interaktiver Plot"} />;
}

function buildTraceLayers(trace: Trace, xTitle: string, yTitle: string): any[] {
  const mode = trace.mode ?? "lines";
  const width = trace.width ?? 2.8;
  const base = {
    x: trace.x,
    y: trace.y,
    type: "scatter",
    mode,
    name: trace.name,
    connectgaps: false
  };
  const layers: any[] = [];

  if (mode.includes("lines")) {
    layers.push({
      ...base,
      name: `${trace.name} Glanz`,
      showlegend: false,
      hoverinfo: "skip",
      line: { color: toRgba(trace.color, trace.fill ? 0.1 : 0.18), width: width + 6, dash: trace.dash ?? "solid" }
    });
  }

  layers.push({
    ...base,
    line: { color: trace.color, width, dash: trace.dash ?? "solid" },
    marker: { color: trace.color, size: mode === "lines+markers" ? 6.5 : 7, line: { color: "#ffffff", width: 1.2 } },
    fill: trace.fill,
    fillcolor: trace.fillColor,
    hovertemplate: `<b>${trace.name}</b><br>${xTitle}=%{x:.5g}<br>${yTitle}=%{y:.5g}<extra></extra>`
  });

  return layers;
}

function computeRanges(traces: Trace[], markers: MarkerPoint[], equalAspect: boolean): { x: Range; y: Range } {
  const xs: number[] = [];
  const ys: number[] = [];

  traces.forEach((trace) => {
    trace.x.forEach((x, index) => {
      const y = trace.y[index];
      if (Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
        xs.push(x);
        ys.push(y);
      }
    });
  });
  markers.forEach((marker) => {
    if (Number.isFinite(marker.x) && Number.isFinite(marker.y)) {
      xs.push(marker.x);
      ys.push(marker.y);
    }
  });

  let xRange = paddedRange(xs, [-1, 1], equalAspect ? 0.16 : 0.08);
  let yRange = paddedRange(ys, [-1, 1], equalAspect ? 0.16 : 0.12);

  if (equalAspect) {
    const xMid = (xRange[0] + xRange[1]) / 2;
    const yMid = (yRange[0] + yRange[1]) / 2;
    const half = Math.max((xRange[1] - xRange[0]) / 2, (yRange[1] - yRange[0]) / 2, 1);
    xRange = [xMid - half, xMid + half];
    yRange = [yMid - half, yMid + half];
  }

  return { x: xRange, y: yRange };
}

function paddedRange(values: number[], fallback: Range, paddingRatio: number): Range {
  if (!values.length) return fallback;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (Math.abs(max - min) < 1e-9) {
    const width = Math.max(Math.abs(max), 1);
    min -= width;
    max += width;
  }
  const padding = Math.max((max - min) * paddingRatio, 0.08);
  return [min - padding, max + padding];
}

function axisShapes(xRange: Range, yRange: Range) {
  const shapes: any[] = [];
  if (isInRange(0, yRange)) {
    shapes.push({
      type: "line",
      xref: "x",
      yref: "y",
      x0: xRange[0],
      x1: xRange[1],
      y0: 0,
      y1: 0,
      layer: "below",
      line: { color: "rgba(96,112,134,0.82)", width: 1.45 }
    });
  }
  if (isInRange(0, xRange)) {
    shapes.push({
      type: "line",
      xref: "x",
      yref: "y",
      x0: 0,
      x1: 0,
      y0: yRange[0],
      y1: yRange[1],
      layer: "below",
      line: { color: "rgba(96,112,134,0.82)", width: 1.45 }
    });
  }
  return shapes;
}

function axisAnnotations(xRange: Range, yRange: Range) {
  const annotations: any[] = [];
  if (isInRange(0, yRange)) {
    annotations.push({
      xref: "x",
      yref: "y",
      x: xRange[1],
      y: 0,
      ax: -30,
      ay: 0,
      text: "",
      showarrow: true,
      arrowhead: 3,
      arrowsize: 1,
      arrowwidth: 1.45,
      arrowcolor: "#607086"
    });
  }
  if (isInRange(0, xRange)) {
    annotations.push({
      xref: "x",
      yref: "y",
      x: 0,
      y: yRange[1],
      ax: 0,
      ay: 30,
      text: "",
      showarrow: true,
      arrowhead: 3,
      arrowsize: 1,
      arrowwidth: 1.45,
      arrowcolor: "#607086"
    });
  }
  return annotations;
}

function endLabelAnnotations(traces: Trace[], xRange: Range, yRange: Range) {
  return traces
    .filter((trace) => (trace.mode ?? "lines").includes("lines") && !trace.fill)
    .slice(0, 4)
    .map((trace) => {
      const point = lastVisiblePoint(trace, xRange, yRange);
      if (!point) return null;
      return {
        xref: "x",
        yref: "y",
        x: point.x,
        y: point.y,
        text: trace.name,
        showarrow: false,
        xanchor: "left",
        yanchor: "middle",
        xshift: 8,
        font: { size: 11, color: trace.color },
        bgcolor: "rgba(255,255,255,0.82)",
        bordercolor: toRgba(trace.color, 0.28),
        borderwidth: 1,
        borderpad: 3
      };
    })
    .filter(Boolean);
}

function lastVisiblePoint(trace: Trace, xRange: Range, yRange: Range): { x: number; y: number } | null {
  for (let index = trace.x.length - 1; index >= 0; index -= 1) {
    const x = trace.x[index];
    const y = trace.y[index];
    if (Number.isFinite(x) && typeof y === "number" && Number.isFinite(y) && isInRange(x, xRange) && isInRange(y, yRange)) {
      return { x, y };
    }
  }
  return null;
}

function isInRange(value: number, range: Range) {
  return value >= range[0] && value <= range[1];
}

function toRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

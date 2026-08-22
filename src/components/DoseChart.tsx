"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint } from "@/lib/pharmacology/types";

interface ExtendedChartDataPoint extends ChartDataPoint {
  dilutedDose?: number;
  isSource?: boolean;
}

interface DotProps {
  cx: number;
  cy: number;
  payload: ExtendedChartDataPoint;
  index: number;
}

interface DoseChartProps {
  chartData: ExtendedChartDataPoint[];
  scalingMethod: string;
  isDarkMode: boolean;
}

/**
 * Abbreviate long species names so categorical axis ticks fit without overlap.
 */
const abbreviateSpecies = (name: string) => {
  if (name === "Cynomolgus Monkey") return "Cyno";
  if (name === "Rhesus Macaque") return "Rhesus";
  if (name === "Guinea Pig") return "G.Pig";
  return name;
};

/**
 * Theme-aware color palette for chart elements
 * Uses CSS custom property values converted to HSL for consistency with design system
 */
const getChartColors = (isDarkMode: boolean) => ({
  // Primary accent color (matches --accent CSS variable)
  accent: isDarkMode ? "hsl(28, 88%, 60%)" : "hsl(28, 86%, 52%)",
  // Secondary/muted color for secondary lines
  secondary: isDarkMode ? "hsl(0, 0%, 62%)" : "hsl(0, 0%, 35%)",
  // Text/tick color (matches --foreground CSS variable)
  text: isDarkMode ? "hsl(0, 0%, 92%)" : "hsl(0, 0%, 8%)",
  // Background for tooltip (matches --card CSS variable)
  tooltipBg: isDarkMode ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 100%)",
  // Border for tooltip (matches --border CSS variable)
  tooltipBorder: isDarkMode ? "hsl(0, 0%, 18%)" : "hsl(0, 0%, 78%)",
  // Grid color
  grid: isDarkMode ? "hsl(0, 0%, 20%)" : "hsl(0, 0%, 88%)",
});

export const DoseChart: React.FC<DoseChartProps> = React.memo(
  ({ chartData, scalingMethod, isDarkMode }) => {
    // Memoize colors to avoid recalculating on every render
    const colors = useMemo(() => getChartColors(isDarkMode), [isDarkMode]);

    // One point per species, ordered by body weight, keyed by species name.
    // Keying the X-axis on the species name (rather than weight) keeps species
    // that share a weight — e.g. Human and Pig at 70 kg, or Monkey and
    // Cynomolgus Monkey at 5 kg — as distinct, separately labelled points.
    const speciesData = useMemo(
      () =>
        chartData
          .filter((d) => d.isAnimal && d.label)
          .sort((a, b) => a.weight - b.weight),
      [chartData],
    );

    // Generate accessible description for the chart
    const chartDescription = `Dose scaling chart showing calculated doses across different species using ${scalingMethod} scaling method. The chart displays dose values in milligrams per kilogram on the Y-axis against species (ordered by increasing body weight) on the X-axis.`;

    return (
      <Card className="min-h-[700px]">
        <CardHeader>
          <CardTitle id="dose-chart-title">Dose Scaling Chart</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizing dose scaling across species by body weight
          </p>
        </CardHeader>
        <CardContent className="w-full h-[600px]">
          <div
            role="img"
            aria-labelledby="dose-chart-title"
            aria-describedby="dose-chart-desc"
            className="w-full h-full"
          >
            <p id="dose-chart-desc" className="sr-only">
              {chartDescription}
              {chartData.filter((d) => d.isAnimal).length > 0 &&
                ` Data points include: ${chartData
                  .filter((d) => d.isAnimal && d.label)
                  .map(
                    (d) =>
                      `${d.label}: ${d.dose.toFixed(2)} mg/kg at ${d.weight} kg`,
                  )
                  .join("; ")}.`}
            </p>
            {/* Accessible data table for screen readers - visually hidden */}
            <table
              className="sr-only"
              aria-label="Dose scaling data in tabular format"
            >
              <caption>
                Dose values for each species using {scalingMethod} scaling
              </caption>
              <thead>
                <tr>
                  <th scope="col">Species</th>
                  <th scope="col">Weight (kg)</th>
                  <th scope="col">Dose (mg/kg)</th>
                  {chartData.some((d) => d.dilutedDose !== undefined) && (
                    <th scope="col">Diluted Dose (mg/kg)</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {chartData
                  .filter((d) => d.isAnimal && d.label)
                  .map((d, i) => (
                    <tr key={i}>
                      <td>{d.label}</td>
                      <td>{d.weight.toFixed(3)}</td>
                      <td>{d.dose.toFixed(4)}</td>
                      {d.dilutedDose !== undefined &&
                        d.dilutedDose !== null && (
                          <td>{d.dilutedDose.toFixed(4)}</td>
                        )}
                    </tr>
                  ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={speciesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis
                  dataKey="label"
                  type="category"
                  tickFormatter={(value: string) => abbreviateSpecies(value)}
                  tick={{
                    fill: colors.text,
                    fontSize: 10,
                    textAnchor: "end",
                  }}
                  angle={-45}
                  dy={15}
                  dx={-10}
                  height={80}
                  interval={0}
                />
                <YAxis
                  type="number"
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `${value.toFixed(1)} mg/kg`}
                  tick={{
                    fill: colors.text,
                    fontSize: 12,
                  }}
                  interval={0}
                  minTickGap={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  itemStyle={{
                    color: colors.text,
                    fontSize: "0.875rem",
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(2)} mg/kg`,
                    "Dose",
                  ]}
                  labelFormatter={(label: string) => {
                    const point = speciesData.find((p) => p.label === label);
                    return point
                      ? `${point.label} (${point.weight.toFixed(2)} kg)`
                      : String(label);
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "1rem",
                  }}
                  height={36}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  dataKey="dose"
                  stroke={colors.accent}
                  strokeWidth={2}
                  name={`${scalingMethod.charAt(0).toUpperCase() + scalingMethod.slice(1)} Scaling`}
                  dot={(props: DotProps): React.ReactElement<SVGElement> => {
                    const { cx, cy, payload, index } = props;
                    return (
                      <circle
                        key={`dot-${index}-${payload.weight}`}
                        cx={cx}
                        cy={cy}
                        r={payload.isAnimal ? 4 : 0}
                        fill={colors.accent}
                        stroke={colors.tooltipBg}
                        strokeWidth={payload.isSource ? 2 : 0}
                      />
                    );
                  }}
                />
                {speciesData.some(
                  (d) => d.dilutedDose !== undefined && d.dilutedDose !== null,
                ) && (
                  <Line
                    dataKey="dilutedDose"
                    stroke={colors.secondary}
                    strokeWidth={2}
                    name="Diluted Dose"
                    strokeDasharray="5 5"
                    dot={(props: DotProps): React.ReactElement<SVGElement> => {
                      const { cx, cy, payload, index } = props;
                      return (
                        <circle
                          key={`dot-diluted-${index}-${payload.weight}`}
                          cx={cx}
                          cy={cy}
                          r={payload.isAnimal ? 4 : 0}
                          fill={colors.secondary}
                          stroke={colors.tooltipBg}
                          strokeWidth={payload.isSource ? 2 : 0}
                        />
                      );
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

// Set display name for debugging
DoseChart.displayName = "DoseChart";

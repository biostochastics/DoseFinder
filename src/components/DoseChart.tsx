"use client";

import React from "react";
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
import { Species, ChartDataPoint } from "@/lib/pharmacology/types";

interface ExtendedChartDataPoint extends ChartDataPoint {
  dilutedDose?: number;
  isSource?: boolean;
}

interface DotProps {
  cx: number;
  cy: number;
  payload: ExtendedChartDataPoint;
}

interface DoseChartProps {
  chartData: ExtendedChartDataPoint[];
  animals: Record<string, Species>;
  scalingMethod: string;
  isDarkMode: boolean;
}

export const DoseChart: React.FC<DoseChartProps> = React.memo(
  ({ chartData, animals, scalingMethod, isDarkMode }) => {
    const accentColor = isDarkMode ? "#f4a259" : "#b45309";
    const secondaryLineColor = isDarkMode ? "#a1a1aa" : "#4b5563";

    // Generate accessible description for the chart
    const chartDescription = `Dose scaling chart showing calculated doses across different species weights using ${scalingMethod} scaling method. The chart displays dose values in milligrams on the Y-axis against body weight in kilograms on the X-axis using a logarithmic scale.`;

    return (
      <Card className="min-h-[700px] mb-6">
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
                      `${d.label}: ${d.dose.toFixed(2)} mg at ${d.weight} kg`,
                  )
                  .join("; ")}.`}
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="weight"
                  type="number"
                  scale="log"
                  domain={[0.01, 1000]}
                  allowDuplicatedCategory={true}
                  ticks={chartData
                    .filter((point) => point.isAnimal)
                    .map((point) => point.weight)}
                  tickFormatter={(value) => {
                    const animal = Object.entries(animals).find(
                      ([, data]) => Math.abs(data.weight - value) < 1e-10,
                    );
                    if (animal) {
                      // Abbreviate long species names for better fit
                      const name = animal[1].name;
                      if (name === "Cynomolgus Monkey") return "Cynomolgus";
                      if (name === "Rhesus Macaque") return "Rhesus";
                      if (name === "Guinea Pig") return "Guinea Pig";
                      return name;
                    }

                    const point = chartData.find(
                      (p) => p.isAnimal && Math.abs(p.weight - value) < 1e-10,
                    );
                    return point?.label || value.toExponential(1);
                  }}
                  tick={{
                    fill: isDarkMode ? "#e2e8f0" : "#1e293b",
                    fontSize: 10,
                    textAnchor: "end",
                    transform: "rotate(-45)",
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
                  tickFormatter={(value) => `${value.toFixed(1)} mg`}
                  tick={{
                    fill: isDarkMode ? "#e2e8f0" : "#1e293b",
                    fontSize: 12,
                  }}
                  interval={0}
                  minTickGap={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                    border: isDarkMode
                      ? "1px solid #475569"
                      : "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  itemStyle={{
                    color: isDarkMode ? "#e2e8f0" : "#1e293b",
                    fontSize: "0.875rem",
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(2)} mg`,
                    "Dose",
                  ]}
                  labelFormatter={(weight: number) => {
                    const point = chartData.find((p) => {
                      return p.isAnimal && Math.abs(p.weight - weight) < 1e-10;
                    });
                    return `Weight: ${weight.toFixed(2)} kg${point?.label ? ` (${point.label})` : ""}`;
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
                  stroke={accentColor}
                  strokeWidth={2}
                  name={`${scalingMethod.charAt(0).toUpperCase() + scalingMethod.slice(1)} Scaling`}
                  dot={(props: DotProps): React.ReactElement<SVGElement> => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${payload.name}`}
                        cx={cx}
                        cy={cy}
                        r={payload.isAnimal ? 4 : 0}
                        fill={accentColor}
                        stroke="#fff"
                        strokeWidth={payload.isSource ? 2 : 0}
                      />
                    );
                  }}
                />
                {chartData.some((d) => d.dilutedDose) && (
                  <Line
                    dataKey="dilutedDose"
                    stroke={secondaryLineColor}
                    strokeWidth={2}
                    name="Diluted Dose"
                    strokeDasharray="5 5"
                    dot={(props: DotProps): React.ReactElement<SVGElement> => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          key={`dot-diluted-${payload.name}`}
                          cx={cx}
                          cy={cy}
                          r={payload.isAnimal ? 4 : 0}
                          fill={secondaryLineColor}
                          stroke="#fff"
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

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
import { Animal } from "@/lib/pharmacology/types";

interface DoseChartProps {
  chartData: any[];
  animals: Record<string, Animal>;
  scalingMethod: string;
  isDarkMode: boolean;
}

export const DoseChart: React.FC<DoseChartProps> = ({
  chartData,
  animals,
  scalingMethod,
  isDarkMode,
}) => {
  return (
    <Card className="min-h-[700px] mb-6">
      <CardHeader>
        <CardTitle>Dose Scaling Chart</CardTitle>
      </CardHeader>
      <CardContent className="w-full h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                if (animal) return animal[1].name;

                const point = chartData.find(
                  (p) => p.isAnimal && Math.abs(p.weight - value) < 1e-10,
                );
                return point?.label || value.toExponential(1);
              }}
              tick={{
                fill: isDarkMode ? "#e2e8f0" : "#1e293b",
                fontSize: 12,
                textAnchor: "end",
                transform: "rotate(-45)",
              }}
              angle={-45}
              dy={15}
              dx={-10}
              height={60}
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
                border: isDarkMode ? "1px solid #475569" : "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
              itemStyle={{
                color: isDarkMode ? "#e2e8f0" : "#1e293b",
                fontSize: "0.875rem",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} mg`, "Dose"]}
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
              stroke="#f97316"
              strokeWidth={2}
              name={`${scalingMethod.charAt(0).toUpperCase() + scalingMethod.slice(1)} Scaling`}
              dot={(props: any): React.ReactElement<SVGElement> => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.name}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isAnimal ? 4 : 0}
                    fill="#f97316"
                    stroke="#fff"
                    strokeWidth={payload.isSource ? 2 : 0}
                  />
                );
              }}
            />
            {chartData.some((d) => d.dilutedDose) && (
              <Line
                dataKey="dilutedDose"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Diluted Dose"
                strokeDasharray="5 5"
                dot={(props: any): React.ReactElement<SVGElement> => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      key={`dot-diluted-${payload.name}`}
                      cx={cx}
                      cy={cy}
                      r={payload.isAnimal ? 4 : 0}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={payload.isSource ? 2 : 0}
                    />
                  );
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

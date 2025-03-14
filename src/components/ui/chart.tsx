
import React from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  TooltipProps,
} from "recharts";

// Shared props for all chart types
interface BaseChartProps {
  data: any[];
  className?: string;
}

// Props for categorical charts (Bar and Line)
interface CategoricalChartProps extends BaseChartProps {
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: any) => any;
  yAxisWidth?: number;
}

// Props for pie charts
interface PieChartProps extends BaseChartProps {
  category: string;
  index: string;
  colors: string[];
  valueFormatter?: (value: any) => any;
}

// A custom tooltip component for charts
const CustomTooltip = ({ active, payload, label, formatter }: TooltipProps<any, any> & { formatter?: (value: any) => any }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Bar Chart Component
export const BarChart = ({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => value,
  yAxisWidth = 60,
  className,
}: CategoricalChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            width={yAxisWidth}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={valueFormatter}
          />
          <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {categories.map((category, i) => (
            <Bar
              key={`bar-${category}`}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Line Chart Component
export const LineChart = ({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => value,
  yAxisWidth = 60,
  className,
}: CategoricalChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            width={yAxisWidth}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={valueFormatter}
          />
          <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {categories.map((category, i) => (
            <Line
              key={`line-${category}`}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({
  data,
  category,
  index,
  colors,
  valueFormatter = (value) => value,
  className,
}: PieChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            dataKey={category}
            nameKey={index}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }} 
            formatter={(value) => <span>{value}</span>}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

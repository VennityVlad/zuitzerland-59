
import { Invoice } from "@/types/invoice";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface StatusDistributionProps {
  invoices: Invoice[];
  showRoomTypeRevenue?: boolean;
  showStatusRevenue?: boolean;
}

export const StatusDistribution = ({ 
  invoices, 
  showRoomTypeRevenue = false,
  showStatusRevenue = false 
}: StatusDistributionProps) => {
  if (showRoomTypeRevenue) {
    // Group and sum by room type
    const roomTypeMap = invoices.reduce((acc, invoice) => {
      const roomType = invoice.room_type;
      if (!acc[roomType]) {
        acc[roomType] = 0;
      }
      acc[roomType] += invoice.price;
      return acc;
    }, {} as Record<string, number>);

    const roomTypeData = Object.entries(roomTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2'];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={roomTypeData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `CHF ${value.toFixed(0)}`} />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip formatter={(value) => [`CHF ${Number(value).toFixed(2)}`, 'Revenue']} />
          <Legend />
          <Bar dataKey="value" name="Revenue" fill="#8884d8">
            {roomTypeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (showStatusRevenue) {
    // Group and sum by status
    const statusMap = invoices.reduce((acc, invoice) => {
      const status = invoice.status;
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += invoice.price;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusMap)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        value 
      }))
      .sort((a, b) => b.value - a.value);

    const COLORS = {
      'Paid': '#22c55e',
      'Pending': '#eab308',
      'Overdue': '#ef4444',
      'Cancelled': '#6b7280'
    };

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={statusData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `CHF ${value.toFixed(0)}`} />
          <YAxis dataKey="name" type="category" width={80} />
          <Tooltip formatter={(value) => [`CHF ${Number(value).toFixed(2)}`, 'Revenue']} />
          <Legend />
          <Bar dataKey="value" name="Revenue">
            {statusData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: status distribution pie chart
  const statusCounts = invoices.reduce((acc, invoice) => {
    const status = invoice.status;
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status]++;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
    value
  }));

  const COLORS = {
    'Paid': '#22c55e',
    'Pending': '#eab308',
    'Overdue': '#ef4444',
    'Cancelled': '#6b7280'
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Invoices']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

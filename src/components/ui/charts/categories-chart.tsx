import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoriesChartProps {
  data: CategoryData[];
  averageRating?: number;
}

const CategoriesChart: React.FC<CategoriesChartProps> = ({ data, averageRating = 0 }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-blue-600">
            {data.value} کتاب ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const totalBooks = data.reduce((sum, item) => sum + item.count, 0);

  const COLORS = data.map(item => item.color);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 text-right mb-2">دسته‌بندی مطالعه</h3>
        <div className="text-center text-sm text-gray-600">
          <span className="font-semibold">مجموع: {totalBooks} کتاب</span>
          {averageRating > 0 && (
            <>
              <span className="mx-2">•</span>
              <span className="font-semibold">میانگین امتیاز: {averageRating.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }: any) => `${name} ${(percentage as number * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoriesChart;



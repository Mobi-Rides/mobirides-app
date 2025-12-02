type Props = { data: any[] };

export const AnalyticsCharts = ({ data }: Props) => {
  return (
    <div className="p-4 border rounded-md">
      <div className="font-medium">Analytics</div>
      <div className="text-sm text-muted-foreground">{data.length} rows</div>
    </div>
  );
};


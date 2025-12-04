type Props = { events: any[] };

export const SecurityMonitor = ({ events }: Props) => {
  return (
    <div className="p-4 border rounded-md space-y-2">
      <div className="font-medium">Security Events</div>
      {events.map((e, i) => (
        <div key={i} className="text-xs flex justify-between">
          <span>{e.event_type}</span>
          <span className="font-medium">{e.severity}</span>
        </div>
      ))}
    </div>
  );
};


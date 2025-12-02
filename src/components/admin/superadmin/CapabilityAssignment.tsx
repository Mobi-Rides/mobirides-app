type Props = {
  onAdd: (capability: string) => void;
};

export const CapabilityAssignment = ({ onAdd }: Props) => {
  return (
    <div className="flex gap-2">
      <input className="border rounded-md p-2 text-sm flex-1" placeholder="Capability" />
      <button className="border rounded-md p-2 text-sm" onClick={() => onAdd("manage_payments")}>Add</button>
    </div>
  );
};


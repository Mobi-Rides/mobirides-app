type Props = {
  onAssign: (role: string) => void;
};

export const BulkUserActions = ({ onAssign }: Props) => {
  return (
    <div className="flex gap-2">
      <select className="border rounded-md p-2 text-sm" onChange={(e) => onAssign(e.target.value)}>
        <option value="renter">Assign Renter</option>
        <option value="host">Assign Host</option>
        <option value="admin">Assign Admin</option>
        <option value="super_admin">Assign Super Admin</option>
      </select>
    </div>
  );
};


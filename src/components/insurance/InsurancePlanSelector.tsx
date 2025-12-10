import { useEffect, useState } from "react";
import { listActivePlans, calculatePremium } from "@/services/insuranceService";

type Plan = Awaited<ReturnType<typeof listActivePlans>>[number];

type Props = {
  basePrice: number;
  onSelected: (plan: Plan | null, premium: number | null) => void;
};

export const InsurancePlanSelector = ({ basePrice, onSelected }: Props) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [premium, setPremium] = useState<number | null>(null);

  useEffect(() => {
    listActivePlans().then(setPlans);
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!selected) {
        setPremium(null);
        onSelected(null, null);
        return;
      }
      const p = await calculatePremium(basePrice, selected);
      if (active) {
        setPremium(p);
        onSelected(selected, p);
      }
    };
    run();
    return () => { active = false; };
  }, [selected, basePrice, onSelected]);

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Insurance</h4>
      <div className="grid gap-2">
        <select
          className="border rounded-md p-2 text-sm"
          value={selected?.id ?? ""}
          onChange={(e) => {
            const p = plans.find(x => x.id === e.target.value) ?? null;
            setSelected(p);
          }}
        >
          <option value="">No insurance</option>
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selected && premium !== null && (
          <div className="text-xs text-muted-foreground">
            Premium: BWP {premium.toFixed(2)} ({selected.coverage_percentage}% coverage)
          </div>
        )}
      </div>
    </div>
  );
};


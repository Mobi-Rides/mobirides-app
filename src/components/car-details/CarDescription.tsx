interface CarDescriptionProps {
  description: string | null;
}

export const CarDescription = ({ description }: CarDescriptionProps) => {
  if (!description) return null;
  
  return (
    <div>
      <h2 className="font-semibold mb-2">Description</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
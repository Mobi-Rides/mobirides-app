import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageSquare, Clock, Flag, TrendingUp, AlertTriangle } from "lucide-react";

interface ReviewStats {
  totalReviews: number;
  avgRating: string;
  pendingModeration: number;
  flaggedReviews: number;
  reviewRate: string;
  thisMonthReviews: number;
}

interface ReviewStatsCardsProps {
  stats: ReviewStats | undefined;
}

export const ReviewStatsCards = ({ stats }: ReviewStatsCardsProps) => {
  const statCards = [
    {
      title: "Total Reviews",
      value: stats?.totalReviews || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Average Rating",
      value: stats?.avgRating || "0.0",
      suffix: "/ 5",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "This Month",
      value: stats?.thisMonthReviews || 0,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Review Rate",
      value: stats?.reviewRate || "0",
      suffix: "%",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Pending Moderation",
      value: stats?.pendingModeration || 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Flagged Reviews",
      value: stats?.flaggedReviews || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className={stat.bgColor}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {stat.value}
                {stat.suffix && <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

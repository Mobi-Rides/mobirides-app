import { Navigation } from "@/components/Navigation";

export const ProfileLoading = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
        <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-10 w-full max-w-sm bg-gray-200 rounded mb-4"></div>
        <div className="h-10 w-full max-w-sm bg-gray-200 rounded"></div>
      </div>
      <Navigation />
    </div>
  );
};
import { CarGrid } from "@/components/CarGrid";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["cars"],
    queryFn: async ({ pageParam = 0 }) => {
      console.log("Fetching cars page:", pageParam);
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .range(pageParam * 10, (pageParam + 1) * 10 - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === 10 ? allPages.length : undefined;
    },
  });

  const cars = data?.pages.flat() || [];

  // Load more when the last element is in view
  React.useEffect(() => {
    if (inView && hasNextPage) {
      console.log("Loading next page of cars");
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Cars</h1>
      <CarGrid
        cars={cars}
        isLoading={isLoading}
        error={error}
        loadMoreRef={ref}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
};

export default Home;

import { useState, useEffect, useCallback } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialLoad?: boolean;
}

export function useInfiniteScroll(
  loadMore: () => void,
  { threshold = 200, initialLoad = true }: UseInfiniteScrollOptions = {}
) {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback(() => {
    // Calculate distance from bottom of the page
    const scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    const scrollHeight = (document.documentElement && document.documentElement.scrollHeight) || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    const scrolledToBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - threshold;

    if (scrolledToBottom && !isFetching) {
      setIsFetching(true);
    }
  }, [isFetching, threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!isFetching) return;
    
    loadMore();
    setIsFetching(false);
  }, [isFetching, loadMore]);

  // Initial load when component mounts
  useEffect(() => {
    if (initialLoad) {
      setIsFetching(true);
    }
  }, [initialLoad]);

  return { isFetching };
}

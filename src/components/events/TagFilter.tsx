
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagFilter = ({ selectedTags, onTagsChange }: TagFilterProps) => {
  const [showMore, setShowMore] = useState(false);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const visibleTagCount = isMobile ? 4 : 8;

  const { data: tags, isLoading } = useQuery({
    queryKey: ["event-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tags")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Tag[];
    }
  });

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  if (isLoading || !tags) {
    return (
      <div className="w-full overflow-x-auto pb-4 flex gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 animate-pulse rounded-full"></div>
        ))}
      </div>
    );
  }

  const displayTags = showMore ? tags : tags.slice(0, visibleTagCount);

  return (
    <div className="relative">
      <ScrollArea className="w-full pb-4">
        <div className="flex gap-2 pb-2 pr-12">
          {displayTags.map(tag => (
            <Button
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              size="sm"
              className={`rounded-full whitespace-nowrap h-8 px-3 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.id) 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {tags.length > visibleTagCount && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border"
            onClick={() => setShowMore(!showMore)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

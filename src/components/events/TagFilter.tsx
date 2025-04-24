
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagFilter = ({ selectedTags, onTagsChange }: TagFilterProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: tags, isLoading } = useQuery({
    queryKey: ["event-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const clearAllTags = () => {
    onTagsChange([]);
    setOpen(false);
  };

  const selectedCount = selectedTags.length;

  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex space-x-2 min-w-max">
            {!isLoading && tags?.map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-1 whitespace-nowrap"
                onClick={() => toggleTag(tag.id)}
              >
                <span>{tag.name}</span>
                {selectedTags.includes(tag.id) && (
                  <XIcon className="h-3 w-3 ml-1" onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag.id);
                  }} />
                )}
              </Button>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center p-2">
                <p className="text-sm text-muted-foreground">Loading tags...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-dashed flex-shrink-0"
            >
              <ChevronDownIcon className="mr-2 h-4 w-4" />
              Filter by tag
              {selectedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-sm px-1 font-normal"
                >
                  {selectedCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[300px]" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter by tag</h4>
                {selectedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="h-auto p-0 text-xs text-muted-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : !tags || tags.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground">No tags found</p>
                </div>
              ) : (
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center space-x-2"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-full justify-start ${
                            selectedTags.includes(tag.id)
                              ? "border-primary bg-primary/10"
                              : ""
                          }`}
                          onClick={() => toggleTag(tag.id)}
                        >
                          <div className="flex-1 text-left">{tag.name}</div>
                          {selectedTags.includes(tag.id) && (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagId) => {
            const tag = tags?.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {tag.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => removeTag(tagId)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

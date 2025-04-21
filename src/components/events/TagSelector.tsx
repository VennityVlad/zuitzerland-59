
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Tag = {
  id: string;
  name: string;
  color: string;
};

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('event_tags')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }
    
    if (data) {
      setAvailableTags(data);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const { data: newTag, error } = await supabase
      .from('event_tags')
      .insert({ name: newTagName.trim() })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return;
    }

    if (newTag) {
      setAvailableTags([...availableTags, newTag]);
      onTagsChange([...selectedTags, newTag]);
      setNewTagName("");
      setIsCreatingTag(false);
    }
  };

  const handleSelectTag = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge 
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="space-y-2">
        {isCreatingTag ? (
          <div className="flex gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name..."
              className="flex-1"
            />
            <Button onClick={handleCreateTag} size="sm">
              Add
            </Button>
            <Button 
              onClick={() => setIsCreatingTag(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsCreatingTag(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Tag
          </Button>
        )}

        {!isCreatingTag && (
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter(tag => !selectedTags.find(t => t.id === tag.id))
              .map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => handleSelectTag(tag)}
                >
                  {tag.name}
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserFiltersProps = {
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
  onClearFilters: () => void;
};

const UserFilters = ({ selectedRole, onRoleChange, onClearFilters }: UserFiltersProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
        <div className="w-full sm:w-auto">
          <label className="text-sm font-medium mb-2 block">Filter by Role</label>
          <Select 
            value={selectedRole || ""} 
            onValueChange={(value) => onRoleChange(value || null)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="co-designer">Co-Designer</SelectItem>
              <SelectItem value="co-curator">Co-Curator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="ghost" 
          onClick={onClearFilters}
          className="mt-auto"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserFilters;

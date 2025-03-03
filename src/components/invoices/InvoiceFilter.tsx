
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, FilterX } from "lucide-react";
import { format, subDays } from "date-fns";

export type InvoiceFilters = {
  status: string | null;
  name: string | null;
  email: string | null;
  roomType: string | null;
  dateRange: "all" | "week" | "month" | "quarter" | null;
};

interface InvoiceFilterProps {
  filters: InvoiceFilters;
  onFilterChange: (filters: InvoiceFilters) => void;
  onClearFilters: () => void;
  isAdmin: boolean;
  roomTypes: string[];
}

export const InvoiceFilter = ({
  filters,
  onFilterChange,
  onClearFilters,
  isAdmin,
  roomTypes,
}: InvoiceFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof InvoiceFilters, value: string | null) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== null
  ).length;

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-500"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status || "all_statuses"}
              onValueChange={(value) =>
                handleChange("status", value === "all_statuses" ? null : value)
              }
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-type-filter">Room Type</Label>
            <Select
              value={filters.roomType || "all_room_types"}
              onValueChange={(value) =>
                handleChange("roomType", value === "all_room_types" ? null : value)
              }
            >
              <SelectTrigger id="room-type-filter">
                <SelectValue placeholder="All room types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_room_types">All room types</SelectItem>
                {roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range-filter">Date Range</Label>
            <Select
              value={filters.dateRange || "all_time"}
              onValueChange={(value) =>
                handleChange(
                  "dateRange",
                  value === "all_time" ? null : (value as any)
                )
              }
            >
              <SelectTrigger id="date-range-filter">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_time">All time</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="quarter">Past 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name-filter">Name</Label>
                <Input
                  id="name-filter"
                  placeholder="Search by name"
                  value={filters.name || ""}
                  onChange={(e) =>
                    handleChange(
                      "name",
                      e.target.value === "" ? null : e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-filter">Email</Label>
                <Input
                  id="email-filter"
                  placeholder="Search by email"
                  value={filters.email || ""}
                  onChange={(e) =>
                    handleChange(
                      "email",
                      e.target.value === "" ? null : e.target.value
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

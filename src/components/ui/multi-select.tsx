
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  noOptionsMessage = "No options available",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const selectedLabels = selected.map(
    (value) => options.find((option) => option.value === value)?.label || value
  );

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "border border-input bg-background rounded-md min-h-10 flex flex-wrap gap-1 items-center px-3 py-2 text-sm ring-offset-background cursor-pointer",
            selected.length === 0 && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {selected.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            selected.map((value) => (
              <Badge 
                key={value} 
                variant="secondary"
                className="rounded-sm px-1 py-0 text-xs"
              >
                {options.find((option) => option.value === value)?.label || value}
                {!disabled && (
                  <button
                    className="ml-1 ring-offset-background outline-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {value}</span>
                  </button>
                )}
              </Badge>
            ))
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>{noOptionsMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  if (selected.includes(currentValue)) {
                    onChange(selected.filter((value) => value !== currentValue));
                  } else {
                    onChange([...selected, currentValue]);
                  }
                  setOpen(true);
                }}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option.value)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span>{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

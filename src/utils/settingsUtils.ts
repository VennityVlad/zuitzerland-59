
import { Json } from "@/integrations/supabase/types";

export const getSettingEnabled = (value: Json | null): boolean => {
  if (value === null) return true; // Default to true if no setting exists
  
  // If it's already a boolean
  if (typeof value === 'boolean') return value;
  
  // If it's a number (0 = false, anything else = true)
  if (typeof value === 'number') return value !== 0;
  
  // If it's an object with enabled property
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const valueObj = value as Record<string, Json>;
    if ('enabled' in valueObj) {
      return !!valueObj.enabled;
    }
  }
  
  // If it's a JSON string that might contain an object with enabled property
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && 'enabled' in parsed) {
        return !!parsed.enabled;
      }
      return !!parsed; // If it's a parseable value but not an object with enabled, treat truthy values as enabled
    } catch {
      return true; // Default to true if we can't parse it as JSON
    }
  }
  
  // Default to true for any other cases
  return true;
};

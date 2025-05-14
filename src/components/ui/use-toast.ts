
// Fix circular import by importing from the hooks file and re-exporting
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };

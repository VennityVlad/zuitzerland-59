
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, FileText, LogOut, CalendarDays, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NavMenu = () => {
  const { logout } = usePrivy();
  const navigate = useNavigate();

  return (
    <div className="absolute top-4 left-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="lg" className="flex items-center gap-2 p-2">
            <img 
              src="/lovable-uploads/e2be13a0-6853-41c8-aa7c-51ab5d5dd119.png" 
              alt="Menu Logo" 
              className="h-8 w-8"
            />
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/book")} className="cursor-pointer">
            <CalendarDays className="mr-2 h-4 w-4" />
            Book
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/invoices")} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavMenu;

import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
interface HeaderProps {
  onSearch: (query: string) => void;
}
const Header = ({
  onSearch
}: HeaderProps) => {
  return <header className="border-b-4 border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary brutalist-border flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">TW</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none">THE WALK - A Walkability Optimizer</h1>
            <p className="text-xs text-muted-foreground font-bold mt-1">AI-POWERED URBAN PLANNING FROM THE POV OF A WALKER</p>
          </div>
        </div>

        <div className="flex items-center gap-3 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search location (e.g., Koramangala, Bangalore)" className="pl-10 brutalist-border font-bold" onKeyDown={e => {
            if (e.key === "Enter") {
              onSearch(e.currentTarget.value);
            }
          }} />
          </div>
          <Button variant="default" className="brutalist-shadow font-bold">
            Search
          </Button>
        </div>
      </div>
    </header>;
};
export default Header;
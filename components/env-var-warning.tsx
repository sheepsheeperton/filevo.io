import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <Badge variant={"outline"} className="font-normal">
        Supabase environment variables required
      </Badge>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled>
          Sign in
        </Button>
        <Button size="sm" variant="primary" disabled>
          Sign up
        </Button>
      </div>
    </div>
  );
}

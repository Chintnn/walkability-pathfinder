import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { API_CONFIG } from "@/config/api";
import { toast } from "sonner";
import { Settings, CheckCircle2 } from "lucide-react";

const ApiConfig = () => {
  const [apiUrl, setApiUrl] = useState(API_CONFIG.BACKEND_URL);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      
      if (response.ok && data.status === "healthy") {
        toast.success("Connection successful!", {
          description: data.message,
        });
      } else {
        throw new Error("Backend not healthy");
      }
    } catch (error) {
      toast.error("Connection failed", {
        description: "Please check your API URL and ensure the backend is running",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-4 brutalist-border">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">API Configuration</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-bold text-muted-foreground mb-1 block">
            FastAPI Backend URL
          </label>
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-backend-url.com"
            className="brutalist-border font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Update this in <code className="bg-muted px-1">src/config/api.ts</code>
          </p>
        </div>

        <Button
          onClick={testConnection}
          disabled={isTesting}
          variant="outline"
          className="w-full brutalist-border font-bold"
        >
          {isTesting ? (
            "Testing..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ApiConfig;

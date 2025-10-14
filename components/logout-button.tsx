"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call server-side logout endpoint
      await fetch("/auth/logout", {
        method: "POST",
      });
      
      // Force a full page reload to clear all state
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={logout} 
      variant="secondary" 
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}

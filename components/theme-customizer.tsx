"use client";

import * as React from "react";
import { Check, Moon, Paintbrush, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useThemeColor } from "./theme-color-provider";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const colors = [
  { name: "zinc", label: "Zinc", color: "hsl(240 5.9% 10%)" },
  { name: "rose", label: "Rose", color: "hsl(346.8 77.2% 49.8%)" },
  { name: "blue", label: "Blue", color: "hsl(221.2 83.2% 53.3%)" },
  { name: "green", label: "Green", color: "hsl(142.1 76.2% 36.3%)" },
  { name: "orange", label: "Orange", color: "hsl(24.6 95% 53.1%)" },
  { name: "violet", label: "Violet", color: "hsl(262.1 83.3% 57.8%)" },
] as const;

export function ThemeCustomizer() {
  const { setTheme: setMode, theme: mode } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Paintbrush className="w-4 h-4" />
          <span>Customize Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4">
        <div className="flex flex-col space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">Customize</h4>
            <p className="text-sm text-muted-foreground">
              Pick a style and color for your components.
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">Color</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {colors.map((c) => {
                const isActive = themeColor === c.name;

                return (
                  <Button
                    key={c.name}
                    variant={"outline"}
                    className={cn(
                      "justify-start gap-2 h-9 px-3",
                      isActive && "border-2 border-primary"
                    )}
                    onClick={() => setThemeColor(c.name as any)}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full"
                      style={{ backgroundColor: c.color }}
                    >
                      {isActive && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="text-xs font-medium">{c.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">Mode</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={"outline"}
                className={cn("h-9 px-3", mode === "light" && "border-2 border-primary")}
                onClick={() => setMode("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span className="text-xs">Light</span>
              </Button>
              <Button
                variant={"outline"}
                className={cn("h-9 px-3", mode === "dark" && "border-2 border-primary")}
                onClick={() => setMode("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span className="text-xs">Dark</span>
              </Button>
              <Button
                variant={"outline"}
                className={cn("h-9 px-3", mode === "system" && "border-2 border-primary")}
                onClick={() => setMode("system")}
              >
                <span className="text-xs">System</span>
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

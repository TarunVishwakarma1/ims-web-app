"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

type ThemeColor = "zinc" | "rose" | "blue" | "green" | "orange" | "violet";

interface ThemeColorContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export function ThemeColorProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [themeColor, setThemeColor] = useState<ThemeColor>("zinc");

  useEffect(() => {
    const savedColor = localStorage.getItem("themeColor") as ThemeColor;
    if (savedColor) {
      setThemeColor(savedColor);
    }
  }, []);

  const handleSetThemeColor = useCallback((color: ThemeColor) => {
    setThemeColor(color);
    localStorage.setItem("themeColor", color);
  }, []);

  const value = useMemo(
    () => ({
      themeColor,
      setThemeColor: handleSetThemeColor,
    }),
    [themeColor, handleSetThemeColor]
  );

  useEffect(() => {
    const root = document.documentElement;
    // Remove all existing theme- color classes
    root.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        root.classList.remove(cls);
      }
    });

    if (themeColor !== "zinc") {
      root.classList.add(`theme-${themeColor}`);
    }
  }, [themeColor]);

  return (
    <ThemeColorContext.Provider value={value}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (context === undefined) {
    throw new Error("useThemeColor must be used within a ThemeColorProvider");
  }
  return context;
}

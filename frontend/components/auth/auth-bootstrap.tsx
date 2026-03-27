"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user";

export function AuthBootstrap() {
  const bootstrap = useUserStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}

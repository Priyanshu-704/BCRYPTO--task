"use client";

import React, { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";

export interface ImageCellProps {
  value: string;
  row?: any;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string | ((row: any) => string);
  alt?: string;
}

export function ImageCell({
  value,
  row,
  size = "md",
  fallback,
  alt = "Preview",
}: ImageCellProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses: Record<"sm" | "md" | "lg" | "xl", string> = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  const sizeClass = sizeClasses[size];
  const resolvedValue = resolveMediaUrl(value, "");

  if (!resolvedValue || imgError) {
    const fallbackContent =
      typeof fallback === "function" && row ? fallback(row) : fallback;
    const resolvedFallback =
      typeof fallbackContent === "string"
        ? resolveMediaUrl(fallbackContent, fallbackContent)
        : fallbackContent;
    const isUrl =
      typeof resolvedFallback === "string" &&
      (resolvedFallback.includes("/") || resolvedFallback.includes("."));
    if (isUrl) {
      return (
        <Lightbox
          src={resolvedFallback}
          alt={alt}
          className={`${sizeClass} object-cover rounded-full`}
          wrapperClassName="inline-block"
        />
      );
    }
    return (
      <div
        className={cn(
          sizeClass,
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground"
        )}
      >
        {typeof fallbackContent === "function"
          ? fallbackContent(row)
          : resolvedFallback || "No Image"}
      </div>
    );
  }

  return (
    <Lightbox
      src={resolvedValue}
      alt={alt}
      className={`${sizeClass} object-cover rounded-full`}
      wrapperClassName="inline-block"
      onError={() => setImgError(true)}
    />
  );
}

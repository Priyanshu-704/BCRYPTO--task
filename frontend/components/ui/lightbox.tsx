import type React from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { cn } from "@/lib/utils";
import { getInitials } from "../blocks/data-table/utils/image";
import { resolveMediaUrl } from "@/lib/media";

interface LightboxProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  alt: string;
}

export function Lightbox({
  src,
  alt,
  className,
  wrapperClassName,
  ...props
}: LightboxProps) {
  const initials = getInitials(alt);
  const resolvedSrc =
    typeof src === "string" ? resolveMediaUrl(src, "/img/placeholder.svg") : src;

  if (!resolvedSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground font-medium",
          className,
          wrapperClassName
        )}
        {...props}
      >
        {initials}
      </div>
    );
  }

  return (
    <Zoom>
      <div className={cn("cursor-zoom-in", wrapperClassName)}>
        <img
          src={resolvedSrc || "/img/placeholder.svg"}
          alt={alt}
          className={cn("w-full h-full object-cover", className)}
          {...props}
        />
      </div>
    </Zoom>
  );
}

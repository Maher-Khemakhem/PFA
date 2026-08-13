import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SmartImageProps = {
  sources: string[];
  alt: string;
  className?: string;
};

export function SmartImage({ sources, alt, className }: SmartImageProps) {
  const cleanSources = sources.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [cleanSources.join("|")]);

  if (cleanSources.length === 0) {
    return null;
  }

  return (
    <img
      src={cleanSources[Math.min(index, cleanSources.length - 1)]}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      loading="lazy"
      onError={() => setIndex((current) => Math.min(current + 1, cleanSources.length - 1))}
    />
  );
}

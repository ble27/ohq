import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { normalizeZoomLink } from "@shared/zoomLink"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSafeZoomLink(zoomLink: string | null | undefined): string | null {
  return normalizeZoomLink(zoomLink)
}

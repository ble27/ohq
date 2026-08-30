import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Zoom links come back from the API as free-form strings; rendering them directly as an
// `<a href>` would let a `javascript:`/`data:` value execute when clicked. Only allow
// actual https://zoom.us links through — this is the one place users are expected to link to.
export function getSafeZoomLink(zoomLink: string | null | undefined): string | null {
  if (!zoomLink) return null
  try {
    const url = new URL(zoomLink)
    if (url.protocol !== 'https:' || !/(^|\.)zoom\.us$/i.test(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

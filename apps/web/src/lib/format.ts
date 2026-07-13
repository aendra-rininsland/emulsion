/** Formats an f-number as "f/2" or "f/1.8", trimming trailing zeroes. */
export function formatAperture(fNumber: number | undefined): string | undefined {
  if (fNumber === undefined) return undefined;
  return `f/${trimDecimal(fNumber)}`;
}

/** Formats exposure time in seconds as "1/2000s" (sub-second) or "2s"/"1.5s" (one second or longer). */
export function formatExposureTime(seconds: number | undefined): string | undefined {
  if (seconds === undefined) return undefined;
  if (seconds >= 1) return `${trimDecimal(seconds)}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

/** Formats a 35mm-equivalent focal length as "23mm". */
export function formatFocalLength(mm: number | undefined): string | undefined {
  if (mm === undefined) return undefined;
  return `${trimDecimal(mm)}mm`;
}

/** Formats ISO as "ISO 200". */
export function formatIso(iso: number | undefined): string | undefined {
  if (iso === undefined) return undefined;
  return `ISO ${iso}`;
}

function trimDecimal(n: number): string {
  return Number(n.toFixed(2)).toString();
}

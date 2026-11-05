import type { NativeMap as NativeMapComponent } from "./NativeMap";

export type { MapPin } from "./NativeMap";

/** The web preview has no native maps; the map screen shows its list instead. */
export const NativeMap: typeof NativeMapComponent = () => null;

export const nativeMapsAvailable = false;

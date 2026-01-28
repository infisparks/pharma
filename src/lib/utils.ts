import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const disableScrollOnNumberInput = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
};

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with clsx and tailwind-merge.
 * Prevents Tailwind class conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Polymorphic component helper — resolves the `asChild` pattern.
 * When `asChild` is true, the component delegates rendering to its
 * single React-element child via cloneElement.
 */
export function mergeProps<T extends Record<string, unknown>>(
  baseProps: T,
  childProps: Record<string, unknown>,
): T {
  const merged: Record<string, unknown> = { ...childProps };

  for (const [key, value] of Object.entries(baseProps)) {
    if (key === 'className') {
      merged[key] = cn(value as ClassValue, childProps.className as ClassValue);
    } else if (key === 'style') {
      merged[key] = {
        ...(value as Record<string, unknown>),
        ...(childProps.style as Record<string, unknown>),
      };
    } else if (key.startsWith('on') && typeof value === 'function') {
      // Event handlers: call both base and child handlers
      const childHandler = childProps[key];
      merged[key] = (...args: unknown[]) => {
        (value as (...a: unknown[]) => void)(...args);
        if (typeof childHandler === 'function') {
          (childHandler as (...a: unknown[]) => void)(...args);
        }
      };
    } else if (!(key in childProps)) {
      merged[key] = value;
    }
  }

  return merged as T;
}

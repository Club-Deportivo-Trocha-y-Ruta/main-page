import 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  export interface Assertion<T = unknown> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}

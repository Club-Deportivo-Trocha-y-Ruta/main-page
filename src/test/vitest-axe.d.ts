import 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  // El parámetro de tipo debe replicar la firma original de `Assertion` en
  // vitest (la fusión de declaraciones exige listas de type params idénticas),
  // aunque los matchers de axe no lo usen: por eso lleva el prefijo `_`.
  export interface Assertion<_T = unknown> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}

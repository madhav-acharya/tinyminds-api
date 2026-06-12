import { Transform } from 'class-transformer';

export function CapitalizeTransformer() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value;
  });
}

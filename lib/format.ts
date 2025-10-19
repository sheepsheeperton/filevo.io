export const fmtCurrency = (v?: string | number) =>
  v == null || v === '' ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(v));

export const fmtDate = (d: Date | string | number) => new Date(d).toLocaleDateString();

export const nowISO = () => new Date().toISOString();
export function colombiaTime(value?:string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) return 'Fecha no registrada';
  return new Intl.DateTimeFormat('es-CO', {timeZone:'America/Bogota', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}).format(new Date(value));
}
export function colombiaToday() {
  return new Intl.DateTimeFormat('es-CO', {timeZone:'America/Bogota', weekday:'long', day:'numeric', month:'long'}).format(new Date());
}
export function colombiaInputISO(value:string) {return value ? new Date(`${value}:00-05:00`).toISOString() : undefined;}
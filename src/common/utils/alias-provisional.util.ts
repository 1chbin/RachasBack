const PREFIJO_ALIAS_PROVISIONAL = 'u_';

export function generarAliasProvisional(firebaseUid: string): string {
  const sufijo = firebaseUid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const normalizado = (sufijo.length >= 3 ? sufijo : firebaseUid.slice(0, 8)).slice(
    0,
    17,
  );
  return `${PREFIJO_ALIAS_PROVISIONAL}${normalizado}`.toLowerCase();
}

export function esAliasProvisional(alias: string): boolean {
  return /^u_[a-z0-9]{3,17}$/.test(alias);
}

let _professions: string[] = [];

export function configureProfessions(data: { professions: string[] }): void {
  _professions = data.professions;
}

export function getProfessions(): string[] {
  return _professions;
}

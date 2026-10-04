/**
 * Every skill name from the skills config, core (expert / advanced) skills
 * first, de-duplicated. Feeds the stack game's block labels.
 */
export function flattenSkillNames(skills: Record<string, unknown>): string[] {
  const items: { name: string; level?: string }[] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value)) {
      items.push(...(value as { name: string; level?: string }[]));
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(collect);
    }
  };
  collect(skills);
  const isCore = (level?: string) => ["expert", "advanced"].includes(level?.toLowerCase() ?? "");
  const sorted = [...items.filter((i) => isCore(i.level)), ...items.filter((i) => !isCore(i.level))];
  return [...new Set(sorted.map((i) => i.name))];
}

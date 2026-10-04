import { flattenSkillNames } from "./skills";

describe("flattenSkillNames", () => {
  it("lists core skills first, flattens sub-groups and de-duplicates", () => {
    const skills = {
      languages: [
        { name: "Python", level: "intermediate" },
        { name: "TypeScript", level: "Expert" },
      ],
      frontend: {
        frameworks: [{ name: "React", level: "advanced" }],
        styling: [{ name: "CSS" }],
      },
      backend: { runtime: [{ name: "Python", level: "beginner" }] },
    };
    expect(flattenSkillNames(skills)).toEqual(["TypeScript", "React", "Python", "CSS"]);
  });

  it("returns an empty list for empty config", () => {
    expect(flattenSkillNames({})).toEqual([]);
  });
});

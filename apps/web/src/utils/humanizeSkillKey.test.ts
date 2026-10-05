import { humanizeSkillKey } from "./humanizeSkillKey";

describe("humanizeSkillKey", () => {
  it("splits camelCase, keeps acronyms and maps 'and' to '&'", () => {
    expect(humanizeSkillKey("aiEngineering")).toBe("AI Engineering");
    expect(humanizeSkillKey("qualityAndTesting")).toBe("Quality & Testing");
    expect(humanizeSkillKey("cloud_aws-tools")).toBe("Cloud AWS Tools");
  });
});

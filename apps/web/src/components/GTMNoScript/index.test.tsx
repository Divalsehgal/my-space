import { render } from "@testing-library/react";
import GTMNoScript from ".";

describe("GTMNoScript", () => {
  it("renders the noscript iframe for a GTM id", () => {
    const { container } = render(<GTMNoScript gtmId="GTM-1" />);
    expect(container.querySelector("noscript")).not.toBeNull();
  });

  it.each([undefined, "UA-1"])("renders nothing for %s", (gtmId) => {
    expect(render(<GTMNoScript gtmId={gtmId} />).container.innerHTML).toBe("");
  });
});

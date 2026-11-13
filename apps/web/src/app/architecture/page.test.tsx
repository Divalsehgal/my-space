import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ArchitecturePage, { generateMetadata } from "./page";
import ChatbotLldPage, { generateMetadata as chatbotMetadata } from "./chatbot/page";
import ArchitectureModal from "../@modal/(.)architecture/page";
import ChatbotLldModal from "../@modal/(.)architecture/chatbot/page";
import { getArchitecture } from "@/containers/Architecture/data";
import { stubProps } from "@/test-utils/server";

jest.mock("@/containers/Architecture", () => jest.requireActual("@/test-utils/server").stub("Architecture"));
jest.mock("@/components/Breadcrumbs", () => jest.requireActual("@/test-utils/server").stub("Breadcrumbs"));
jest.mock("@/components/RouteModal", () => jest.requireActual("@/test-utils/server").stub("RouteModal"));
jest.mock("@/containers/Architecture/data", () => ({
  getArchitecture: jest.fn(async () => ({ nodes: [], edges: [] })),
  CHATBOT_LLD: { title: "LLD", subtitle: "Sub", nodes: [{ id: "n" }], edges: [] },
  CHATBOT_LLD_HREF: "/architecture/chatbot",
}));

const data = jest.requireMock("@/containers/Architecture/data");

describe("architecture routes", () => {
  it("renders the page with a link to the LLD", async () => {
    render(await ArchitecturePage());
    expect(stubProps(screen.getByTestId("Architecture")).related).toEqual({ href: "/architecture/chatbot", label: "LLD" });
    expect(generateMetadata().robots).toEqual({ index: false, follow: true });
    expect(getArchitecture).toHaveBeenCalled();
  });

  it("drops the LLD link when it has no nodes, and labels a title-less LLD", async () => {
    data.CHATBOT_LLD.nodes = [];
    render(await ArchitectureModal());
    expect(stubProps(screen.getByTestId("Architecture")).related).toBeUndefined();
    data.CHATBOT_LLD.nodes = [{ id: "n" }];
    data.CHATBOT_LLD.title = undefined;
    render(await ArchitectureModal());
    expect(stubProps(screen.getAllByTestId("Architecture")[1]).related.label).toBe("Chatbot LLD");
    render(<ChatbotLldPage />);
    data.CHATBOT_LLD.title = "LLD";
  });

  it("renders the chatbot LLD page and modal", () => {
    render(<ChatbotLldPage />);
    render(<ChatbotLldModal />);
    expect(screen.getAllByTestId("Architecture")).toHaveLength(2);
    expect(screen.getByTestId("RouteModal")).toBeInTheDocument();
    expect(chatbotMetadata()).toMatchObject({ title: "LLD", alternates: { canonical: "/architecture/chatbot" } });
  });
});

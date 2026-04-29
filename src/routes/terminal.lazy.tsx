import { createLazyFileRoute } from "@tanstack/react-router";
import { TerminalPage } from "@/components/terminal/terminal-page";

export const Route = createLazyFileRoute("/terminal")({
  component: TerminalPage,
});

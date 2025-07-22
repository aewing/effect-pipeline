import { renderHeader } from "./header";
import { renderFooter } from "./footer";

export function renderLayout(content: string): string {
  return `${renderHeader()}\n${content}\n${renderFooter()}`;
}

import { renderLogo } from "../logo";
import { getVersion } from "../version";

export function renderHeader(): string {
  const logo = renderLogo();
  const version = getVersion();
  return `${logo}\nEffect Pipeline v${version}\n`;
}

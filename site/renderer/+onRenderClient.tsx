import { hydrate, render } from "preact";
import type { PageContextClient } from "vike/types";
import type { ComponentChildren } from "preact";

export { onRenderClient };

async function onRenderClient(pageContext: PageContextClient) {
  const { Page, pageProps } = pageContext;

  if (!Page) throw new Error('Client-side render() hook expects pageContext.Page to be defined');

  const Layout = (pageContext.config as any).Layout || (({ children }: { children: ComponentChildren }) => <>{children}</>);

  const page = (
    <Layout>
      <Page {...pageProps} />
    </Layout>
  );

  const container = document.getElementById("page-view");
  if (!container) throw new Error('DOM element #page-view not found');

  if (pageContext.isHydration) {
    hydrate(page, container);
  } else {
    render(page, container);
  }
}

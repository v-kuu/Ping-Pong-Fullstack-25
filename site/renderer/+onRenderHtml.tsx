import { renderToString } from "preact-render-to-string";
import { escapeInject, dangerouslySkipEscape } from "vike/server";
import type { PageContextServer } from "vike/types";
import type { ComponentChildren } from "preact";

export { onRenderHtml };

async function onRenderHtml(pageContext: PageContextServer) {
  const { Page, pageProps } = pageContext;

  if (!Page) throw new Error('My render() hook expects pageContext.Page to be defined');

  const Layout = (pageContext.config as any).Layout || (({ children }: { children: ComponentChildren }) => <>{children}</>);
  const Head = (pageContext.config as any).Head || (() => <></>);
  const title = (pageContext.config as any).title || "ft_transcendence";

  const pageHtml = renderToString(
    <Layout>
      <Page {...pageProps} />
    </Layout>
  );

  const headHtml = renderToString(<Head />);

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${dangerouslySkipEscape(headHtml)}
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {
      // We can add some data here that we want to pass to the client
    },
  };
}

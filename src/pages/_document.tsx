import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          defer
          data-domain="bluesky-labelers.io"
          src="https://plausible.io/js/script.js"
        />
      </Head>
      <body className="antialiased bg-gray-app text-gray-normal">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

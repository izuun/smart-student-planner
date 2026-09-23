import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import "../styles/style.css";
import "../styles/login.css";
import { TourProvider } from "../context/TourContext";
import TourOverlay from "../components/TourOverlay";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const saved = window.localStorage.getItem("darkMode") === "true";
    document.body.classList.toggle("dark", saved);
    document.documentElement.classList.remove("dark-preload");
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const saved = window.localStorage.getItem("darkMode") === "true";
      document.body.classList.toggle("dark", saved);
      document.documentElement.classList.remove("dark-preload");
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0b1020" />
        <script dangerouslySetInnerHTML={{ __html: `try { if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark-preload'); } catch (e) {}` }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <TourProvider>
        <div className="page-transition" key={router.asPath}>
          <Component {...pageProps} />
        </div>
        <TourOverlay />
      </TourProvider>
    </>
  );
}

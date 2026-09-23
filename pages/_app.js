import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import "../styles/style.css";
import "../styles/login.css";
import { TourProvider } from "../context/TourContext";
import TourOverlay from "../components/TourOverlay";
import IrisTransition from "../components/IrisTransition";
import { isIrisActive } from "../lib/iris";

// Sidebar order, used to slide pages forward (left) or back (right) like a carousel.
const PAGE_ORDER = [
  "/dashboard",
  "/tasks",
  "/calendar",
  "/cgpa",
  "/goals",
  "/statistics",
  "/profile",
  "/settings",
  "/sdg",
  "/guide",
];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [direction, setDirection] = useState("forward"); // "forward" | "back" | "none" (iris)
  // The page whose entrance animation has finished. Anything else is a page that just arrived.
  const [settledPath, setSettledPath] = useState(router.asPath);
  const pathRef = useRef(router.pathname);
  pathRef.current = router.pathname;

  // Slide the current page out while the next one loads.
  useEffect(() => {
    const pathOf = (url) => url.split(/[?#]/)[0];
    const start = (url, { shallow } = {}) => {
      const to = pathOf(url);
      if (shallow || to === pathRef.current) return;
      // Login / logout use the circle transition instead of the slide.
      if (isIrisActive()) {
        setDirection("none");
        return;
      }
      const from = PAGE_ORDER.indexOf(pathRef.current);
      const target = PAGE_ORDER.indexOf(to);
      setDirection(from !== -1 && target !== -1 && target < from ? "back" : "forward");
      setLeaving(true);
    };
    const stop = () => setLeaving(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  // Once a new page has finished animating in, drop the animation classes so
  // nothing stays promoted to its own layer (which would also break fixed modals).
  useEffect(() => {
    const t = setTimeout(() => setSettledPath(router.asPath), 520);
    return () => clearTimeout(t);
  }, [router.asPath]);

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

  // A freshly arrived page always starts in its "enter" state, even while `leaving`
  // is still true for that one render, so it can never flash in at full opacity.
  const isNewPage = router.asPath !== settledPath;
  const phase = isNewPage ? `enter-${direction}` : leaving ? `leave-${direction}` : "idle";

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
        <div className={`page-transition ${phase}`} key={router.asPath}>
          <Component {...pageProps} />
        </div>
        <TourOverlay />
      </TourProvider>
      <IrisTransition />
    </>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QuranProvider } from "../context/QuranContext";
import "../main.scss";
import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children?: ReactNode;
}

function Layout({ children }: Props) {
  const mainRef = useRef<HTMLElement>(null);
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.dir = i18n.dir();
    }
  }, [i18n.resolvedLanguage, i18n]);

  return (
    <main ref={mainRef}>
      <Navbar />
      <AlertMessage />
      <QuranProvider>{children}</QuranProvider>
      <ToastContainer
        position={`${isRtl ? "top-left" : "top-right"}`}
        rtl={isRtl}
      />
    </main>
  );
}

const AlertMessage = () => {
  const { t } = useTranslation();

  return (
    <div
      className="alert alert-warning alert-dismissible fade show d-flex justify-content-center m-0"
      role="alert"
    >
      {t("alert_message")}
      <button
        type="button"
        className="btn-close"
        data-bs-dismiss="alert"
        aria-label="Close"
      ></button>
    </div>
  );
};

const Navbar = () => {
  const { t, i18n } = useTranslation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          {t("nav_brand")}
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul
            className={`navbar-nav  mb-2 mb-lg-0 ${
              i18n.resolvedLanguage === "en" && "me-auto"
            }`}
          >
            <li className="nav-item">
              <Link className="nav-link" aria-current="page" to="/">
                {t("nav_home")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/roots">
                {t("nav_roots")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/notes">
                {t("nav_notes")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/translation">
                {t("nav_translation")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/coloring">
                {t("nav_coloring")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                {t("nav_about")}
              </Link>
            </li>
          </ul>
          <LanguageButton />
        </div>
      </div>
    </nav>
  );
};

const LanguageButton = () => {
  const { i18n } = useTranslation();
  let resolvedLang = i18n.resolvedLanguage;

  const onLangClick = () => {
    resolvedLang === "en"
      ? i18n.changeLanguage("ar")
      : i18n.changeLanguage("en");
  };
  return (
    <div className={`d-flex ${resolvedLang === "ar" && "me-auto"}`}>
      <button className="btn btn-light" onClick={onLangClick}>
        {resolvedLang === "en" ? "??????????????" : "English"}
      </button>
    </div>
  );
};

export default Layout;

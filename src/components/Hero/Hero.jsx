import React, { useEffect } from "react";
import styles from "./Hero.module.css";
import { getImageUrl } from "../../utils";

export const Hero = () => {
  useEffect(() => {
    // Hotjar Tracking Code
    (function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: 5226215, hjsv: 6 };
      a = o.getElementsByTagName("head")[0];
      r = o.createElement("script");
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Olá, eu sou Ada</h1>
        <p className={styles.description}>
          Sou sua assistente virtual. Minha missão é tornar seu sistema
          acessível para todos!
        </p>
        <a
          href="mailto:ada2024fatec.mrs@outlook.com"
          className={styles.contactBtn}
        >
          Entre em contato
        </a>
      </div>
      <img
        src={getImageUrl("hero/AdaHome.png")}
        alt="Hero image of me"
        className={styles.heroImg}
      />
      <div className={styles.topBlur} />
      <div className={styles.bottomBlur} />
    </section>
  );
};

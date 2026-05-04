import React, { useEffect } from "react";

import styles from "./About.module.css";
import { getImageUrl } from "../../utils";

export const About = () => {
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
    <section className={styles.container} id="About">
      <h2 className={styles.title}>Serviços</h2>
      <div className={styles.content}>
        <img
          src={getImageUrl("about/AdaSentada.png")}
          alt="Me sitting with a laptop"
          className={styles.aboutImage}
        />
        <ul className={styles.aboutItems}>
          <li className={styles.aboutItem}>
            <img src={getImageUrl("about/writing.png")} alt="Cursor icon" className={styles.iconList} />
            <div className={styles.aboutItemText}>
              <h3 className={styles.textoLi}>Criação</h3>
              <p className={styles.textoLi}>
                Site completo com as funções e acessibilidades mais atuais do
                mercado
              </p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img src={getImageUrl("about/adaptability.png")} alt="Server icon" className={styles.iconList} />
            <div className={styles.aboutItemText}>
              <h3 className={styles.textoLi}>Adaptação</h3>
              <p className={styles.textoLi}>Serviços de adaptação do site em produção</p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img src={getImageUrl("about/people.png")} alt="UI icon" className={styles.iconList}/>
            <div className={styles.aboutItemText}>
              <h3 className={styles.textoLi}>Consultoria</h3>
              <p className={styles.textoLi}>
                Um guia com técnicas de acessibilidade para implementar, manter
                e desenvolver o sistema
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};

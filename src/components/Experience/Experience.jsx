import React, { useEffect } from "react";
import styles from "./Experience.module.css";
import skills from "../../data/skills.json";
import { getImageUrl } from "../../utils";

export const Experience = () => {
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
    <section className={styles.container} id="experience">
      <h2 className={styles.title}>Acessibilidade</h2>
      <div className={styles.content}>
        <div className={styles.skills}>
          {skills.map((skill, id) => {
            return (
              <div key={id} className={styles.skill}>
                <div className={styles.skillImageContainer}>
                  <img src={getImageUrl(skill.imageSrc)} alt={skill.title} />
                </div>
                <p>{skill.title}</p>
              </div>
            );
          })}
        </div>
        <ul className={styles.history}>
          {/* Informações sobre idosos */}
          <li className={styles.historyItem}>
            <div className={styles.historyItemDetails}>
              <h3>Idosos</h3>
              <p>
                Focamos em criar interfaces acessíveis para pessoas idosas,
                levando em consideração limitações comuns como visão reduzida,
                dificuldade motora e uso simplificado.
              </p>
              <ul className={styles.textList}>
                <li className={styles.textItem}>Textos grandes e de fácil leitura.</li>
                <li className={styles.textItem}>Botões maiores para facilitar o clique.</li>
                <li className={styles.textItem}>Navegação simplificada com menos passos.</li>
              </ul>
            </div>
          </li>

          {/* Informações sobre crianças */}
          <li className={styles.historyItem}>
            <div className={styles.historyItemDetails}>
              <h3>Crianças</h3>
              <p>
                Desenvolvemos interfaces amigáveis para crianças, com foco em
                interatividade, cores chamativas e controles intuitivos.
              </p>
              <ul className={styles.textList}>
                <li className={styles.textItem}>Elementos visuais interativos e coloridos.</li>
                <li className={styles.textItem}>Textos curtos e diretos com ícones de apoio.</li>
                <li className={styles.textItem}>Feedback visual e sonoro para ações realizadas.</li>
              </ul>
            </div>
          </li>

          {/* Informações sobre deficiência visual */}
          <li className={styles.historyItem}>
            <div className={styles.historyItemDetails}>
              <h3>Deficiência Visual</h3>
              <p>
                Adaptações para usuários com deficiência visual incluem alto
                contraste, suporte para leitores de tela e navegação por
                teclado.
              </p>
              <ul className={styles.textList}>
                <li className={styles.textItem}>Altos contrastes de cores.</li>
                <li className={styles.textItem}>
                  Suporte total para leitores de tela (com descrições de
                  imagens).
                </li>
                <li className={styles.textItem}>Navegação via teclado com foco visível.</li>
              </ul>
            </div>
          </li>

          {/* Informações sobre daltonismo */}
          <li className={styles.historyItem}>
            <div className={styles.historyItemDetails}>
              <h3>Daltonismo</h3>
              <p>
                Design adaptado para usuários daltônicos, usando combinações de
                cores seguras e ícones que não dependem apenas da cor.
              </p>
              <ul className={styles.textList}>
                <li className={styles.textItem}>
                  Paletas de cores amigáveis para diferentes tipos de
                  daltonismo.
                </li>
                <li className={styles.textItem}>Uso de padrões e texturas além de cores para distinção.</li>
                <li className={styles.textItem}>
                  Evitar uso exclusivo de cores para transmitir informações
                  importantes.
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};

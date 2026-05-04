import React from "react";

import styles from "./Contact.module.css";
import { getImageUrl } from "../../utils";

export const Contact = () => {
  return (
    <footer id="contact" className={styles.container}>
      <div className={styles.text}>
        <h2>Contatos</h2>
        <p>Fale com a gente!</p>
      </div>
      <ul className={styles.links}>
        <li className={styles.link}>
          <img src={getImageUrl("contact/emailIcon.png")} alt="Email icon" className={styles.iconsFooter}/>
          <a href="mailto:ada2024fatec.mrs@outlook.com">ada2024fatec.mrs@outlook.com</a>
        </li>
        <li className={styles.link}>
          <img
            src={getImageUrl("contact/linkedinIcon.png")}
            alt="LinkedIn icon"
            className={styles.iconsFooter}
          />
          <a href="https://www.linkedin.com">linkedin.com/AdaCompany</a>
        </li>
        <li className={styles.link}>
          <img src={getImageUrl("contact/githubIcon.png") } alt="Github icon" className={styles.iconsFooter} />
          <a href="https://github.com/ADACompany01/Terceiro-Semestre">github.com/AdaCompany01</a>
        </li>
      </ul>
    </footer>
  );
};

import React from "react";
import styles from "./Projects.module.css";
import blogdacidade from "../../../assets/images/blogdacidade.png";
import vivendamaxsite from "../../../assets/images/vivendamaxsite.png";


export const Projects = () => {
  const examples = [
    {
      title: "Site com Acessibilidade Ruim",
      score: 40,
      image: blogdacidade,
      points: [
        "🔴 Baixo contraste entre texto e fundo",
        "🔴 Links sem nomes compreensíveis",
        "🔴 Campos de formulário sem rótulos",
        "🔴 Estrutura de listas inadequada",
      ],
      color: "red",
    },
    {
      title: "Site com Boa Acessibilidade",
      score: 89,
      image: vivendamaxsite,
      points: [
        "🟢 Bom contraste entre textos e fundos",
        "🟢 Links com textos descritivos",
        "🟢 Campos de formulário com rótulos claros",
        "🟢 Estrutura semântica bem definida",
      ],
      color: "green",
    },
  ];

  return (
    <section className={styles.container} id="projects">
      <h2 className={styles.title}>Exemplos de Acessibilidade</h2>
      <div className={styles.grid}>
        {examples.map((example, id) => (
          <div key={id} className={`${styles.card} ${styles[example.color]}`}>
            <h3>{example.title}</h3>
            <p><strong>Nota:</strong> {example.score} / 100</p>

            <div className={styles.imageWrapper}>
              <img
                src={example.image}
                alt={example.title}
                className={styles.exampleImage}
                width={500}
                height={300}
              />
            </div>

            <ul>
              {example.points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

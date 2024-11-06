import axios from "axios";
import cheerio from "cheerio";
import { exit } from "process";
import fs from "fs";

let data = [];

// Fonction pour écrire les données dans un fichier JSON
async function writeDataToFile(data) {
  try {
    const fileName = "athlete_data.json";
    // Écrire les données dans le fichier JSON
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log(`Les données ont été enregistrées dans ${fileName}`);
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l'écriture des données :",
      error,
    );
  }
}

// Gestionnaire pour intercepter le signal de terminaison
process.on("SIGINT", async () => {
  console.log("Arrêt du script...");
  // Écrire les données récupérées dans le fichier JSON avant de terminer le processus
  await writeDataToFile(data);
  // Terminer le processus
  exit();
});

// Fonction pour récupérer les liens vers les pages individuelles des athlètes
async function getAthleteLinks(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const athleteLinks = [];
    // Pour chaque athlète, on récupère le lien vers sa page individuelle
    $(".athlet").each((index, element) => {
      const link = $(element).attr("href");
      athleteLinks.push(link);
    });
    return athleteLinks;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des liens des athlètes :",
      error,
    );
    return [];
  }
}

// Fonction pour récupérer le palmarès d'un athlète avec le lien de sa page individuelle
async function getAthleteAchievements(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get("https://olympics-statistics.com" + url);
    const $ = cheerio.load(data);
    const athlete = {
      firstname: $(".legende .vn").text(),
      lastname: $(".legende .nn").text(),
      achievements: {
        gold: 0,
        silver: 0,
        bronze: 0,
      },
    };

    // Récupérer le nombre de médailles d'or, d'argent et de bronze
    const gold = $('.the-medal[data-medal="1"]').length;
    const silver = $('.the-medal[data-medal="2"]').length;
    const bronze = $('.the-medal[data-medal="3"]').length;

    // Mettre les médailles dans le tableau achievements
    athlete.achievements.gold = gold === 0 ? 0 : gold - 1;
    athlete.achievements.silver = silver === 0 ? 0 : silver - 1;
    athlete.achievements.bronze = bronze === 0 ? 0 : bronze - 1;

    return athlete;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des réalisations de l'athlète :",
      error,
    );
    return null;
  }
}

// Fonction pour récupérer et enregistrer les données des athlètes
async function scrapeAthletes() {
  try {
    const athleteLinks = await getAthleteLinks(
      "https://olympics-statistics.com/olympic-athletes",
    );
    // Pour chaque lien, on récupère les réalisations de l'athlète
    for (const link of athleteLinks) {
      const athlete = await getAthleteAchievements(link);
      data.push(athlete);
      console.log(
        `Les données de ${athlete.firstname} ${athlete.lastname} ont été enregistrées`,
      );
      // Pause de 5 secondes entre chaque requête pour éviter les erreurs 429
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    // Écrire les données dans un fichier JSON une fois que toutes les données ont été récupérées
    await writeDataToFile(data);
  } catch (error) {
    console.error(
      "Une erreur est survenue lors du scraping des athlètes :",
      error,
    );
  }
}

// Lancer le scraping
scrapeAthletes();

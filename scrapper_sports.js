import axios from 'axios';
import cheerio from 'cheerio';
import { exit } from 'process';
import fs from 'fs';

let data = [];

// Fonction pour écrire les données dans un fichier JSON
async function writeDataToFile(data) {
  try {
    const fileName = "sport_data.json";
    // Écrire les données dans le fichier JSON
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    console.log(`Les données ont été enregistrées dans ${fileName}`);
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l'écriture des données :",
      error
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

async function getSportLinks(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const sportLinks = [];
    // Pour chaque sport, on récupère le lien vers sa page individuelle
    $(".sport").each((index, element) => {
      const link = $(element).attr("href");
      sportLinks.push(link);
    });
    return sportLinks;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des liens des sports :",
      error
    );
    return [];
  }
}

// Fonction pour récupérer le nombre de médailles pour les sports pour chaque pays
async function getSportMedalsByNation(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get("https://olympics-statistics.com" + url);
    const $ = cheerio.load(data);
    const sports = {
      nameSport: $(".landname").text(),
      nations: [], // Utilisation d'un tableau pour stocker les données de chaque nation
    };

    // Parcourir chaque nation
    $(".nation").each((index, element) => {
      const nation = {
        nameCountry: $(element).find(".n").text(),
        medalCounts: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      };

      // Parcourir chaque médaille pour cette nation
      $(element)
        .find(".the-medal")
        .each((index, medalElement) => {
          const medalType = $(medalElement).attr("data-medal");
          const medalCount = parseInt($(medalElement).parent().attr("data-c"));

          // Ajouter le nombre de médailles au type correspondant
          if (medalType === "1") {
            nation.medalCounts.gold += medalCount;
          } else if (medalType === "2") {
            nation.medalCounts.silver += medalCount;
          } else if (medalType === "3") {
            nation.medalCounts.bronze += medalCount;
          }
        });

      // Ajouter les données de la nation au tableau
      sports.nations.push(nation);
    });

    return sports;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des médailles par nation :",
      error
    );
    return null;
  }
}

async function scrapeSports() {
  try {
    const sportLinks = await getSportLinks(
      "https://olympics-statistics.com/olympic-sports"
    );
    // Pour chaque lien, on récupère les données du sport
    for (const link of sportLinks) {
      const sport = await getSportMedalsByNation(link);
      data.push(sport);
      console.log(`Les données de ${sport.nameSport} ont été enregistrées`);
      // Pause de 5 secondes entre chaque requête pour éviter les erreurs 429
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // Écrire les données dans un fichier JSON une fois que toutes les données ont été récupérées
    await writeDataToFile(data);
  } catch (error) {
    console.error(
      "Une erreur est survenue lors du scraping des sports :",
      error
    );
  }
}

// Lancer le scraping
scrapeSports();

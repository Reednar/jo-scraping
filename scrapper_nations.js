import axios from 'axios';
import cheerio from 'cheerio';
import { exit } from 'process';
import fs from 'fs';

let data = [];

// Fonction pour écrire les données dans un fichier JSON
async function writeDataToFile(data) {
  try {
    const fileName = "nation_data.json";
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

async function getNationsLinks(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const nationLinks = [];
    // Pour chaque nation, on récupère le lien vers sa page individuelle
    $(".nation").each((index, element) => {
      const link = $(element).attr("href");
      nationLinks.push(link);
    });
    return nationLinks;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des liens des nations :",
      error
    );
    return [];
  }
}

// Fonction pour récupérer le nombre de médailles pour chaque type (or, argent, bronze) par athlète
async function getNationMedalists(url) {
  try {
    // Récupération du code HTML de la page
    const { data } = await axios.get("https://olympics-statistics.com" + url);
    const $ = cheerio.load(data);
    const athletes = [];
    const nation = {
      nameCountry: $(".landname").text(),
      medalists: {
        gold_medalist_count: 0,
        silver_medalist_count: 0,
        bronze_medalist_count: 0,
      },
    };

    // Parcourir chaque athlète
    $(".athlet").each((index, element) => {
      const athlete = {
        medalCounts: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      };

      // Parcourir chaque médaille pour cet athlète
      $(element)
        .find(".the-medal")
        .each((index, medalElement) => {
          const medalType = $(medalElement).attr("data-medal");
          const medalCount = parseInt($(medalElement).parent().attr("data-c"));

          // Ajouter le nombre de médailles au type correspondant
          if (medalType === "1") {
            athlete.medalCounts.gold += medalCount;
          } else if (medalType === "2") {
            athlete.medalCounts.silver += medalCount;
          } else if (medalType === "3") {
            athlete.medalCounts.bronze += medalCount;
          }
        });

      athletes.push(athlete);
    });

    // Pour chaque ligne dans le tableau athletes, si le nombre de médailles d'or est supérieur à 0, on incrémente le nombre de médailles d'or de la nation
    athletes.forEach((athlete) => {
      if (athlete.medalCounts.gold > 0) {
        nation.medalists.gold_medalist_count++;
      }

      if (athlete.medalCounts.silver > 0) {
        nation.medalists.silver_medalist_count++;
      }

      if (athlete.medalCounts.bronze > 0) {
        nation.medalists.bronze_medalist_count++;
      }
    });

    return nation;
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de la récupération des médailles par athlète :",
      error
    );
    return null;
  }
}

async function scrapeNations() {
  try {
    const nationLinks = await getNationsLinks(
      "https://olympics-statistics.com/nations"
    );
    // Pour chaque lien, on récupère les données de la nation
    for (const link of nationLinks) {
      const nation = await getNationMedalists(link);
      data.push(nation);
      console.log(`Les données de ${nation.nameCountry} ont été enregistrées`);
      // Pause de 5 secondes entre chaque requête pour éviter les erreurs 429
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    // Écrire les données dans un fichier JSON une fois que toutes les données ont été récupérées
    await writeDataToFile(data);
  } catch (error) {
    console.error(
      "Une erreur est survenue lors du scraping des nations :",
      error
    );
  }
}

// Lancer le scraping
scrapeNations();

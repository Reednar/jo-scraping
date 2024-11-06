import express from "express";
import fs from "fs";
const app = express();
// add comment for test ci
// Middleware pour servir les fichiers statiques (CSS, JS, etc.)
app.use(express.static("public"));

// Définir le moteur de modèle (ici, j'utilise EJS)
app.set("view engine", "ejs");

// Route pour afficher la page HTML avec les dataviz
app.get("/", (req, res) => {
  // Lire les fichiers JSON
  const data1 = JSON.parse(fs.readFileSync("athlete_data.json"));
  const data2 = JSON.parse(fs.readFileSync("nation_data.json"));
  const data3 = JSON.parse(fs.readFileSync("sport_data.json"));

  // Rendre la page HTML en utilisant le moteur de modèle (ici, EJS)
  res.render("index", { data1, data2, data3 });
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

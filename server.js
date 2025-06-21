const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB avec variable d'environnement
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1); // Arrête le serveur si pas connecté
});

// Schema & Model
const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true },
  immatriculation: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Fonction pour générer une immatriculation unique
function genererImmatriculation() {
  const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 3 }, () =>
    lettres.charAt(Math.floor(Math.random() * lettres.length))
  ).join('');
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  return `${randomLetters}-${randomNumbers}`;
}

// Route POST pour créer utilisateur + immatriculation
app.post('/api/immatriculation', async (req, res) => {
  const { pseudo } = req.body;
  if (!pseudo) return res.status(400).json({ error: 'Pseudo requis' });

  // Génère et vérifie unicité (loop si collision)
  let immatriculation;
  let exists;
  do {
    immatriculation = genererImmatriculation();
    exists = await User.findOne({ immatriculation });
  } while (exists);

  try {
    const newUser = new User({ pseudo, immatriculation });
    await newUser.save();
    res.json({ pseudo, immatriculation });
  } catch (err) {
    console.error('Erreur serveur:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

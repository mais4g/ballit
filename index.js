require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Conexão com o MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Conectado ao MongoDB"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Definição dos modelos
const teamSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true, trim: true },
    gritoDeGuerra: { type: String, required: true },
    anoDeFundacao: { type: Number, required: true },
    points: { type: Number, default: 50 },
    blots: { type: Number, default: 0 },
    plifs: { type: Number, default: 0 },
    advrunghs: { type: Number, default: 0 },
});

const matchSchema = new mongoose.Schema({
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    scoreA: { type: Number, default: 50 },
    scoreB: { type: Number, default: 50 },
    completed: { type: Boolean, default: false }, // Partida concluída
});


const Team = mongoose.model('Team', teamSchema);
const Match = mongoose.model('Match', matchSchema);

// Rotas
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para exibir times e formulário de cadastro
app.get('/teams', async (req, res) => {
    try {
        const teams = await Team.find();
        res.render('teams', { teams, error: null });
    } catch (error) {
        res.status(500).send("Erro ao carregar os times: " + error.message);
    }
});

// Rota para cadastrar um novo time
app.post('/teams/create', async (req, res) => {
    const { nome, gritoDeGuerra, anoDeFundacao } = req.body;

    try {
        if (!nome || !gritoDeGuerra || !anoDeFundacao) {
            return res.render('teams', { 
                teams: await Team.find(), 
                error: "Todos os campos são obrigatórios." 
            });
        }

        const teamExists = await Team.findOne({ nome: nome.trim() });
        if (teamExists) {
            return res.render('teams', { 
                teams: await Team.find(), 
                error: "Já existe um time com este nome." 
            });
        }

        const teamCount = await Team.countDocuments();
        if (teamCount >= 16) {
            return res.render('teams', { 
                teams: await Team.find(), 
                error: "O campeonato já atingiu o número máximo de 16 times." 
            });
        }

        const team = new Team({ 
            nome: nome.trim(), 
            gritoDeGuerra: gritoDeGuerra.trim(), 
            anoDeFundacao: parseInt(anoDeFundacao) 
        });
        await team.save();
        res.redirect('/teams');
    } catch (error) {
        res.status(500).send("Erro ao cadastrar time: " + error.message);
    }
});

// Rota para excluir um time
app.post('/teams/:id/delete', async (req, res) => {
    const { id } = req.params;

    try {
        await Team.findByIdAndDelete(id);
        res.redirect('/teams');
    } catch (error) {
        res.status(500).send("Erro ao excluir time: " + error.message);
    }
});

// Rota para iniciar o campeonato
app.get('/start', async (req, res) => {
    try {
        const teams = await Team.find();
        if (teams.length < 8 || teams.length > 16 || teams.length % 2 !== 0) {
            return res.status(400).send("O campeonato precisa de entre 8 e 16 times, e o número deve ser par.");
        }

        const shuffledTeams = teams.sort(() => 0.5 - Math.random());
        const matches = [];

        for (let i = 0; i < shuffledTeams.length; i += 2) {
            const match = new Match({ 
                teamA: shuffledTeams[i]._id, 
                teamB: shuffledTeams[i + 1]._id 
            });
            await match.save();
            matches.push(match);
        }

        const populatedMatches = await Match.find().populate('teamA teamB');
        res.render('phase', { matches: populatedMatches });
    } catch (error) {
        res.status(500).send("Erro ao iniciar o campeonato: " + error.message);
    }
});

// Rota para exibir os detalhes de uma partida
app.get('/match/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const match = await Match.findById(id).populate('teamA teamB');
        if (!match) {
            return res.status(404).send("Partida não encontrada.");
        }

        res.render('match', { match });
    } catch (error) {
        res.status(500).send("Erro ao carregar os detalhes da partida: " + error.message);
    }
});

// Rota para atualizar a pontuação de uma partida
app.post('/match/:id/update', async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;

    try {
        const match = await Match.findById(id).populate('teamA teamB');
        if (!match) {
            return res.status(404).send("Partida não encontrada.");
        }

        if (match.completed) {
            return res.status(400).send("Não é possível atualizar uma partida que já foi encerrada.");
        }

        // Aplicar a lógica de pontuação
        switch (action) {
            case 'teamA_plif':
                match.scoreA += 5;
                break;
            case 'teamA_adv':
                match.scoreA += 3;
                break;
            case 'teamA_blot':
                match.scoreA = Math.max(0, match.scoreA - 2);
                break;
            case 'teamB_plif':
                match.scoreB += 5;
                break;
            case 'teamB_adv':
                match.scoreB += 3;
                break;
            case 'teamB_blot':
                match.scoreB = Math.max(0, match.scoreB - 2);
                break;
        }

        await match.save();
        res.redirect(`/match/${id}`);
    } catch (error) {
        res.status(500).send("Erro ao atualizar a pontuação: " + error.message);
    }
});


// Rota para encerrar uma partida
app.post('/match/:id/end', async (req, res) => {
    const { id } = req.params;

    try {
        const match = await Match.findById(id);
        if (!match) {
            return res.status(404).send("Partida não encontrada.");
        }

        if (match.completed) {
            return res.status(400).send("A partida já foi encerrada.");
        }

        match.completed = true;
        await match.save();

        res.redirect('/start'); // Voltar para a fase atual ou para onde preferir
    } catch (error) {
        res.status(500).send("Erro ao encerrar a partida: " + error.message);
    }
});


// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

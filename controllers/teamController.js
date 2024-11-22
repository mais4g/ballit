const Team = require('../models/Team');

// Criar time
exports.createTeam = async (req, res) => {
    const { name, warCry, foundationYear } = req.body;

    if (!name || !warCry || !foundationYear) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    try {
        const team = await Team.create(req.body);
        res.status(201).json(team);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Já existe um time com este nome' });
        }
        res.status(500).json({ error: 'Erro ao cadastrar o time', details: error.message });
    }
};

// Listar todos os times
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find();
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar os times' });
    }
};

// Atualizar time
exports.updateTeam = async (req, res) => {
    const { id } = req.params;

    try {
        const team = await Team.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!team) {
            return res.status(404).json({ error: 'Time não encontrado' });
        }
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar o time', details: error.message });
    }
};

// Deletar time
exports.deleteTeam = async (req, res) => {
    const { id } = req.params;

    try {
        const team = await Team.findByIdAndDelete(id);
        if (!team) {
            return res.status(404).json({ error: 'Time não encontrado' });
        }
        res.status(200).json({ message: 'Time deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar o time', details: error.message });
    }
};

// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Rota para criar time
router.post('/teams', teamController.createTeam);

// Rota para listar todos os times
router.get('/teams', teamController.getAllTeams);

// Rota para atualizar time
router.put('/teams/:id', teamController.updateTeam);

// Rota para deletar time
router.delete('/teams/:id', teamController.deleteTeam);

module.exports = router;

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'O nome do time é obrigatório'], 
        unique: true, 
        trim: true 
    },
    warCry: { 
        type: String, 
        required: [true, 'O grito de guerra é obrigatório'], 
        trim: true 
    },
    foundationYear: { 
        type: Number, 
        required: [true, 'O ano de fundação é obrigatório'], 
        min: [1800, 'O ano de fundação deve ser maior que 1800'], 
        max: [new Date().getFullYear(), 'O ano de fundação não pode ser no futuro'] 
    },
    points: { 
        type: Number, 
        default: 50 
    },
    blots: { 
        type: Number, 
        default: 0 
    },
    plifs: { 
        type: Number, 
        default: 0 
    },
    advrunghs: { 
        type: Number, 
        default: 0 
    },
});

// Validação pré-save para prevenir valores inválidos
teamSchema.pre('save', function(next) {
    if (!this.name) {
        return next(new Error('O nome do time é obrigatório'));
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema);

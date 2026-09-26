import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'El título es obligatorio'],
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, 'La descripción es obligatoria'],
        trim: true 
    },
    category: { 
        type: String, 
        required: [true, 'La categoría es obligatoria'],
        trim: true 
    },
    date: { 
        type: Date, 
        required: [true, 'La fecha es obligatoria'] 
    },
    location: { 
        type: String, 
        required: [true, 'La ubicación es obligatoria'],
        trim: true 
    },
    capacity: { 
        type: Number, 
        required: [true, 'La capacidad es obligatoria'],
        min: [1, 'La capacidad debe ser mayor a 0'] 
    },
    price: { 
        type: Number, 
        default: 0,
        min: [0, 'El precio no puede ser negativo'] 
    },
    status: { 
        type: String, 
        enum: {
            values: ['draft', 'published', 'cancelled', 'finished'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'draft' 
    },
    organizer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users', 
        required: [true, 'El organizador es obligatorio'],
        immutable: true 
    }
}, { timestamps: true });

export const EventModel = mongoose.model('events', eventSchema);
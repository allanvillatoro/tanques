// grab the mongoose module
var mongoose = require('mongoose');

// define our nerd model
// module.exports allows us to pass this to other files when it is called
var tanqueSchema = mongoose.Schema({
	_id: String,
	descripcion: String,
	capacidad: Number, //puede ser 55 o 30 galones
	nivel: Number, //en galones
	fecha: { type: Date, default: Date.now },
	alarma: Boolean
});

tanqueSchema.methods.porcentaje = function () {
    return Number(this.nivel/this.capacidad*100).toFixed(1);
};

module.exports = mongoose.model('Tanque',tanqueSchema);
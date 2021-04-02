module.exports = function(app) {

//tomando el modelo
var Tanque = require('../models/Tanque');

//configurando pusher para notificaciones tiempo real
var Pusher = require('pusher');
var pusher = new Pusher({
	appId: 'myAppId',
	key: 'myKey',
	secret: 'mySecret',
	encrypted: true
});

//Configuraciones para envio de correos y mensajitos
var nodemailer = require('nodemailer');
//require the Twilio module and create a REST client 
var accountSid = 'myAccountSid';
var authToken = 'myAuthToken';
var clientTwilio = require('twilio')(accountSid, authToken);

///////ALARMAS///////

function enviarAlarmaSMS(tanque){
	var telefonos = ['+50498888888'];
	var texto = "Bajo nivel en tanque " + tanque._id +  ". Nivel actual = " + tanque.nivel + " galones. Porcentaje = " + tanque.porcentaje() + "%.";
	for (var i=0; i<telefonos.length; i++) {
		clientTwilio.messages.create({
			to: telefonos[i],
			from: "+12562026981",
			body: texto
		},function(err, message){
			console.log(message.sid);
		});
	}
}

function enviarAlarmaCorreo (tanque){
	// create reusable transporter object using the default SMTP transport
	var transporter = nodemailer.createTransport('smtps://myemail@gmail.com:mypassword@smtp.gmail.com');
	// setup e-mail data with unicode symbols
	var texto = "Bajo nivel en tanque " + tanque._id +  ". Nivel actual = " + tanque.nivel + " galones. Porcentaje = " + tanque.porcentaje() + "%.";
	var mailOptions = {
		from: '"My Name" <myemail@gmail.com>',
		to: 'youremail@gmail.com, youremail2@gmail.com',
		subject: 'Alarma activada en tanque', // Subject line
		text: texto, // plaintext body
		html: texto // html body
	};
	// send mail with defined transport object
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
		}
		else {
			console.log('Message sent: ' + info.response);
		}
	});
}

////////////////

//muestra todos los tanques
app.get('/api/tanques',function(req,res){
	Tanque.find(function (err, tanques) {
		if (err)
			res.status(500).send('Error en la base de datos');
		else
			res.status(200).json(tanques);
	});
});

//muestra un tanque
app.get('/api/tanques/:id',function(req,res){
	Tanque.findById(req.params.id,function(err, tanque) {
		if (err)
			res.status(500).send('Error en la base de datos');
		else{
			if (tanque != null)
				res.status(200).json(tanque);
			else
				res.status(404).send('No se encontro ese tanque');
            }
        });
});

//Modifica un tanque
app.post('/api/tanques/niveles',function(req,res){

	console.log(req.body);

	Tanque.findById(req.body.id_tanque,function(err, tanque) {
		if (err)
			res.status(500).send('Error en la base de datos');
		else{
			if (tanque != null){

				//tanque.descripcion = req.body.descripcion;
				//tanque.capacidad = req.body.capacidad; //puede ser 55 o 30 galones
				tanque.nivel = req.body.nivel; //en galones
				tanque.fecha = Date.now();

				//si el nivel no es negativo es que la lectura es correcta
				//si el nivel es -1 entonces la medicion esta incorrecta
				if (tanque.nivel >= 0)
				{
					//validacion del nivel
					if (tanque.nivel > tanque.capacidad)
						tanque.nivel = tanque.capacidad;
					//alarmas
					if (tanque.alarma == false && tanque.porcentaje()<=20){
						tanque.alarma = true;
						//IMPORTANTE VOLVER A HABILITAR ESTO!!
						enviarAlarmaSMS(tanque);
						enviarAlarmaCorreo(tanque);
					}
					else if (tanque.alarma == true && tanque.porcentaje()>20){
						tanque.alarma = false;
					}
				}
				
				tanque.save(function (error, tanque1) {
					if (error)
						res.status(500).send('Error en la base de datos');
					else {
						pusher.trigger('tanques', 'update', tanque1, function (error, request, response){
						});
						res.status(200).send('Modificado');
					}
				});
			}
			else
				res.status(404).send('No se encontro ese tanque.');
            }
        });
});

//agrega un tanque
app.post('/api/tanques',function(req,res){
	var nuevo = new Tanque({
		_id: req.body.id_tanque,
		descripcion: req.body.descripcion,
		capacidad: req.body.capacidad, //puede ser 55 o 30 galones
		nivel: req.body.nivel, //en galones
		fecha: Date.Now,
		alarma: false
	});

	if (nuevo.capacidad < 0)
		nuevo.capacidad = 0;

	if (nuevo.nivel > nuevo.capacidad)
		nuevo.nivel = nuevo.capacidad;
	if (nuevo.nivel < 0)
		nuevo.nivel = 0;

	if (nuevo.porcentaje() <= 20) {
		nuevo.alarma = true;
	}

	nuevo.save(function (error, tanque1) {
		if (error) {
			res.status(500).send('No se ha podido agregar.');
		}
		else {
			res.status(200).json('Agregado exitosamente'); //envía al cliente el id generado
		}
	});
});

};
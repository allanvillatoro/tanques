var app = angular.module('MainCtrl', ['TanqueService','AuthenticationService']);

app.filter('colores', function() {
    return function(aTanques, tipo) {
        var tanquesfiltrados = [];
        if (tipo == 0) { //tanques verdes
            for (var i=0; i<aTanques.length; i++){
                if (aTanques[i].nivel > aTanques[i].capacidad*0.2) //arriba del punto de reorden
                    tanquesfiltrados.push(aTanques[i]);
            }
        } else if (tipo == 1) { //tanques amarillos
            for (var i=0; i<aTanques.length; i++){
                if (aTanques[i].nivel > aTanques[i].capacidad*0.1 && aTanques[i].nivel <= aTanques[i].capacidad*0.2) //en reorden
                    tanquesfiltrados.push(aTanques[i]);
            }
        } else if (tipo == 2){ //tanques rojos
            for (var i=0; i<aTanques.length; i++){
                if (aTanques[i].nivel <= aTanques[i].capacidad*0.1 && aTanques[i].nivel >= 0) //en reorden
                    tanquesfiltrados.push(aTanques[i]);
            }
        } else { //modo error
            for (var i=0; i<aTanques.length; i++){
                if (aTanques[i].nivel < 0) //en reorden
                    tanquesfiltrados.push(aTanques[i]);
            }
        }
        return tanquesfiltrados;
    };
});

app.controller("mainController", ['$scope','Tanques','AuthService','coloresFilter','Pusher',function ($scope,Tanques,AuthService,coloresFilter,Pusher) {
    $scope.tanques = [];
    $scope.tanqueSeleccionado = {};
    $scope.tanquesVerdes = [];
    $scope.tanquesAmarillos = [];
    $scope.tanquesRojos = [];
    $scope.tanquesError = [];
    $scope.hayAlertas = false;
    $scope.hayErrores = false;
    $scope.mensajeAlerta = "";
    $scope.mensajeError = "";

    function filtrarTanques () {
        $scope.tanquesVerdes = coloresFilter($scope.tanques,0);
        $scope.tanquesAmarillos = coloresFilter($scope.tanques,1);
        $scope.tanquesRojos = coloresFilter($scope.tanques,2);
        $scope.tanquesError = coloresFilter($scope.tanques,3);

        var verdes = $scope.tanquesVerdes.length
        var amarillos = $scope.tanquesAmarillos.length;
        var rojos = $scope.tanquesRojos.length;
        var errores = $scope.tanquesError.length;

        //mostrando las alertas amarillas o rojas
        if (rojos == 1) {
            //mostrar la roja
            $scope.tipoAlerta = "alert-danger";
            if (amarillos == 1) {
                $scope.mensajeAlerta = "Hay un tanque vacío y uno en punto de reorden.";
            }
            else if (amarillos > 1) {
                $scope.mensajeAlerta = "Hay un tanque vacío y " + amarillos + " en punto de reorden.";
            }
            else{
                $scope.mensajeAlerta = "Hay un tanque vacío.";
            }
            $scope.hayAlertas = true;
        }
        else if (rojos > 1) {
            //mostrar la roja
            $scope.tipoAlerta = "alert-danger";
            if (amarillos == 1) {
                $scope.mensajeAlerta = "Hay "+ rojos +" tanques vacíos y uno en punto de reorden.";
            }
            else if (amarillos > 1) {
                $scope.mensajeAlerta = "Hay "+ rojos +" tanques vacíos y " + amarillos + " en punto de reorden.";
            }
            else{
                $scope.mensajeAlerta = "Hay "+ rojos +" tanques vacíos.";
            }
            $scope.hayAlertas = true;
        }
        else if (amarillos == 1) {
            //mostrar la amarilla
            $scope.tipoAlerta = "alert-warning";
            $scope.hayAlertas = true;
            $scope.mensajeAlerta = "Hay un tanque en punto de reorden.";
        }
        else if (amarillos > 1) {
            //mostrar la amarilla
            $scope.tipoAlerta = "alert-warning";
            $scope.hayAlertas = true;
            $scope.mensajeAlerta = "Hay " + amarillos + " tanques en punto de reorden.";
        }
        else {
            $scope.hayAlertas = false;
        }

        if (errores == 1) {
            $scope.hayErrores = true;
            $scope.mensajeError = "Hay un tanque sin medición.";
        }
        else if (errores > 1) {
            $scope.hayErrores = true;
            $scope.mensajeError = "Hay "+ errores +" tanques sin medición.";
        }
        else {
            $scope.hayErrores = false;
        }

        //mostrando los dropdown
        if (amarillos > 0) {
            $scope.hayAmarillos = true;
        } else {
            $scope.hayAmarillos = false;
        }
        if (rojos > 0) {
            $scope.hayRojos = true;
        } else {
            $scope.hayRojos = false;
        }
        if (verdes > 0){
            $scope.hayVerdes = true;
        } else {
            $scope.hayVerdes = false;
        }
        if (errores > 0){
            $scope.hayErrores = true;
        } else {
            $scope.hayErrores = false;
        }
    }

    $scope.seleccionarTanque = function (tanque) {
    	$scope.tanqueSeleccionado = tanque;
    	$scope.tanqueSeleccionado.porcentaje = function (){
            if (this.nivel >= 0)
    		    return this.nivel/this.capacidad*100;
            else
                return 0;
    	};
    	$scope.tanqueSeleccionado.cambiarColor = function() {
    		var percent = this.porcentaje();
    		if (percent <= 10) {
    			return "progress-bar-danger";
    		}
    		else if (percent <= 20) {
    			return "progress-bar-warning";
    		}
    		else {
    			return "progress-bar-info";
    		}
    	};
        $scope.tanqueSeleccionado.puntoReOrden = function() {
            return Number(this.capacidad*0.2).toFixed(1);
        }
        $scope.tanqueSeleccionado.puntoMinimo = function() {
            return Number(this.capacidad*0.1).toFixed(1);
        }
    }

    Pusher.subscribe('tanques', 'update', function (tanque) {
    // an item was updated. find it in our list and update it.
        for (var i = 0; i < $scope.tanques.length; i++) {
            if ($scope.tanques[i]._id === tanque._id) { //encuentra el tanque
                $scope.tanques[i] = tanque; //actualiza el tanque

                filtrarTanques();

                if (tanque._id == $scope.tanqueSeleccionado._id)
                	$scope.seleccionarTanque($scope.tanques[i]);
                
                break;
            }
        }
    });

    //eliminando suscripciones
    $scope.$on('$destroy', function () {
        Pusher.unsubscribe('tanques');
    });

    function llenarTabla () {
    	Tanques.getTanques() //promesa
    	.then(function(response) {
    		$scope.tanques = response.data;

            filtrarTanques();

    		if ($scope.tanques.length > 0) {
    			$scope.seleccionarTanque($scope.tanques[0]);
    		}
    	}, function(response) {
			console.log("Something went wrong");
		});
    }

    function getNombreUsuario () {
        AuthService.getUserName()
        .then(function(response) {
            console.log(response.data);
            $scope.nombreUsuario = response.data.user.username;
        }, function(response) {
            console.log("Something went wrong");
        });
    }

    llenarTabla();
    getNombreUsuario();
}]);
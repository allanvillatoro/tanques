angular.module('TanqueService', []).factory('Tanques', ['$http', function($http) {

	var obtener = function (){
		//esta es una promesa
		return $http({
			method : "GET",
			url : "/api/tanques"
		});
	};

	return {
		getTanques: obtener
	};
}]);
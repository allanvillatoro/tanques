var app = angular.module('myApp', ['ngRoute','doowb.angular-pusher','MainCtrl','LoginCtrl','LogoutCtrl']);

app.config(['$routeProvider', '$locationProvider','PusherServiceProvider', function($routeProvider, $locationProvider,PusherServiceProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'mainController',
            access: {restricted: true}
        })
        .when('/login', {
        	templateUrl: 'views/login.html',
        	controller: 'loginController',
        	access: {restricted: false}
        })
        .when('/logout', {
        	controller: 'logoutController',
        	access: {restricted: true}
        })
        .otherwise({
        	redirectTo: '/'
        });

    $locationProvider.html5Mode(true);

    PusherServiceProvider
        .setToken('myToken')
        .setOptions({});
}]);

app.run(function ($rootScope, $location, $route, AuthService) {
  $rootScope.$on('$routeChangeStart',
    function (event, next, current) {
      AuthService.getUserStatus()
      .then(function(){
        if (next.access.restricted && !AuthService.isLoggedIn()){
          $location.path('/login');
          $route.reload();
        }
      });
  });
});
app.controller("CartCtrl",["$scope","$firebaseAuth","$firebaseArray","$firebaseObject","CartDataService","Menu","User",
  function($scope ,$firebaseAuth ,$firebaseArray ,$firebaseObject, CartDataService,User){

var total = [];

var rootRef = firebase.database().ref();
var menus = rootRef.child("order");

$scope.cart = CartDataService.get();

CartDataService.get().forEach(function(order){
    let sub = order.quantity * order.price;
    total.push(sub);
    console.log("this is total "+total)
});



$scope.subtotal = function(price , quantity){
    var subtotal = price * quantity;
    return subtotal;
  };


$scope.getTotalPrice = function(){
// let totalPrice = 0;
//
// for(var i in total){
//     totalPrice += total[i];
// }
//   return totalPrice;
let totalPrice = total.reduce(add, 0);
  return totalPrice;
};

function add(a, b) {
    return a + b;
}

$scope.buy = function(cart){
  // cart.forEach(function(order){
  //   if(order.restaurant_id){
  //
  //   }
  // });
  console.log("carty");
  console.log(User.auth);
  console.log(cart);
};



}]);

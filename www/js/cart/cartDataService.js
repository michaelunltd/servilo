app.factory('CartData', function(){

  var cart = [];

  return {
    add: function(menu) {
        cart.push(menu);
    },
    get: function(){
      console.log("gagana permi");
      return cart;
    }

  }

})

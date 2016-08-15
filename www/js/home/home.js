app.controller('HomeTabCtrl', ["$scope","$ionicModal",
"$firebaseArray","currentAuth", "Restaurant", "Home" ,"$stateParams", "$state", "User", "$firebaseObject", "ionicMaterialInk",
function($scope, $ionicModal, $firebaseArray, currentAuth, Restaurant, Home, $stateParams, $state, User, $firebaseObject, ionicMaterialInk) {
  console.log('HomeTabCtrl');
  ionicMaterialInk.displayEffect();

    $scope.rating = {
      rate : 0,
      max: 5
    }

    $scope.$watch('rating.rate', function() {
      console.log('New value: '+$scope.rating.rate);
    });

    // $scope.RestaurantService = Restaurant;
    $scope.restaurants = Restaurant.all();
    $scope.getAvg = Restaurant.getAveragePrice;
    $scope.getAvgRating = Restaurant.getAverageRating;
    // $scope.getAvg = function(restaurantId){
    //   var getRealAvg = 1;
    //   Restaurant.getAveragePrice(restaurantId).then(function(value){
    //     console.log("RETURN VALUE ++"+value);
    //     // $scope.getAvg = value;
    //     getRealAvg = value;
    //     console.log("Scope get avg here "+ getRealAvg)
    //     // return value;
    //     return getRealAvg;
    //   })
    //
    // }


    $scope.getUserName = Home.getUserName;
    var id = $stateParams.restaurantId;
    var reviewRef = firebase.database().ref("restaurants/"+id+"/reviews");
    $scope.reviews = $firebaseArray(reviewRef);

    var userRfe = firebase.database().ref().child('users');
    $scope.userRfeObj = $firebaseArray(userRfe);



  if($state.is("tabs.viewRestaurant")){
  $scope.restaurant = Restaurant.get(id);
  console.log(id)
  }

  $scope.addReview = function(review) {
    console.log("added review");
    console.log("review rate:"+review.rating);
    var reviewRating = review.rating;
    $scope.reviews.$add({
      content: review.content,
      rating: review.rating,
      reviewer_id: User.auth().$id
    }).then(function(){
      console.log("Calling callback review");
      console.log("review rate after callback: "+reviewRating);
      var res = firebase.database().ref().child("restaurants").child(id);
      var sumRating = res.child("sumRating");
      var totalRatingCount = res.child("totalRatingCount");
      var avgRating = res.child("avgRate");
      var ratingObj = $firebaseObject(totalRatingCount);
      var top = 0;
      var bot = 0;

      sumRating.transaction(function(currentSum){
        top = currentSum + reviewRating;
        return top;
      })

      totalRatingCount.transaction(function(currentCount){
        bot = currentCount + 1;
        return bot;
      })

      avgRating.transaction(function(currentAmount){
        var avg = top/bot;
        return avg;
      })

    })
    review.content = '';
    review.rating = '';
    $scope.reviewModal.hide();
  }

  $scope.newReview = function() {
    console.log("new review clicked");
    $scope.reviewModal.show();
  }

  $scope.closeReview = function() {
    $scope.reviewModal.hide();
  }

  $ionicModal.fromTemplateUrl('templates/new-review.html', function(modalReview) {
    $scope.reviewModal = modalReview;
  }, {
    scope: $scope
  });

  if($state.is("tabs.viewRestaurant")){
    $scope.restaurant = Restaurant.get(id);
    console.log(id)
  }
}]);

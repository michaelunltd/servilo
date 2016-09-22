app.controller("RestaurantCtrl", ["$scope", "$firebaseArray", "$firebaseAuth", "User", "$ionicModal", "$ionicListDelegate", "Restaurant", "$cordovaCamera","$cordovaGeolocation", "$cordovaImagePicker",
  function($scope, $firebaseArray, $firebaseAuth, User, $ionicModal, $ionicListDelegate, Restaurant, $cordovaCamera, $cordovaGeolocation, $cordovaImagePicker){
  $scope.modalControl = {};
  $scope.restaurants = Restaurant.all();
  $scope.pendingRestaurants = Restaurant.getPendingRestaurants();
  $scope.displayRestaurants = Restaurant.getAuthUserRestaurants();
  $scope.AppUser = User.auth();
  $scope.restaurant = {
    openTime : new Date()
  }


  console.log($scope.AppUser)
  // user.$loaded().then(function() {
  //   if(user.displayName == undefined) {
  //     $scope.AppUser = user.firstName + " " + user.lastName;
  //   }
  //   else {
  //     console.log(user)
  //     $scope.AppUser = user.displayName;
  //   }
  // })

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("User:"+user.uid);
    } else {
      console.log("NOT LOGGED IN");
    }
  });

  $scope.images = [];

  $scope.multipleUpload = function() {
    var ref = firebase.database().ref().child("pictures");
    var list = $firebaseArray(ref);
    for (var i = 0; i < $scope.images.length; i++) {
      list.$add({ image: $scope.images[i] }).then(function(ref) {
        console.log("added..." + ref);
      });
    }
  }

  $scope.selImages = function() {
    var options = {
      maximumImagesCount: 10,
      width: 800,
      height: 800,
      quality: 80
    };

    $cordovaImagePicker.getPictures(options)
    .then(function (results) {
      // console.log(results);
      for (var i = 0; i < results.length; i++) {
        window.plugins.Base64.encodeFile(results[i], function(base64){
          $scope.images.push(base64);
        });
        console.log('Image URI: ' + results[i]);
      }
    }, function(error) {
      // error getting photos
    });
  };

  $scope.imageURL = "";
  $scope.upload = function(index) {
    var source = "";
    switch(index) {
      case 1:
        source = Camera.PictureSourceType.CAMERA;
        break;
      case 2:
        source = Camera.PictureSourceType.PHOTOLIBRARY;
        break;
    }
    var options = {
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : source,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      targetWidth: 500,
      targetHeight: 500,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.imageURL = imageData;
      // console.log(imageData);
        // syncArray.$add({image: imageData}).then(function() {
        //     alert("Image has been uploaded");
        // });

    }, function(error) {
        console.error(error);
    });
  }

  $scope.addRestaurant = function(restaurant){
    $scope.pendingRestaurants.$add({
      name: restaurant.name,
      location: restaurant.location,
      latitude: $scope.marker.coords.latitude,
      longitude: $scope.marker.coords.longitude,
      type: restaurant.type,
      cuisine: restaurant.cuisine,
      owner_id: User.auth().$id,
      // sumPrice: 0,
      // totalMenuCount: 0,
      // sumRating: 0,
      // totalRatingCount: 0,
      // avgRate: 0,
      image: $scope.imageURL,
      openTime: restaurant.openTime.getTime(),
      closeTime: restaurant.closeTime.getTime(),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      secured_data: {
        sumPrice: 0,
        totalMenuCount: 0,
        avgPrice: 0,
        sumRating: 0,
        totalRatingCount: 0,
        avgRate: 0
      }
    })

    $scope.restaurantModal.hide();
    restaurant.name = "";
    restaurant.location = "";
    restaurant.type = "";
    restaurant.cuisine = "";
  }

  $scope.edit = function(restaurant){
    var resRef = firebase.database().ref().child("restaurants").child(restaurant.$id);
    resRef.update({
      name: restaurant.name,
      location: restaurant.location,
      latitude: $scope.marker.coords.latitude,
      longitude: $scope.marker.coords.longitude,
      type: restaurant.type,
      cuisine: restaurant.cuisine
    })

    $scope.restaurantEditModal.hide();
    $ionicListDelegate.closeOptionButtons();
  }

  $ionicModal.fromTemplateUrl('templates/new-restaurant.html', function(modalRestaurant) {
    $scope.restaurantModal = modalRestaurant;
  }, {
    scope: $scope
  });

  $ionicModal.fromTemplateUrl('templates/edit-restaurant.html', function(modalEditRestaurant) {
    $scope.restaurantEditModal = modalEditRestaurant;
  }, {
    scope: $scope
  });

  $scope.editRestaurant = function(restaurant){
    $scope.showMap = false;
    $scope.restaurant = restaurant;
    $scope.restaurantEditModal.show();
    $scope.marker.coords = {latitude: restaurant.latitude, longitude: restaurant.longitude};
    $scope.modalControl.refresh({
      latitude: restaurant.latitude,
      longitude: restaurant.longitude
    });
  }

  $scope.closeEditRestaurant = function() {
    $scope.restaurantEditModal.hide();
  }

  $scope.newRestaurant = function() {
    $scope.restaurantModal.show();
    $scope.modalControl.refresh({
      latitude: 10.73016704689235,
      longitude: 122.54616022109985
    });
  };

  $scope.closeRestaurant = function() {
    $scope.restaurantModal.hide();
  }

  $scope.approveRestaurant = function(restaurant) {
    $scope.pendingRestaurants.$remove(restaurant).then(function() {
      $scope.restaurants.$add(restaurant)
        .then(function(restaurantObject) {
          var resRef = firebase.database().ref().child('restaurants').child(restaurantObject.key).child('timestamp');
          console.log("THIS IS THE FIRE BASE REF "+resRef);
          resRef.transaction(function(currentTimestamp) {
            var lolpe = firebase.database.ServerValue.TIMESTAMP;
            console.log('hello old timestamp ' + currentTimestamp);
            console.log('hello new timestamp ' + firebase.database.ServerValue.TIMESTAMP );
            return lolpe;
          })
        });
    })
  }

  $scope.marker ={id: 0};
  var options = {timeout: 10000, enableHighAccuracy: true};
  $cordovaGeolocation.getCurrentPosition(options).then(function(position){
    $scope.currentLocation = {latitude: position.coords.latitude,longitude: position.coords.longitude};
  });

  $scope.map = {
    center: { latitude: 10.73016704689235, longitude: 122.54616022109985 },
    zoom: 14, options: {scrollwheel: false},
    bounds: {},
    events: {
      click: function (map, eventName, originalEventArgs) {
        var e = originalEventArgs[0];
        var lat = e.latLng.lat(),lon = e.latLng.lng();
        var m = {
          id: Date.now(),
          coords: {
            latitude: lat,
            longitude: lon
          }
        };
        $scope.marker = m;
        $scope.$apply();
      }
    }
  };
  $scope.markLocation = function(){
    $scope.marker = {id: Date.now(), coords:{latitude:$scope.currentLocation.latitude,
      longitude: $scope.currentLocation.longitude}
    };
    $scope.map.center = { latitude: $scope.currentLocation.latitude, longitude:$scope.currentLocation.longitude };
  }
}])

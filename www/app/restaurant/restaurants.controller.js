app.controller("RestaurantCtrl", ["$scope", "Menu", "$firebaseArray", "$firebaseAuth", "User", "$ionicModal", "$ionicListDelegate", "Restaurant", "$cordovaCamera", "CordovaGeolocation", "Database", "Upload", "$ionicPopup",
  function($scope, Menu, $firebaseArray, $firebaseAuth, User, $ionicModal, $ionicListDelegate, Restaurant, $cordovaCamera, CordovaGeolocation, Database, Upload, $ionicPopup) {

    $scope.modalControl = {};
    $scope.restaurants = Restaurant.all();
    $scope.pendingRestaurants = Restaurant.getPendingRestaurants();
    // $scope.displayRestaurants = Restaurant.getAuthUserRestaurants();
    $scope.displayRestaurants = User.getAuthRestaurants();
    $scope.AppUser = User.auth();
    $scope.restaurant = {
      openTime: new Date()
    }

    // $scope.restaurant = Restaurant.get(restaurantId);


    console.log($scope.AppUser)
    $scope.showMap = function() {
      var mapPopup = $ionicPopup.confirm({
        title: 'Choose Location',
        templateUrl: 'app/restaurant/_googleMapsPopout.html',
        cssClass: 'custom-popup',
        scope: $scope
      });
      mapPopup.then(function(res) {
        if (res) {
          $scope.placeName($scope.marker.coords.latitude, $scope.marker.coords.longitude);
        }
      });
    };

    $scope.setHours = function() {
      var hoursPopup = $ionicPopup.confirm({
        title: 'Set Opening and Closing Hours',
        templateUrl: 'app/restaurant/_hoursPopout.html',
        cssClass: 'custom-popup',
        scope: $scope
      });
    };

    $scope.setFacilities = function() {
      var facilities = $ionicPopup.confirm({
        title: 'Set Facilities Offered',
        templateUrl: 'app/restaurant/_facilitiesPopout.html',
        subTitle: 'Amenities available for the customers in your restaurant.',
        cssClass: 'custom-popup',
        scope: $scope

      });
    };

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log("User:" + user.uid);
      } else {
        console.log("NOT LOGGED IN");
      }
    });

    $scope.changeServiceStatus = function(restaurant, service) {
      var resRef = Database.restaurantsReference().child(restaurant.$id).child('services').child(service.name);
      resRef.update({
        status: service.status
      })
    };

    $scope.changeAvailability = function(restaurant) {
      var resRef = Database.restaurantsReference().child(restaurant.$id);
      resRef.update({
        availability: restaurant.availability
      })
    };



    $scope.imageURL = "";
    $scope.upload = function(index) {
      var source = "";
      switch (index) {
        case 1:
          source = Camera.PictureSourceType.CAMERA;
          break;
        case 2:
          source = Camera.PictureSourceType.PHOTOLIBRARY;
          break;
      }
      var options = {
        quality: 75,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: source,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
      };
      $cordovaCamera.getPicture(options).then(function(imageData) {
        var restaurantRef = Upload.restaurant(imageData);
        $scope.progress = 1;
        restaurantRef.on('state_changed', function(snapshot) {
          var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          $scope.progress = progress;
        }, function(error) {
          console.log("error in uploading." + error);
        }, function() {
          //success upload
          $scope.imageURL = restaurantRef.snapshot.downloadURL;
          $scope.$apply();
        });

      }, function(error) {
        console.error(error);
      });
    }
    var metadata = {
      contentType: 'image/jpeg',
    };

    $scope.addRestaurant = function(restaurant) {
      $scope.pendingRestaurants.$add({
          name: restaurant.name.toLowerCase(),
          services: {
            online: {
              name: "online",
              status: false
            },
            reserve: {
              name: "reserve",
              status: false
            },
            cater: {
              name: "cater",
              status: false
            }
          },
          facilities: restaurant.facilities,
          location: restaurant.location,
          latitude: $scope.marker.coords.latitude,
          longitude: $scope.marker.coords.longitude,
          type: restaurant.type,
          cuisine: restaurant.cuisine,
          owner_id: User.auth().$id,
          photoURL: $scope.imageURL,
          phonenumber: restaurant.phonenumber,
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
        .then(() => {
          for (var facility in restaurant.facilities) {
            console.log(facility);
          }
        })

      restaurant.name = "";
      restaurant.location = "";
      restaurant.type = "";
      restaurant.cuisine = "";
      restaurant.phonenumber = "";
      restaurant.closeTime = "";
      $scope.imageURL = null;
      $scope.progress = null;
      $scope.restaurantModal.hide();
    }

    $scope.edit = function(restaurant) {
      var resRef = firebase.database().ref().child("restaurants").child(restaurant.$id);
      var OT = new Date(restaurant.openTime);
      var CT = new Date(restaurant.closeTime);
      resRef.update({
        name: restaurant.name,
        location: restaurant.location,
        latitude: $scope.marker.coords.latitude,
        longitude: $scope.marker.coords.longitude,
        facilities: restaurant.facilities,
        type: restaurant.type,
        cuisine: restaurant.cuisine,
        photoURL: $scope.imageURL,
        phonenumber: restaurant.phonenumber,
        openTime: OT.getTime(),
        closeTime: CT.getTime(),
      }).then(function() {
        $scope.imageURL = null;
      })

      $scope.restaurantEditModal.hide();
      $ionicListDelegate.closeOptionButtons();
    }

    $ionicModal.fromTemplateUrl('app/restaurant/_new-restaurant.html', function(restaurantModal) {
      $scope.restaurantModal = restaurantModal;
    }, {
      scope: $scope
    });

    $ionicModal.fromTemplateUrl('app/restaurant/_edit-restaurant.html', function(restaurantEditModal) {
      $scope.restaurantEditModal = restaurantEditModal;
    }, {
      scope: $scope
    });

    $ionicModal.fromTemplateUrl('app/menu/_add-category-modal.html', function(addCategoryModal) {
      $scope.addCategoryModal = addCategoryModal;
    }, {
      scope: $scope
    })

    // $ionicModal.fromTemplateUrl('app/menu/_add-menu.html', function(addMenuModal) {
    //   $scope.addMenuModal = addMenuModal;
    // }, {
    //   scope: $scope
    // });
    // $scope.showAddMenuModal = function(resId) {
    //   console.log("hello");
    //   console.log(resId);
    //   $scope.menu = {
    //     restaurant_id: resId
    //   }
    //   $scope.categories = $firebaseArray(Database.restaurantsReference().child(resId).child('menu_categories'));
    //   $scope.addMenuModal.show();
    // };
    // $scope.addMenu = function(menu) {
    //   var categoryId = menu.category;
    //   Menu.all().$add({
    //       name: menu.name.toLowerCase(),
    //       price: menu.price,
    //       restaurant_id: $scope.menu.restaurant_id,
    //       category_id: categoryId,
    //       availability: false,
    //       prevPrice: menu.price,
    //       photoURL: $scope.photoURL,
    //       timestamp: firebase.database.ServerValue.TIMESTAMP
    //     })
    //     .then(function(menuObj) {
    //       var restaurantRef = Database.restaurantsReference().child($scope.menu.restaurant_id);
    //       restaurantRef.child('menus').child(menuObj.key).set(true);
    //       restaurantRef.child('menu_categories').child(categoryId).child('menus').child(menuObj.key).set(true);
    //     })
    //     .catch(function(err) {
    //         console.log(JSON.stringify(err));
    //     } )
    //   $scope.addMenuModal.hide();
    // }
    $scope.showAddCategoryModal = function(resId) {
      console.log('show add category');
      console.log('restaurant id : ' + resId);
      $scope.category = {
        restaurant_id: resId
      }
      $scope.addCategoryModal.show();
    }

    $scope.addCategory = function(category) {
      categoryRef = Database.restaurantsReference().child(category.restaurant_id).child('menu_categories').push();
      categoryRef.set({
        name: category.name
      })
      $scope.category.name = "";
      $scope.category.restaurant_id = "";
      $scope.addCategoryModal.hide();
    }

    $scope.deleteRestaurant = function(restaurant) {
      var resObj = restaurant;
      $scope.displayRestaurants.$remove(resObj).then(function() {
        console.log('deleted?');
      });

      for (var menu in resObj.menus) {
        var menusRef = firebase.database().ref().child('menus');
        menusRef.child(menu).set(null);
      }

      for (var review in resObj.reviews) {
        var reviewsRef = firebase.database().ref().child('reviews');
        reviewsRef.child(review).set(null);
      }

      for (var reviewer in resObj.reviewers) {
        var userReviewedRestaurantsRef = firebase.database().ref().child('users').child(reviewer).child('reviewed_restaurants');
        console.log('reviewer ref' + userReviewedRestaurantsRef);
        userReviewedRestaurantsRef.child(resObj.$id).set(null);
      }

    }

    $scope.closeEditRestaurant = function() {
      $scope.restaurantEditModal.hide();
      $scope.imageURL = null;
    }

    $scope.newRestaurant = function() {
      $scope.restaurantModal.show();
      $scope.imageURL = null;
      $scope.modalControl.refresh({
        latitude: 10.73016704689235,
        longitude: 122.54616022109985
      });
    }

    $scope.editRestaurant = function(restaurant) {
      $scope.restaurantEditModal.show();
      $scope.showMap = false;
      $scope.eRestaurant = restaurant;
      if (restaurant.photoURL) {
        $scope.imageURL = restaurant.photoURL;
      } else {
        $scope.imageURL = null;
      }
      $scope.restaurantName = restaurant.name;
      $scope.marker.coords = {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude
      };
      $scope.modalControl.refresh({
        latitude: restaurant.latitude,
        longitude: restaurant.longitude
      });
    }

    $scope.closeEditRestaurant = function() {
      $scope.imageURL = null;
      $scope.restaurantEditModal.hide();
    }

    $scope.newRestaurant = function() {
      $scope.restaurantModal.show();
      $scope.modalControl.refresh({
        latitude: 10.73016704689235,
        longitude: 122.54616022109985
      });
    };

    $scope.approveRestaurant = function(restaurant) {
      $scope.pendingRestaurants.$remove(restaurant)
        .then(() => {
          $scope.restaurants.$add(restaurant)
            .then((restaurantObject) => {
              var resRef = firebase.database().ref().child('restaurants').child(restaurantObject.key).child('timestamp');
              resRef.transaction(function(currentTimestamp) {
                var newTimestamp = firebase.database.ServerValue.TIMESTAMP;
                console.log('hello old timestamp ' + currentTimestamp);
                console.log('hello new timestamp ' + firebase.database.ServerValue.TIMESTAMP);
                return newTimestamp;
              })
            })
            .catch((err) => {
              console.log(err)
            })
        })
        .catch((err) => {
          console.log(err)
        })
    }

    $scope.marker = {
      id: 0
    };
    $scope.isDetailCanMoveMarker = false;
    $scope.currentLocation = CordovaGeolocation.get();
    $scope.map = {
      center: {
        latitude: 10.73016704689235,
        longitude: 122.54616022109985
      },
      zoom: 14,
      options: {
        scrollwheel: false
      },
      bounds: {},
      events: {
        click: function(map, eventName, originalEventArgs) {
          var e = originalEventArgs[0];
          var lat = e.latLng.lat(),
            lon = e.latLng.lng();
          var m = {
            id: Date.now(),
            coords: {
              latitude: lat,
              longitude: lon
            }
          };
          $scope.marker = m;
          $scope.isDetailCanMoveMarker = false;
          $scope.placeName($scope.marker.coords.latitude, $scope.marker.coords.longitude);
          $scope.$apply();
        }
      }
    };

    $scope.markLocation = function() {
      $scope.currentLocation = CordovaGeolocation.get();
      $scope.isDetailCanMoveMarker = false;
      $scope.setMarker($scope.currentLocation.latitude, $scope.currentLocation.longitude);
      $scope.placeName($scope.marker.coords.latitude, $scope.marker.coords.longitude);
    }

    $scope.placeName = function(latitude, longitude) {
        var geocoder = new google.maps.Geocoder;
        var latLng = {
          lat: latitude,
          lng: longitude
        };
        geocoder.geocode({
          'location': latLng
        }, function(results, status) {
          if (status === 'OK') {
            $scope.restaurant.location = results[0].formatted_address;
            $scope.$apply();
          } else {
            alert('Geocoder failed due to: ' + status);
          }
        });
      }
      // function that check if you can change the marker and also to remove the digest problem
    $scope.locationDetail = function(detail) {
        if (angular.isDefined(detail) && $scope.isDetailCanMoveMarker) {
          var latitude = detail.lat();
          var longitude = detail.lng();
          if ($scope.marker.id == 0) {
            $scope.setMarker(latitude, longitude);
          } else if (($scope.marker.coords.latitude !== latitude) && ($scope.marker.coords.longitude !== longitude)) {
            $scope.setMarker(latitude, longitude);
          }
        }
      }
      //change the marker location
    $scope.setMarker = function(latitude, longitude) {
        $scope.marker = {
          id: Date.now(),
          coords: {
            latitude: latitude,
            longitude: longitude
          }
        };
        $scope.map.center = {
          latitude: latitude,
          longitude: longitude
        };
      }
      //
    $scope.allowDetailToChangeMarker = function() {
      $scope.isDetailCanMoveMarker = true;
    }

    $scope.facilities = $firebaseArray(firebase.database().ref().child('facilities'));
  }
])

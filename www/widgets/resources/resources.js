app.directive('resourcesResources', [
  "settings",
  "User",
  "$routeParams",
  "$location",
  "SessionService",
  "Course",
  function(
    settings,
    User,
    $routeParams,
    $location,
    SessionService,
    Course
    ) {
    return {
      templateUrl: settings.widgets + 'resources/resources.html',
      link: function(scope, element, attrs) {

          var session_user;
          var theLocation;
          var theLocationPath;
          scope.filterSelectedCourse;
          var url;
          scope.showAll = false;
          scope.title = "My resources";

          var setupResources = function() {
              scope.showAll = false;
              theLocationPath = $location.path();
              theLocation = theLocationPath.split("/");

              if(theLocation[1] === "resources") {
                  scope.showAll = true;
              } else {
                  //get the course url
                  for (var i = 0; i < theLocation.length; i++ ) {
                      if(theLocation[i] === "courses") {
                          url = theLocation[i+1];
                          break;
                      }
                  }
              }

                SessionService.getSession().success(function(response) {
                  scope.session_user = response.user;
                });

                scope.resourceList = [];
                scope.courseFilter = [];

              //get session_user
              SessionService.getSession().success(function(response){
                  session_user = response.user;
                  if(scope.showAll) {
                      getAllResources();
                  }
                  else {
                      //get current course
                      scope.title = "Resources";
                      Course.get({url: url, _populate: "resources"}, function(course){
                        var theCourse = course[0];
                          scope.resourceList= theCourse.resources;
                          for (var i = 0; i < theCourse.resources.length; i++) {
                              theCourse.resources[i].course = theCourse.name;
                          }
                      });
                  }
              });
          }

          function findWithAttr(array, attr, value) {
              for(var i = 0; i < array.length; i += 1) {
                  if(array[i][attr] === value) {
                      return i;
                  }
              }
          }

          var updateAuthor = function(i, x, mycourses)
          {

            //get author name
            User.get({_id: mycourses[i].resources[x].uploaded_by}, function(user)
             {

               for (var y = 0; y < scope.resourceList.length; y++) {
                 if(scope.resourceList[y].uploaded_by == user[0]._id)
                 {
                    scope.resourceList[y].author = (user[0].first_name + " " + user[0].last_name);
                 }

               }

               var indexOfResource = findWithAttr(scope.resourceList, "uploaded_by", mycourses[i].resources[x].uploaded_by);

               scope.resourceList[indexOfResource].author = (user[0].first_name + " " + user[0].last_name);

             });
          }

            var getAllResources = function()
            {

              scope.resourceList = [];
            
                if(scope.authForAdmin) {                    
                    Course.get({_populate:"resources"}, function(mycourses)
                        {
                            if (typeof mycourses !== "undefined")
                            {
                              for (var i = 0; i < mycourses.length; i++)
                              {
                                  if(typeof mycourses[i].resources !== "undefined")
                                  {
                                    scope.courseFilter.push(mycourses[i].name);

                                    for (var x = 0; x < mycourses[i].resources.length; x++)
                                    {
                                      mycourses[i].resources[x].course = mycourses[i].name;
                                      scope.resourceList.push(mycourses[i].resources[x]);

                                      updateAuthor(i, x, mycourses);

                                    } //lopp resources
                                } //if
                              } //lopp courses
                            } //if

                        });
                    
                } else {
                    SessionService.getSession().success(function(session) {

                    SessionService.updateSession(session.user.email).success(function(session) {
                      session_user[0] = session;

                        Course.get({students: session._id, _populate:"resources"}, function(mycourses)
                        {
                            if (typeof mycourses !== "undefined")
                            {
                              for (var i = 0; i < mycourses.length; i++)
                              {
                                  if(typeof mycourses[i].resources !== "undefined")
                                  {
                                    scope.courseFilter.push(mycourses[i].name);

                                    for (var x = 0; x < mycourses[i].resources.length; x++)
                                    {
                                      mycourses[i].resources[x].course = mycourses[i].name;
                                      scope.resourceList.push(mycourses[i].resources[x]);



                                      updateAuthor(i, x, mycourses);


                                    } //lopp resources
                                } //if
                              } //lopp courses
                            } //if

                        });
                     });
                  }); //sessionService
              }
         }

        scope.castTheResourceModal = function() {
          scope.$root.$broadcast('showTheResourceModal');
        };

        setupResources();
        scope.$root.$on('refreshResourceList', function() {
            setupResources();
        });

        scope.updateLocation = function(resourceUrl) {
            try {
                $location.path(theLocationPath + resourceUrl);
            } catch (e) {
                console.log(e);
            } 
        }
      } //link
    };
  }
]);

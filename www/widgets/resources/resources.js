app.directive('resourcesResources', [
  "settings",
  "User",
  "$routeParams",
    "SessionService",
    "Course",
  function(
    settings,
    User,
    $routeParams,
    SessionService,
     Course
    ) {
    return {
      templateUrl: settings.widgets + 'resources/resources.html',
      link: function(scope, element, attrs) {
          
          var isDone = false; 
          
        scope.resourceList = [];
        scope.courseFilter = [];

              //get session_user
              var session_user;
              SessionService.getSession().success(function(response){
                  session_user = response.user;
                  getResources();
              });
          
              scope.test = function() {
                  console.log(scope.s);
              }
                var getResources = function()
                {
                  //request user details, fallback if user changed
                  User.get({_id: session_user._id}, function(user){
                      
                      var courses = user[0].courses;

                      //loop the courses for resources
                      for(var i = 0; i < courses.length; i++) {
                    
                          Course.get({_id: courses[i], _populate: "resources"}, function(course) {
                              
                             
                              if(typeof course[0] !== "undefined"){
                                  
                                if(typeof course[0].resources !== "undefined"){
                              
                                  if (course[0].resources.length > 0) {
                                      scope.courseFilter.push(course[0].name);
                                      for (var x = 0; x < course[0].resources.length; x++)
                                          {
                                              course[0].resources[x].course = course[0].name;
                                              scope.resourceList.push(course[0].resources[x]); 
                                          }          

                                  } else {
                                      console.log("no resources found");
                                  }
                              
                                }
                              }
                          });                     
                      }
                  });
                }
     
          
      } //link
    };
  }
]);

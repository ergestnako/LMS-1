app.directive('slackSlackbox', [
  "settings",
  "ChatService",
  "User",
  "SessionService",
  "Course",
  "Channel",
  "$location",
  "$interval",
  function(
    settings,
    ChatService,
    User,
    SessionService,
    Course,
    Channel,
    $location,
    $interval
  ) {

    return {
      templateUrl: settings.widgets + 'slack/slackbox.html',
      link: function(scope, element, attrs) {

        var savedUser;

        var sendMessage = function(channelName, text, UserIdentifier, callback){

          var name = channelName;
          var obj = savedUser.courses.filter(function ( obj ) {
            return obj.code === name;
          })[0];

          ChatService.sendMessage(obj.slack_channels[0].channelId, text, UserIdentifier).success(function(response){
            console.log("Response", response);
            ChatService.getMessages(obj.slack_channels[0].channelId, UserIdentifier).success(function(response){
              console.log("Response", response);
              callback(response.messages);
              });
          });
        }

        //Get messages with callback
        var getMessages = function(channelName, UserIdentifier, callback){
          scope.messages = [];

          var name = channelName;
          var obj = savedUser.courses.filter(function ( obj ) {
            return obj.code === name;
          })[0];

           ChatService.getMessages(obj.slack_channels[0].channelId, UserIdentifier).success(function(response){
              console.log("Response", response);
              callback(response.messages);
            });
        }


        /* scope.toggleCreateSlackBar = function(){
          $interval.cancel(gmPromise);
        } */

        var courseGlobal;
        var gmPromise;
        scope.showChatBox = function(course) {

          courseGlobal = course;
          if(scope.course != undefined) {

            if (scope.course.messages != undefined)
              {
                scope.course.messages = undefined;
                }
                scope.course = undefined;
          }

            //slack connection depending on course
            scope.course = "";
            scope.course = course;
            scope.courseSelected = true;
            $interval.cancel(gmPromise);
            gmPromise = $interval(gm, 1000);

        }

        var gm = function(){
          getMessages(courseGlobal.code, savedUser.email, function(messages){
            scope.course.messages = "";
            scope.course.messages = messages;
          });
        }

        scope.sendM = function(){
          sendMessage(scope.course.code, scope.input, savedUser.email,function(messages){
            scope.course.messages = "";
            scope.course.messages = messages;
          });
          scope.input = "";
        }

        SessionService.getSession().success(function(response) {
          User.get({_id: response.user._id, _populate: "courses"}, function(user){

            var coursesWithToken = [];

            for (var i = 0; i < user[0].courses.length; i++) {
              if(user[0].courses[i].slack_channels != 0)
              {
                coursesWithToken.push(user[0].courses[i]);

                console.log(user[0].courses[i]);
              }
            }

            scope.courselist = coursesWithToken;
            savedUser = user[0];
          });
        });

        scope.toggleCreateSlackBar = function() {
          $interval.cancel(gmPromise);
          scope.isToolbarPersonalOpen = false;
          scope.isToolbarCreateSlackOpen = scope.isToolbarCreateSlackOpen === true ? false: true;
          scope.courseSelected = false;
        }
      }
    }
  }
]);

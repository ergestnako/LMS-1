app.directive('courseCreateCreatecourse', [
    "settings",
    "$location",
    "$window",
    "Course",
    "ChatService",
    "SessionService",
    "User",
  function(
    settings,
    $location,
    $window,
    Course,
    ChatService,
    SessionService,
    User
  ) {

    return {
      templateUrl: settings.widgets + 'course/create/createcourse.html',
      link: function(scope, element, attrs) {

        //get session_user
        scope.session_user;
        SessionService.getSession().success(function(response){
            scope.session_user = response.user;
        });

        // Updates the GUI according to edit/add-state
        scope.isEditing = false;
        scope.btnAddOrUpdate = 'Create course';

        var stepFinishedIndex = 0;
        scope.isCopying = 0;

        var AvailableCourses, oldcourse, selectedCourseName;

        AvailableCourses = Course.get();

        //This method creates a  slack channel via API and then updates the course
        //it needs to be connected to
        var createSlackChannelwithCourse = function(courseId, channelName, UserIdentifier){
          ChatService.createChannel(channelName, UserIdentifier).success(function(slackChannel){
            if(slackChannel.error != null){
              return;
            }

            ChatService.getChannels(UserIdentifier).success(function(channels){
              for(x = 0; x < channels.channels.length; x++){
                if(channels.channels[x].name == channelName){
                  Course.update({ _id : courseId } , {$push: { slack_channels: { channelId: channels.channels[x].id} } },
                  function (res)
                  {
                  });
                  break;
                }
              }
            });
          });
        }

        // Note: How to make it work when directive loads?
        // Gui function fetch selected course data for editing
        scope.prepareEditCourse = function (id){
            isEditingCourse = true;
            scope.btnAddOrUpdateTextCourse = 'Update';
            //get info from db to put in the form boxes
            scope.course = Course.getById(id);
            //scope.url = scope.course.url;
        };

        //Note: Update to dynamically load when revisits a ongoing creation
        //stores maximum steps allowed
        var stepsTaken = 0;

        //get session_user
        scope.session_user;
        SessionService.getSession().success(function(response){
            scope.session_user = response.user;
        });

        // Updates the GUI according to edit/add-state
        var isEditingCourse = false;
        scope.btnAddOrUpdate = 'Create course';

        var dateIsValid = function(start, end){
            return Date.parse(start) < Date.parse(end);
        }

        //Gui function add course
        scope.addOrUpdateCourse = function(){

        if(typeof scope.course.name !== 'undefined'){

            if(dateIsValid(scope.course.start, scope.course.end)){
              var result = AvailableCourses.filter(function( obj ) {
                return obj.name == selectedCourseName;
              });
              //scope.assignment.added_on = (new Date()).toJSON();

              if(scope.isEditing == 0){
                  if(scope.session_user.slack_token != undefined){

                      scope.course._id = undefined;
                      // Check slack channels before create
                      ChatService.getChannels(scope.session_user.email).success(function(callback){
                        var ok = true;

                        for (var i = 0; i < callback.channels.length; i++) {
                          if(callback.channels[i].name == scope.course.code){
                            console.log("There is already a slack channel with that code");
                            scope.errortext = true;
                            ok = false;
                            break;
                          }
                        }

                        if(ok){
                          tempName = scope.course.name.replace(/\s+/g, '');
                          tempCode = scope.course.code.replace(/\s+/g, '');
                          scope.course.url = tempCode + "_" + tempName;

                          Course.create(scope.course, function(course){
                              scope.$root.$broadcast('addedCourse');
                              oldcourse = JSON.parse(JSON.stringify(course[0]));
                              scope.incrementStep();

                              createSlackChannelwithCourse(course[0]._id, course[0].code, scope.session_user.email);
                              Course.update({_relate:{ items:course[0], creator:scope.session_user }},function(res){});
                              scope.isEditing = 1;
                              scope.btnAddOrUpdate = "Update course";
                          });
                        }
                      });

                  }
                  else{
                    console.log("You need to add your slack token");
                  }
              } else if (scope.isEditing == 1){

                    Course.update({_id: oldcourse._id},scope.course, function(res){
                        oldcourse = "";
                        oldcourse = JSON.parse(JSON.stringify(scope.course));
                        scope.incrementStep();
                    });
                }
              }
              else{
                console.log("please check start/end date");
              }
            }
          }


        //All the steps in the create course process, ng-switch states
        scope.steps = [{
              name: "Create or copy",
              icon: "fa-leaf",
          },{
              name: "Details",
              icon: "fa-i-cursor",
          },{
              name: "Preview",
              icon: "fa-eye",
          }];

          //All the steps in the create course process, ng-switch states
          scope.createsteps = [{
                name: "Create or copy",
                icon: "fa-leaf",
            },
            {
  						name: "Select course",
  						icon: "fa-file-text-o",
  					},
            {
                name: "Details",
                icon: "fa-i-cursor",
            },{
                name: "Preview",
                icon: "fa-eye",
            }];

            scope.courseSelect = {
              repeatSelect: null,
              availableOptions: AvailableCourses
          }


        //start out on step
        scope.selection = scope.steps[0].name;

        scope.getCurrentStepIndex = function(){
          if(scope.isCopying){
              // Find index of the current step by object name
              for(var i = 0; i < scope.createsteps.length; i += 1) {
                  if(scope.createsteps[i].name === scope.selection) {
                      return i;
                  }
              }
            } else {
              // Find index of the current step by object name
              for(var i = 0; i < scope.steps.length; i += 1) {
                  if(scope.steps[i].name === scope.selection) {
                      return i;
                  }
              }
            }
        }

        scope.setCreate = function() {
          scope.course = undefined;
          scope.isEditing = 0;
          scope.isCopying = 0;
          scope.btnAddOrUpdate = "Create course";
          console.log("Creating course");
          scope.incrementStep();
      }

      scope.setCopy = function() {
        scope.course = undefined;
        scope.isEditing = 0;
          scope.isCopying = 1;
          console.log("Copying course");
          scope.btnAddOrUpdate = "Create course";
          scope.incrementStep();
      }


      		       	// Move to a defined step index
      		        scope.goToStep = function(index) {
      			        // If you are going backwards in the flow: No worries
      			        if(scope.getCurrentStepIndex() > index){
      			        	console.log("Moving to step:", index, " from step:", scope.getCurrentStepIndex());
      			        	if(scope.isCopying){
      							           scope.selection = scope.createsteps[index].name;
      						    } else {
      							           scope.selection = scope.steps[index].name;
      						    }
      					}
      					// Going forwards in the flow
      					else {
      						// If you are going to a step that are finished
      						if(stepFinishedIndex >= index)
      						{
      							console.log("Moving to step:", index, " from step:", scope.getCurrentStepIndex());
      							if(scope.isCopying){
      								scope.selection = scope.createsteps[index].name;
      							} else {
      								scope.selection = scope.steps[index].name;
      							}
      						}
      					}
      		      }

        // Return true if step has next step, false if not
        scope.hasNextStep = function(){
            var stepIndex = scope.getCurrentStepIndex();
            var nextStep = stepIndex + 1;

            if(scope.isCopying){
              if(scope.createsteps[nextStep] == undefined) {
                  return false;
              }
              else {
                  return true;
              }
            } else {
              if(scope.steps[nextStep] == undefined) {
                  return false;
              }
              else {
                  return true;
              }
            }
        };

        // Return true if step has previous step, false if not
        scope.hasPreviousStep = function(){
            var stepIndex = scope.getCurrentStepIndex();
            var previousStep = stepIndex - 1;
            if(scope.steps[previousStep] == undefined) {
                return false
            }
            else {
                return true
            };
        };

        //move to next step
        scope.incrementStep = function() {
            if (scope.hasNextStep()){
        var stepIndex = scope.getCurrentStepIndex();
        var nextStep = stepIndex + 1;

        if(scope.isCopying){
          scope.selection = scope.createsteps[nextStep].name;
        } else {
          scope.selection = scope.steps[nextStep].name;
        }

        if(stepIndex >= stepFinishedIndex) {
            console.log("Step ", stepFinishedIndex, " done");
          stepFinishedIndex++;
        }
            }
        }

        //move to previous step
        scope.decrementStep = function() {
            if(scope.hasPreviousStep()){
              var stepIndex = scope.getCurrentStepIndex();
              var previousStep = stepIndex - 1;

              if(scope.isCopying){
                scope.selection = scope.createsteps[previousStep].name;
              } else {
                scope.selection = scope.steps[previousStep].name;
              }
              }
        }

        scope.loadDetails = function(){
          console.log("loading details");


          var obj = AvailableCourses.filter(function(obj){
            return obj.name === selectedCourseName;
          })[0];

          // var assignmentIndex = AvailableAssignments.indexOf(selectedAssignmentName);


          obj.end = new Date(obj.end);
          obj.start = new Date(obj.start);

          scope.course = obj;
            scope.incrementStep();

        }



        scope.selectCourseChanged = function (){
        selectedCourseName = scope.courseSelect.repeatSelect;
        console.log(selectedCourseName);
        }

        //create a new course and set GUI edit options //Not used??
        scope.createCourse = function(){
            Course.create(
            {
                status: true,
                code: scope.code,
                url: scope.url,
                name: scope.name,
                description: scope.description,
                end: scope.end,
                start: scope.start,
                creator: scope.session_user._id
            }, function(course)
                {
                    scope.$root.$broadcast('addedCourse');
                    //console.log("the role", scope.session_user.role)
                    if(scope.session_user.role === "teacher") {
                       stageMeToCourse();
                    }
                    //update GUI edit mode
                    scope.course = course[0];
                    scope.url = "/courses/" + scope.course.url;
                    isEditingCourse = true;
                    scope.btnAddOrUpdate = 'Update details';
                    scope.incrementStep();
                }
            );
        }

        //update a course
        scope.updateCourse = function(){
            //update current course in scope
            Course.update({
                _id: scope.course._id
              },{
                status: true,
                code: scope.code,
                url: scope.url,
                name: scope.name,
                description: scope.description,
                start: scope.start,
                end: scope.end

            });
            scope.url = "/courses/" + scope.course.url;
            scope.incrementStep();
        };

        //roate location
        scope.pathLocation = function() {
            Course.get({name: scope.course.name, description: scope.course.description, end: scope.course.end}, function(fetchedCourse){
        //scope.session_user._idconsole.log("fetched course: ", fetchedCourse);
        scope.$parent.hideModal();
        $window.location.href = '/courses/' + fetchedCourse[0].url;
         });
        }

        scope.closeModalSession = function() {
            scope.course = "";
            //use course for update and scope storage(?) ex. course.code
            scope.code ="";
            scope.url = "";
            scope.name = "";
            scope.description = "",
            scope.start = "",
            scope.end = "";
            scope.url = "";
            scope.selection = scope.steps[0].name;
            scope.$parent.hideModal();
        }
        
        scope.messageAdded = "";
        scope.studentsToBeAdded = [];
  	    var stageMeToCourse = function() {
  			  scope.studentsToBeAdded.push(scope.session_user);

  		      Course.get({url: scope.course.url},function(course){
                  Course.update({_relate:{items:course[0],students:scope.studentsToBeAdded}},function(res){
                      User.update({_relate:{items:scope.session_user,courses:course[0]}},function(newres){
                      //Add User to slack channel:
                        if(scope.session_user.slack_token != undefined) {
                            joinChannel(course[0].code, scope.session_user.email);
                        }
                          scope.$root.$broadcast('addedCourse');
                          scope.messageAdded = "You were added to the course";
                      });
                  });
              });
  	    }
        
        var joinChannel = function(channelName, UserIdentifier){
          ChatService.joinChannel(channelName, UserIdentifier).success(function(response){
          });
        }


      }//end link
    }
  }
]);

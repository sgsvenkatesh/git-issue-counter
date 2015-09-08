/**
 * Created by sgsvenkatesh on 9/7/15.
 */

function makeAjax(repoOwner, repoName, params, callback){
    var url;
    if(params.since == 0) {
        url = "https://api.github.com/repos/" + repoOwner + "/" + repoName;
        params = {};
    } else {
        url = "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/issues";
    }
    $.ajax({
        url: url,
        data: params,
        crossDomain: true,
        success: function (data, status, jqXHR) {
            callback(data);
        },
        error: function (jqXHR, status) {
            callback(null);
        }
    });
}

function getSinceTimeInISO(fromTimeInHours){
    if(fromTimeInHours) {
        var sinceTimeStamp = ($.now() - fromTimeInHours * 60 * 60 * 1000);
        return new Date(sinceTimeStamp).toISOString();
    } else {
        return 0;
    }
}

function validDataCount(data, sinceTime){
    return data.filter(function(obj){
        return new Date(obj["created_at"]).getTime() > new Date(sinceTime).getTime();
    }).length;
}

function populateTable(data){
    for(var key in data) {
        $("table.results").find("td." + key).text(data[key]);
    }
    $(".results-container").fadeIn();
}

function fetchIssues(thisForm, event){
    event.preventDefault();

    var el = document.createElement('a');
    el.href = thisForm['repoUrl'].value;
    var pathNameArray = el.pathname.split("/");

    var sinceTimeArray = [0, 24, 7*24];
    var countArray = [], counter = 0;

    sinceTimeArray.forEach(function(sinceTime){
        var params = {
            "since" : getSinceTimeInISO(sinceTime)
        };

        $(".loader").show();
        makeAjax(pathNameArray[1], pathNameArray[2], params, function(data){
            if(!data){
                countArray[counter] = 0;
            }

            if(params.since == 0) {
                countArray[counter] = data["open_issues_count"];
                console.log(countArray[counter]);
            } else {
                countArray[counter] = validDataCount(data, params.since);
                console.log(countArray[counter]);
            }

            if(counter == (sinceTimeArray.length - 1)){
                $(".loader").fadeOut(100, function(){
                    populateTable({
                        "all": countArray[0],
                        "lastDay": countArray[1],
                        "lastWeekButNotLastDay": countArray[2] - countArray[1],
                        "allButNotLastWeek": countArray[0] - countArray[2]
                    });
                });
            }
            counter++;
        });
    });
}
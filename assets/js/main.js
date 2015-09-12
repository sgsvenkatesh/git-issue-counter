/**
 * Created by sgsvenkatesh on 9/7/15.
 */

function makeAjax(repoOwner, repoName, sinceDate, callback){

    var url, searchParams = "";

    searchParams += repoName ? ("repo:" + repoOwner + "/" + repoName) : "";
    searchParams += sinceDate ? ("+created:>" + sinceDate) : "";
    searchParams += "+is:open+is:issue";

    url = "https://api.github.com/search/issues?q=" + searchParams;

    $.ajax({
        url: url,
        crossDomain: true,
        success: function (data, status, jqXHR) {
            callback(data);
        },
        error: function (jqXHR, status) {
            callback(null);
        }
    });
}

// coverts time in hours to ISO format
function getSinceTimeInISO(fromTimeInHours){
    if(fromTimeInHours) {
        var sinceTimeStamp = ($.now() - fromTimeInHours * 60 * 60 * 1000);
        return new Date(sinceTimeStamp).toISOString();
    } else {
        return 0;
    }
}

// filter out issues which are updated after since time and get issues which are created
// before since time
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

function checkURLValidity(urlHostname){
    if (!(urlHostname && (urlHostname == "www.github.com" || urlHostname == "github.com"))) {
        return false;
    }
    return true;
}

// on form submit function
function fetchIssues(thisForm, event){
    event.preventDefault();
    $(".results-container").hide();

    var el = document.createElement('a');
    el.href = thisForm['repoUrl'].value.trim();

    // Checking if URL is valid
    if(!checkURLValidity(el.hostname)){
        alert("Enter a valid GitHub Repository");
        return;
    }

    var pathNameArray = el.pathname.split("/"); //Array of url pathparams

    //time (in hours) since which the issues are being fetched
    var sinceTimeArray = [0, 24, 7*24]; // 0 implies all issues
    var countArray = [0, 0, 0], counter = 0;

    sinceTimeArray.forEach(function(sinceTime, idx){

        $(".loader").show();
        makeAjax(pathNameArray[1], pathNameArray[2], getSinceTimeInISO(sinceTime), function(data){
            if(!data){
                countArray[idx] = 0;
            }

            countArray[idx] += data["total_count"];

            if(idx == (sinceTimeArray.length - 1)){
                $(".loader").fadeOut(100, function(){
                    populateTable({
                        "all": countArray[0],
                        "lastDay": countArray[1],
                        "lastWeekButNotLastDay": parseInt(countArray[2],10) - parseInt(countArray[1],10),
                        "allButNotLastWeek": parseInt(countArray[0],10) - parseInt(countArray[2],10)
                    });
                });
            }
        });
    });
}

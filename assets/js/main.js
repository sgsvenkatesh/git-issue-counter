/**
 * Created by sgsvenkatesh on 9/7/15.
 */

var callCounter = 0, trackCounter = 0;

function makeAjax(repoConstants, params, callback, callbackParams){

    var url = "https://api.github.com/repos/" + repoConstants.repoOwner + "/" + repoConstants.repoName + "/issues";
    callCounter++;

    $.ajax({
        url: url,
        data: params,
        crossDomain: true,
        success: function (data, status, jqXHR) {
            callback(data, callbackParams);
        },
        error: function (jqXHR, status) {
            callback(null, callbackParams);
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
function filterForCreateDateAndOnlyIssues(data, sinceTime, idx){
    return data.filter(function(obj){
        if(idx == 0) {
            return !obj['pull_request'];
        } else {
            return !obj['pull_request'] && (new Date(obj["created_at"]).getTime() > new Date(sinceTime).getTime());
        }
    }).length;
}

function populateTable(data){
    for(var key in data) {
        $("table.results").find("td." + key).text(data[key]);
    }
    $(".results-container").fadeIn();
}

function checkURLValidity(urlHostname){
    if(urlHostname == "www.github.com" || urlHostname == "github.com"){
        return true;
    }
    return false;
}

function callbackOnSuccess(data, callbackParams){
    var countArray = callbackParams.countArray,
        idx = callbackParams.idx,
        repoConstants = callbackParams.repoConstants,
        params = callbackParams.params,
        sinceTimeArray = callbackParams.sinceTimeArray;

    if(!data){
        countArray[idx] = 0;
    } else {
        trackCounter++;
        countArray[idx] += filterForCreateDateAndOnlyIssues(data, params.since, idx);
        console.log(countArray[idx]);

        if(data.length == params.per_page){
            params.page = parseInt(params.page, 10) + 1;
            makeAjax(repoConstants, params, callbackOnSuccess, callbackParams);
        }
    }

    if(callCounter == trackCounter){
        $(".loader").fadeOut(100, function(){
            populateTable({
                "all": countArray[0],
                "lastDay": countArray[1],
                "lastWeekButNotLastDay": parseInt(countArray[2],10) - parseInt(countArray[1],10),
                "allButNotLastWeek": parseInt(countArray[0],10) - parseInt(countArray[2],10)
            });
        });
    }
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
    var repoConstants = {
        "repoOwner" : pathNameArray[1],
        "repoName" : pathNameArray[2]
    };

    //time (in hours) since which the issues are being fetched
    var sinceTimeArray = [0, 24, 7*24]; // 0 implies all issues
    var countArray = [0, 0, 0]; // initializing the array with zeroes

    sinceTimeArray.forEach(function(sinceTime, idx){
        var params = {
            "page": 1,
            "per_page": 100
        };

        if(sinceTime) {
            params["since"] = getSinceTimeInISO(sinceTime);
        }

        var callbackParams = {
            idx: idx,
            countArray: countArray,
            sinceTimeArray: sinceTimeArray,
            repoConstants: repoConstants,
            params: params
        };

        $(".loader").show();
        makeAjax(repoConstants, params, callbackOnSuccess, callbackParams);
    });
}

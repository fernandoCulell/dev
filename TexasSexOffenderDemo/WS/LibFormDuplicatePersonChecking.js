var logger = require("../log");
//The following are libraries for the phonetic and metic checking algorithms.
var alphasis = require("talisman/phonetics/alpha-sis");
var caverphone = require("talisman/phonetics/caverphone");
var daitchmokotoff = require("talisman/phonetics/daitch-mokotoff");
var doublemetaphone = require("talisman/phonetics/double-metaphone");
// var eudex = require('talisman/phonetics/eudex');
var fuzzy = require("talisman/phonetics/fuzzy-soundex");
var lein = require("talisman/phonetics/lein");
var metaphone = require("talisman/phonetics/metaphone");
var mra = require("talisman/phonetics/mra");
var nysiis = require("talisman/phonetics/nysiis");
var onca = require("talisman/phonetics/onca");
var phonex = require("talisman/phonetics/phonex");
var rogerroot = require("talisman/phonetics/roger-root");
var statcan = require("talisman/phonetics/statcan");
var mrametric = require("talisman/metrics/mra");
var dameraumetric = require("talisman/metrics/damerau-levenshtein");
var dicemetric = require("talisman/metrics/dice");
var jaccardmetric = require("talisman/metrics/jaccard");
var jarowinkmetric = require("talisman/metrics/jaro-winkler");

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "Demo";
    options.databaseAlias = "SexOffenderRegistry";
    options.userId = "demo.sexoffenderreg.api";
    options.password = "p";
    options.clientId = "60837839-7a6d-48e6-9898-6cf25a614b5b";
    options.clientSecret = "DvGkNsUs/L4u5GbtIZuPnh8MS/VE9P5NF3PmXP4n+n4=";
    return options;
};

module.exports.main = async function (ffCollection, vvClient, response) {
    /*Script Name:  LibFormDuplicatePersonChecking
     Customer:      VisualVault, Multi use.
     Purpose:       The purpose of this process is to use a series of checks to determine if a duplicate exists of a person within a dataset.
                    This is accomplished through several mechanisms.  This process will use a nickname/first name dataset, Soundex query against the data and 
                    using phonetic and metric string comparison algorithms against a dataset that has a similar identification mechanism such as a DOB.  
                    Data will be pulled from the existing VV data set and compared against the nickname/first name data
                    as well as pushed through the phonetic and metric comparison algorithms to see if the found names are matches or not.  The results will
                    return a list of records that are potential matches.  This is written in a way to look for persons with similar first name and last name
                    and to attempt to catch misspellings or other phonetic spellings of the same first name or last name to attempt to reduce duplicates.

     Prerequisites: The following are things that need to be in place to make this process run smoothly.
                        - You need a first name/nick name form template setup with the field title First Name.  This needs to be loaded with a list of comma separted names that are similar.
                        - Soundex Query for the form that will be queried.  The columns of this query need to match the columns of the following query.  Do not need where clause.
                        - Search Query for the form that will be queried for all records that have a similar identifier like DOB.  Columns need to match the soundex query.  Do not need where clause.
                        - If you are debugging this on your local machine, make sure Talisman npm is installed.
                        - You need to know the name of the First Name and Last Name fields so you can pass this information into the web service.


     Parameters:    The following represent variables passed into the web service:  
                    Input Parameter:
                    PersonObject - This will be an object name and identifier information.  Object is as follows:
                                        firstname:    First Name
                                        lastname:     Last Name 
                                        mi:           Middile Initial/Name 
                                        otheridquery: Other Identifier query  like [DOB] between '1980-10-31T00:05:32.000Z' AND '1980-11-05T00:05:32.000Z'.
                                                      This query will help to look for a range of records that have similar identifiers.  Then those records
                                                      will be pushed through the phonetic/metrics algorithm to determine if they are a potential person match. 
                    SoundexQueryName - This is the name of the Soundex Query that will be used against the given dataset.  Soundex query uses first name and last
                                       name soundex sql commands to looks for similar phonetic spelling of names.
                    SoundexWhereClause  - This is the where clause that would be typically used in a sql where clause except do not include the verb where.
                                            i.e. SOUNDEX([First Name]) = SOUNDEX('James');  Only using First and Last name to look for potential duplicates.
                    SearchQueryName - This is the name of the query that will be used to search using the other id query information to acquire a list of all
                                      persons who have a similar identifier.  The "Other Identifier" information passed in from the PersonObject will be used
                                      as filter criteria for this query.  The goal of this query is to get a small data set of persons who have a similar identifier
                                      Then run their names through the phonetic and metric algorithms to calculate a matching score.
                    NameOfFirstNameField - This is the name assigned to the first name field on the form template.  Pass in with the same case sensitivity that
                                            you would pass in if you ran getForm.  i.e.  First Name should be passed in as 'first Name'
                    NameOfLastNameField -  This is the name assigned to the last name field on the form template.  Pass in with the same case sensitivity that
                                            you would pass in if you ran getForm.  i.e.  Last Name should be passed in as 'last Name'

                    ***Note:***  Columns of 2 queries above should be the same so that the same data can be returned from this web service.  Queries should be defined
                    within the Database Connections area of VisualVault.

     Return Array:  The following represents the array of information returned to the calling function.
                    Any item in the array at points 3 or above can be used to return multiple items of information.
                    0 - Status: Success, Error
                    1 - Message: No duplicates found, Duplicates found
                    2 - Array: Array of Person Records that match.  The array should include the columns returned in the array.

     Pseudocode:   1.  Validate that First Name, Last Name and Other Identifier are present in Person Object.
                   2.  Validate that query names are present.
                   3.  Run logic to acquire list of first names/nick names that matche the first name passed into this process.
                   4.  Run Soundex query to look for records that match the first name and last name of the current person.
                   5.  Run Search Query to find other potential records that have a similar identifier like DOB to the current person.
                   6.  Compare acquired records for exact matches.  Push matches into a return array.
                   7.  Run remaining records through the phonetic and metric matching algorithms to identify other matches.  Push matches above the configured
                       threshold into the return array.
                   8.  Return the results to the client.

     Date of Dev:   04/24/2020
     Last Rev Date: 02/06/2021

     Revision Notes:
     04/24/2020 - Jason Hatch: Initial creation of the script
     04/27/2020 - Jason Hatch: Corrected some misspellings and minor items that would cause bugs.
     04/28/2020 - Jason Hatch: Updated path to the Talisman libraries because not working on data center node servers.
     02/06/2021 - Rocky Borg:  Updated getForms and getCustomQueryResultsByName calls to escape ' in passed in first and last name before making calls to SQL server.


     */

    logger.info("Start of the LibFormDuplicatePersonChecking at " + Date());

    //Configuration Variables
    let errorMessageGuidance = "Please try again or contact a system administrator if this problem continues.";
    let IndividualRecordTemplateID = "Offender Record";
    let phoneticMetricMinScore = 16; //This is the minimum score that indicates a probable match.
    let jaroMinScore = 0.65; //This is the minimum score on the JaroWinkler area that should consider a match.  Using this because it picks up stragglers that the overall score does not.
    let firstNameTemplateName = "zFirstNameLookup"; //Name of the form that holds all the records of the first names/nick name lookup.

    //Script Variables
    let errors = []; //Used to hold errors as they are found, to return together.
    let firstNameArr = [];
    let PersonObj = {};
    let SoundexQueryName = "";
    let SearchQueryName = "";
    let SoundexWhereClause = "";
    let NameOfFirstNameField = "";
    let nameOfLastNameField = "";
    let duplicateNameArr = [];
    let returnDuplicatePersonArr = [];

    //Initialization of the return object
    let outputCollection = [];

    try {
        let personVal = ffCollection.getFormFieldByName("PersonObject");
        let soundexQueryVal = ffCollection.getFormFieldByName("SoundexQueryName");
        let searchQueryVal = ffCollection.getFormFieldByName("SearchQueryName");
        let soundexQueryWhereVal = ffCollection.getFormFieldByName("SoundexWhereClause");
        let nameOfFirstNameField = ffCollection.getFormFieldByName("NameOfFirstNameField");
        let nameOfLastNameField = ffCollection.getFormFieldByName("NameOfLastNameField");

        //Following is to support testing this web service by itself.
        // let personVal = {
        //     name: "PersonObject",
        //     value: {
        //         aka: "",
        //         firstname: "Nancy",
        //         lastname: "Allen",
        //         mi: "",
        //         otheridquery: "[AKA] = 'Nancy' and [Last Name] = 'Allen'",
        //         secondotheriduery: "[AKA] = 'Allen' and [First Name] = 'Nancy'"
        //     }
        // }
        // let soundexQueryVal = {
        //     name: "SoundexQueryName",
        //     value: "zWebSvc Individual Soundex Query"
        // }
        // let searchQueryVal = {
        //     name: "SearchQueryName",
        //     value: "zWebSvc Individual Search Query"
        // }
        // let soundexQueryWhereVal = {
        //     name: "SoundexWhereClause",
        //     value: "(SOUNDEX([Last Name]) = SOUNDEX('Roderts') and (SOUNDEX([First Name]) = SOUNDEX('Nancy') or SOUNDEX([First Name]) = SOUNDEX(''))) or  (SOUNDEX([First Name]) = SOUNDEX('Nancy') and (SOUNDEX([Last Name]) = SOUNDEX('Allen') or SOUNDEX([Last Name]) = SOUNDEX('')))"
        // }
        // let nameOfFirstNameField = {
        //     name: "NameOfFirstNameField",
        //     value: "first Name"
        // }
        // let nameOfLastNameField = {
        //     name: "NameOfLastNameField",
        //     value: "last Name"
        // }

        //The following are functions that are used to support the core of this web service.

        var CalculateMatchScore = function (passedWord, compareString) {
            let score = 0; //The score is incremented every time there is a phonetic match.  It is incremented using a weighted scale when metric matches are closer.
            let jaroScore = 0; //This is the jaroScore that needs to be returned.

            if (alphasis(passedWord)[0] == alphasis(compareString)[0]) {
                score++;
            }

            if (caverphone(passedWord)[0] == caverphone(compareString)[0]) {
                score++;
            }

            if (daitchmokotoff(passedWord)[0] == daitchmokotoff(compareString)[0]) {
                score++;
            }

            if (doublemetaphone(passedWord)[0] == doublemetaphone(compareString)[0]) {
                score++;
            }

            // if (eudex(passedWord)[0] == eudex(compareString)[0]) {
            //     //score++;
            // }

            if (fuzzy(passedWord)[0] == fuzzy(compareString)[0]) {
                score++;
            }

            if (lein(passedWord)[0] == lein(compareString)[0]) {
                score++;
            }

            if (metaphone(passedWord)[0] == metaphone(compareString)[0]) {
                score++;
            }

            if (mra(passedWord)[0] == mra(compareString)[0]) {
                score++;
            }

            if (nysiis(passedWord)[0] == nysiis(compareString)[0]) {
                score++;
            }

            if (onca(passedWord)[0] == onca(compareString)[0]) {
                score++;
            }

            // When comparing h to a (single letters), the following would not do a phonex on h.
            if (compareString.length > 2) {
                if (phonex(passedWord)[0] == phonex(compareString)[0]) {
                    score++;
                }
            }

            if (rogerroot(passedWord)[0] == rogerroot(compareString)[0]) {
                score++;
            }

            if (statcan(passedWord)[0] == statcan(compareString)[0]) {
                score++;
            }

            //Will not compare letters, must be strings.
            if (compareString.length > 2) {
                var mrametricResult = mrametric(passedWord, compareString);
                if (mrametricResult != null) {
                    if (mrametricResult.matching == true && mrametricResult != null) {
                        score++;
                    }
                }

                var damerauResult = dameraumetric(passedWord, compareString);
                if (damerauResult != null) {
                    if (damerauResult == 0) {
                        //equals exact match.
                        score++;
                    }
                }

                var diceResult = dicemetric(passedWord, compareString);
                if (diceResult != null) {
                    if (diceResult == 1) {
                        //equals exact match.
                        score++;
                    }
                }

                var jaccardResult = jaccardmetric(passedWord, compareString);
                if (jaccardResult != null) {
                    if (jaccardResult == 1) {
                        //equals exact match.
                        score++;
                    }
                }

                var jarowinkResult = jarowinkmetric(passedWord, compareString);
                jaroScore = jarowinkResult;
                if (jarowinkResult != null) {
                    if (jarowinkResult == 1) {
                        //equals exact match.

                        score++;
                    }
                }
            }
            //Return the calculated score and the Jaro Winkler score to the calling function.
            var scoreArr = [];
            scoreArr.push(score);
            scoreArr.push(jaroScore);
            return scoreArr;
        };

        //The following will get the list of names.
        //This function is going against a form and imported list of First Names.  Should not need to handle a different name because coming from same dataset.
        var GetNameList = async function (FirstName) {
            var queryString = {};
            queryString.q = "[First Name] LIKE '" + "%" + FirstName.replace(/'/g, "\\'") + "%" + "'";
            queryString.expand = true;
            //Run a query against the first name/nick name dataset to get all names that are derivations of the current name.
            let returnedNames = await vvClient.forms.getForms(queryString, firstNameTemplateName);
            returnedNames = JSON.parse(returnedNames);
            if (returnedNames.meta.status == 200) {
                //parse data returned into individual elements of an array.
                if (returnedNames.data.length > 0) {
                    returnedNames.data.forEach(function (elem) {
                        var resultArr = [];
                        resultArr = elem["first Name"].split(",");
                        resultArr.forEach(function (item) {
                            firstNameArr.push(item);
                        });
                    });
                    return true;
                }
            } else {
                throw new Error("An error was encountered when attempting to get names from first name list.");
            }
        };

        //Function to remove duplicates from an array.
        function removeDuplicates(array) {
            let unique = [];
            array.forEach(function (element) {
                //use some to look for unique docids and load them into the unique array.
                if (!unique.some((uniqueitem) => uniqueitem.dhdocid === element.dhdocid)) {
                    unique.push(element);
                }
            });
            return unique;
        }

        // 1.  Validate that First Name, Last Name and Other Identifier are present in Person Object.
        // 2.  Validate that query names are present.
        if (!personVal) {
            //|| !personVal.value
            errors.push("PersonObject was not passed into the web service.");
        } else if (!personVal.value) {
            errors.push("PersonObject is not loaded with values.");
        } else {
            PersonObj = personVal.value;
            if (typeof PersonObj != "undefined") {
                //PersonObj object found
                //Oject found.  Now test key properties that they are present.
                if (!PersonObj.hasOwnProperty("firstname")) {
                    //Verify if property is present.
                    errors.push("firstname property is not available in the PersonObject.");
                } else if (PersonObj.firstname.trim().length == 0) {
                    //Verify if a value was entered.
                    errors.push("firstname property needs a value in the PersonObject.");
                }

                if (!PersonObj.hasOwnProperty("lastname")) {
                    //Verify if property is present.
                    errors.push("lastname property is not available in the PersonObject.");
                } else if (PersonObj.lastname.trim().length == 0) {
                    //Verify if a value was entered.
                    errors.push("lastname property needs a value in the PersonObject.");
                }

                // if (!PersonObj.hasOwnProperty('aka')) {  //Verify if property is present.
                //     errors.push('aka property is not available in the PersonObject.');
                // }
                // else if ((PersonObj.aka.trim()).length == 0) {  //Verify if a value was entered.
                //     errors.push('aka property needs a value in the PersonObject.');
                // }

                if (!PersonObj.hasOwnProperty("otheridquery")) {
                    //Verify if property is present.
                    errors.push("otheridquery property is not available in the PersonObject.");
                } else if (PersonObj.otheridquery.trim().length == 0) {
                    //Verify if a value was entered.
                    errors.push("otheridquery property needs a value in the PersonObject.");
                }
            } else {
                errors.push("PersonObject was not passed in as an object.");
            }
        }

        if (!soundexQueryVal) {
            //Verify if parameter exists.
            errors.push("SoundexQueryName parameter was not passed in.");
        } else {
            SoundexQueryName = soundexQueryVal.value;
            if (SoundexQueryName.trim().length == 0) {
                //Verify if a value was passed in.
                errors.push("Name of the Soundex query was not present.");
            }
        }

        if (!soundexQueryWhereVal) {
            //Verify if parameter exists.
            errors.push("SoundexWhereClause parameter was not passed in.");
        } else {
            SoundexWhereClause = soundexQueryWhereVal.value;
            if (SoundexWhereClause.trim().length == 0) {
                //Verify if a value was passed in.
                errors.push("Where clause for Soundex query was not present.");
            }
        }

        if (!searchQueryVal) {
            //Verify if parameter exists.
            errors.push("SearchQueryName parameter was not passed in.");
        } else {
            SearchQueryName = searchQueryVal.value;
            if (SearchQueryName.trim().length == 0) {
                //Verify if a value was passed in.
                errors.push("Name of the search query query was not present.");
            }
        }

        if (!nameOfFirstNameField) {
            //Verify if parameter exists.
            errors.push("NameOfFirstNameField parameter was not passed in.");
        } else {
            NameOfFirstNameField = nameOfFirstNameField.value;
            if (NameOfFirstNameField.trim().length == 0) {
                //Verify if a value was passed in.
                errors.push("Name of the First Name was not present.");
            }
        }

        if (!nameOfLastNameField) {
            //Verify if parameter exists.
            errors.push("NameOfLastNameField parameter was not passed in.");
        } else {
            NameOfLastNameField = nameOfLastNameField.value;
            if (NameOfLastNameField.trim().length == 0) {
                //Verify if a value was passed in.
                errors.push("Name of the Last Name Field was not present.");
            }
        }

        //Validation of parameters passed in encountered errors.  If they did, then return errors to the calling function.
        if (errors.length > 0) {
            throw new Error("Errors occurred with parameters passed into the web service.");
        }

        // 3.  Run logic to acquire list of first names/nick names that are known common names.
        let nameCallResult = await GetNameList(PersonObj.firstname);

        // 4.  Run Soundex query to look for records that match the first name and last name of the current person.
        SoundexWhereClause = SoundexWhereClause.replace(PersonObj.firstname, PersonObj.firstname.replace(/'/g, "''"));
        SoundexWhereClause = SoundexWhereClause.replace(PersonObj.lastname, PersonObj.lastname.replace(/'/g, "''"));
        SoundexWhereClause = SoundexWhereClause.replace(PersonObj.aka, PersonObj.aka.replace(/'/g, "''"));

        let queryparams = { filter: SoundexWhereClause };
        let soundexQueryResult = await vvClient.customQuery.getCustomQueryResultsByName(SoundexQueryName, queryparams);
        let recordResults = JSON.parse(soundexQueryResult);

        if (recordResults.meta.status == 200 && recordResults.data.length > 0) {
            //Extract Record Information.  Any items from Soundex query are considered duplicates.
            recordResults.data.forEach(function (item) {
                duplicateNameArr.push(item);
            });
        } else if (recordResults.meta.status == 200 && recordResults.data.length == 0) {
            //Results were OK, not in an error state.
        } else {
            //encountered an error state.  Throw hard error as it might be an issue with the query provided and needs to be resolved.
            throw new Error("Soundex query could not run.  Status code was " + recordResults.meta.status);
        }

        // 5.  Run Search Query to find other potential records that have a similar identifier like DOB to the current person.
        // 6.  Compare acquired records for exact matches.  Push matches into a return array.
        // 7.  Run remaining records through the phonetic and metric matching algorithms to identify other matches.  Push matches above the configured
        //     threshold into the return array.

        // let searchqueryparams = { filter: PersonObj.otheridquery };
        // //let searchqueryparams = { filter: "[AKA] = '" + PersonObj.firstname +"'" };
        // let searchQueryResult = await vvClient.customQuery.getCustomQueryResultsByName(SearchQueryName, searchqueryparams);
        // let searchResults = JSON.parse(searchQueryResult);

        let duplicateQueryObj = {
            q: PersonObj.otheridquery,
            expand: true,
        };

        let searchQueryResult = await vvClient.forms.getForms(duplicateQueryObj, IndividualRecordTemplateID);
        searchQueryResult = JSON.parse(searchQueryResult);
        let searchQueryData = searchQueryResult.hasOwnProperty("data") ? searchQueryResult.data : null;

        if (searchQueryResult.meta.status !== 200) {
            throw new Error(`There was an error when calling getIndRec. ${errorMessageGuidance}`);
        }
        if (searchQueryData === null) {
            throw new Error(`Data was not able to be returned when calling getIndRec. ${errorMessageGuidance}`);
        }

        if (searchQueryResult.meta.status == 200 && searchQueryData.length > 0) {
            //Extract Record Information
            //searchResults.data.forEach(function (item)
            // for (const item of searchQueryData) {
            //     let firstNameMatch = false;
            //     let lastNameMatch = false;
            //     //Calulcate match score on first name and see if it matches based on thresholds.
            //     let resultFirstArr = CalculateMatchScore(PersonObj.firstname, item["aka"]);
            //     if (resultFirstArr[0] >= phoneticMetricMinScore || resultFirstArr[1] >= jaroMinScore) {
            //         firstNameMatch = true;
            //     }
            //     //Compare against list of known common first names.
            //     firstNameArr.forEach(function (nameItem) {
            //         let nickNameScoreArr = CalculateMatchScore(nameItem, item["aka"]);
            //         if (nickNameScoreArr[0] >= phoneticMetricMinScore || nickNameScoreArr[1] >= jaroMinScore) {
            //             firstNameMatch = true;
            //         }
            //     })
            //     //Calculate match score for last name and see if it matches based on thresholds.
            //     let resultLastArr = CalculateMatchScore(PersonObj.lastname, item["aka"]);
            //     if (resultLastArr[0] >= phoneticMetricMinScore || resultLastArr[1] >= jaroMinScore) {
            //         lastNameMatch = true;
            //     }
            //     //If both first and last names match within the threshholds of the test, then add to duplicate array.
            //     if (firstNameMatch == true && lastNameMatch == true) {
            //         duplicateNameArr.push(item);
            //     }
            // }
        } else if (searchQueryResult.meta.status == 200 && searchQueryResult.data.length == 0) {
            //Results were OK, not in an error state.
        } else {
            //encountered an error state.  Throw hard error as it might be an issue with the query provided and needs to be resolved.
            throw new Error("Soundex search query cound not run.  Status code was " + recordResults.meta.status);
        }

        let secondsearchqueryparams = { filter: PersonObj.secondotheriduery };
        let secondSearchQueryResult = await vvClient.customQuery.getCustomQueryResultsByName("zWebSvc Individual Second Search Query", secondsearchqueryparams);
        let secondSearchResults = JSON.parse(secondSearchQueryResult);

        let duplicateSecondQueryObj = {
            q: PersonObj.secondotheridquery,
            expand: true,
        };

        let secondSearchResult = await vvClient.forms.getForms(duplicateSecondQueryObj, IndividualRecordTemplateID);
        secondSearchResult = JSON.parse(secondSearchResult);
        let secondSearchData = secondSearchResult.hasOwnProperty("data") ? secondSearchResult.data : null;

        if (secondSearchResult.meta.status !== 200) {
            throw new Error(`There was an error when calling getIndRec. ${errorMessageGuidance}`);
        }
        if (secondSearchData === null) {
            throw new Error(`Data was not able to be returned when calling getIndRec. ${errorMessageGuidance}`);
        }

        if (secondSearchResult.meta.status == 200 && secondSearchData.length > 0) {
            //Extract Record Information
            //secondSearchResults.data.forEach(function (item)
            for (const item of secondSearchData) {
                let firstNameMatch = false;
                let lastNameMatch = false;
                //Calulcate match score on first name and see if it matches based on thresholds.
                let resultFirstArr = CalculateMatchScore(PersonObj.firstname, item[NameOfFirstNameField]);
                if (resultFirstArr[0] >= phoneticMetricMinScore || resultFirstArr[1] >= jaroMinScore) {
                    firstNameMatch = true;
                }

                //Compare against list of known common first names.
                firstNameArr.forEach(function (nameItem) {
                    let nickNameScoreArr = CalculateMatchScore(nameItem, item[NameOfFirstNameField]);
                    if (nickNameScoreArr[0] >= phoneticMetricMinScore || nickNameScoreArr[1] >= jaroMinScore) {
                        firstNameMatch = true;
                    }
                });

                //Calculate match score for last name and see if it matches based on thresholds.
                let resultLastArr = CalculateMatchScore(PersonObj.lastname, item[NameOfLastNameField]);

                if (resultLastArr[0] >= phoneticMetricMinScore || resultLastArr[1] >= jaroMinScore) {
                    lastNameMatch = true;
                }

                //If both first and last names match within the threshholds of the test, then add to duplicate array.
                if (firstNameMatch == true && lastNameMatch == true) {
                    duplicateNameArr.push(item);
                }
            }
        } else if (secondSearchResult.meta.status == 200 && secondSearchResult.data.length == 0) {
            //Results were OK, not in an error state.
        } else {
            //encountered an error state.  Throw hard error as it might be an issue with the query provided and needs to be resolved.
            throw new Error("Soundex second search query cound not run.  Status code was " + recordResults.meta.status);
        }

        // 8.  Return the results to the client.

        //Logic to get a unique list of records to return to the calling web service.
        returnDuplicatePersonArr = removeDuplicates(duplicateNameArr);

        //Load response information.
        if (returnDuplicatePersonArr.length == 0) {
            outputCollection[1] = "No duplicates found";
            outputCollection[2] = [];
        } else if (returnDuplicatePersonArr.length > 0) {
            outputCollection[1] = "Duplicates found";
            outputCollection[2] = returnDuplicatePersonArr;
        }

        outputCollection[0] = "Success";
    } catch (error) {
        console.log(error);
        // Log errors captured.
        logger.info(JSON.stringify(error.message));
        outputCollection[0] = "Error";
        if (errors.length > 0) {
            outputCollection[1] = error.message + " " + errors.join(" ");
        } else {
            outputCollection[1] = error.message;
        }
    } finally {
        response.json(200, outputCollection);
    }
};

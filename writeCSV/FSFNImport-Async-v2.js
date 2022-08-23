var logger = require('../log');
var Q = require('q');
var csv = require('csv'); //WARNING: Need to install the "csv" module on the node server for this to work. -npm install csv@1.1.0
var fs = require('fs');
var moment = require('moment'); //WARNING: Need to install the "moment" module on the node server for this to work. -npm install moment
var Buffer = require('buffer');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = 'CBCCF';
    options.databaseAlias = 'Default';
    options.userId = 'cbccf.api';
    options.password = 'p';
    options.clientId = '287c24a6-f993-4378-a8d4-b97c2cc0c120';
    options.clientSecret = 'rKTnPS7our4KgOKNVN6HMbNV6eeX+NgCp+fYLoa0tf0=';
    return options;
};

module.exports.main = async function (vvClient, response, token) {
    /*
    Script Name:   FSFNImport
    Customer:      Community Based Care of Central Florida
    Purpose:       Import FSFN data into four zFSFN templates.  Used to import case worker lists also. 
    Parameters:    The following represent variables passed into the function: None
    Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    - Message will be sent back to VV as part of the ending of this scheduled process.
    Pseudocode:     System Requirements: 
                    1. Three folders must be set up in the Document Library that correspond to the folder path configurable variables.
                    2. Files to be processed can be csv or txt. Files must include headers. 
                    2a. Headers must be values present as properties in configuration object compareMappings.fields.
                    3. Files to be processed must be placed in the folder represented by newCSVFolderPath. 

                    Main Code: 
                    1.Get documentes from import folder
                    2.Get folder ids
                    3.Process documents
                    4.Send error log email
                    5.Send completion to server

    Date of Dev:   05/15/2019
    Last Rev Date: 02/02/2021

    Revision Notes:
    05/15/2019 - Kendra Austin:     Initial creation of the business process
    05/23/2019 - Kendra Austin:     Add pseudo-code to comment header.
    06/29/2019 - Kendra Austin:     Updates to support new ID columns.
    07/01/2019 - Kendra Austin:     Optimize script to minimize API calls resulting from duplicate records.
    07/04/2019 - Kendra Austin:     Optimize for duplicate records further by removing them from the imported file before proceeding.
    07/18/2019 - Kendra Austin:     Fixes for handling dates.
    09/11/2020 - Jason Hatch:       Update to import and maintain the CMA Worker list.  Updated logger statements to have process info identified.
                                    To support this change added formTypeObject definition for cmaunitworker.  Reorganized compareMappings so items are in
                                    alphabetical order and then added new fields that need to be compared from the new dataset.
                                    Added new document type in ProcessDocument when looking at file name.  New file must include string unitworkers.
                                    In FindDuplicates function, added comparison key for workers based on unit, supervisor id and worker id.  Dataset provided by
                                    Embrace had duplicate worker ids so I could not cleanly identify a record just on worker id.
    09/23/2020 - Jason Hatch:       Updating various promise areas to use async/await because of known problems with previous promise pattern implementations.
    09/28/2020 - Jason Hatch:       Updated the segmenting of the array to use more of they key instead of 1.
    11/03/2020 - Morgan Ward:       Updated var useTestEmail to be 1 (support ticket: 85295) and updated email list to original recipients.
    11/06/2020 - Jason Hatch:       Adjust spelling misalignment for what Embrace is using in the unitworkers file.
    11/10/2020 - Morgan Ward:       Updated Dev script to match that of production and SB3.
    07/05/2021 - Agustina Mannise:  Update the .then promises chain for async/await.
    08/20/2021 - Nikola Mathews:    Add Morgan and Nikola from VV and Alex Andino, Matt Baker, and Skye Heeley from Embrace to the test email list.
    11/08/2021 - Jason Hatch:       Added more logging.
    11/29/2021 - Emanuel Jofre:     Transpiled to ES6. General refactoring.
    02/02/2021 - Emanuel Jofre:     Added pre-processing of the file to segement big files into smaller files
    */

    logger.info('Start of logic for FSFNImport on ' + new Date());
    response.json(200, 'Process has been initiated to run.  Check back in the log to see completion information.');

    /*****************
     Script Variables
    ******************/

    const scheduledProcessGUID = token;
    let errors = [];
    let errorAfterSent = [];
    let newCSVDocuments = [];
    let processingCSVFolderId = '';
    let completedCSVFolderId = '';
    let currentFormType = ''; //This is set to 'case', 'assignment', 'individual', or 'participant' by the processDocument function.
    let shortDescription = '';

    /**********************
     Configurable Variables
    ***********************/

    const maxRecordsPerFile = 200;
    // Records are divided into arrays of a max size. Should be roughly the size of the response from getForms.
    const maxArraySize = 1000;
    // Set the max number of forms returned from getForms calls.
    const formQueryLimit = 5000;
    // If 1, an email is always sent at the end of the process. If 0, an email is only sent if errors occurred.
    const alwaysSendEmail = 1;
    // Used for test emails instead of production emails.  0 = Production 1 = Yes, use following test email addresses.
    const useTestEmail = 1;
    // This is used to identify how much of the identifier will be used to segment the arrays into smaller subsets.
    const segmentCompareLen = 3;
    // Users to receive notification of process completion with any errors if useTestEmail = 1.  Add email addresses in comma-delimited list.
    const testEmailList = 'emanuel.jofre@onetree.com';
    //const testEmailList =
    // 'morgan.ward@visualvault.com, nikola.mathews@visualvault.com, alex.andino@embracefamilies.org, matt.baker@embracefamilies.org, skye.heeley@embracefamilies.org';
    // Groups to receive notification of process completion with any errors. Add groups in comma-delimited list of strings.
    const groupsParamObj = [
        {
            name: 'groups',
            value: ['VaultAccess'],
        },
    ];

    // FOLDER PATHS

    // The VisualVault folder where CSV files to process will be located
    const newCSVFolderPath = '/FSFN Imports/New';
    // The VisualVault folder where this process will move the CSV documents while processing
    const processingCSVFolderPath = '/FSFN Imports/Processing';
    // The VisualVault folder where this process will move the CSV documents when completed
    const completedCSVFolderPath = '/FSFN Imports/Completed';
    // The node server's folder where the csv files are going to be downloaded temporarily. Note: this folder must already exist!
    const tempFileDownloadPath = './files';

    /*  
    Dictionary object related to each type of form handled.  This dictionary is used to quickly add or adjust what is being handled in this code.
    The following are explanations for each aspect of the dictionary.
    - templateId - This is the ID of the form template in VV that will be used.
    - queryFeilds - This is the list of fields that will be returned in the query to get information from VV.
    - compareColumn - This is used to identify unique records. When more than one value is used, update FindDuplicates section of the code to consider the additional values.
    - status - This maps the status coming from the CSV to the status in VV. 
    */

    const formTypeObject = {
        individual: {
            templateId: 'ZFSFN Individual',
            queryFields: 'DOB, Ethnicity, First Name, FSFN Person ID, Gender, Last Name, Middle Name, Race, Status, PRSN_SQ_R',
            compareColumn: 'PRSN_SQ_R',
            status: {
                A: 'Active',
                I: 'Inactive',
            },
        },
        participant: {
            templateId: 'ZFSFN Participant',
            queryFields: 'DOB, Ethnicity, First Name, FSFN Case ID, FSFN Person ID, Gender, Last Name, Middle Name, Race, Service Role, Status, PRSN_SQ_R',
            compareColumn: 'FSFN Case ID',
            status: {
                A: 'Active',
                I: 'Inactive',
            },
        },
        assignment: {
            templateId: 'ZFSFN Worker Assignment',
            queryFields:
                'Assigned Type, Email, End Date, FSFN Case ID, FSFN Worker ID, Staff Name, Start Date, Status, Supervisor, Supervisor Email, CMA, Assign ID',
            compareColumn: 'Assign ID',
            status: {
                A: 'Active',
                I: 'Inactive',
            },
        },
        case: {
            templateId: 'ZFSFN Case',
            queryFields: 'Case Name, Case Type, County, FSFN Case ID, Open Date, Restricted FSFN, Status, Unit',
            compareColumn: 'FSFN Case ID',
            status: {
                closed: 'Closed',
                opened: 'Open',
                reopened: 'Reopened',
            },
        },
        cmaunitworker: {
            templateId: 'ZLookup CMA Unit Workers',
            queryFields:
                'County, CMA, unt_sq_r, Unit, SupWRKR_SQ_R, SupFirst, SUpLast, SupEmail, SupType, SupPhone, WRKR_SQ_R, EMPL_FST_N, EMPL_LST_N, TX_EMAIL, WorkerPhone, Status, SERV_CENTER_ADDR, SERV_CENTER_CITY, SERV_CENTER_ST, SERV_CENTER_ZIP, SERV_CENTER_PHONE',
            compareColumn: 'WRKR_SQ_R',
            status: {
                A: 'Active',
                I: 'Inactive',
            },
        },
    };

    //Object to compare FSFN columns to column names returned in getForms query.
    //Used in compareRecors function; used in buildObject function. Also used to identify date fields.  Used for objects of each type.
    const compareMappings = {
        fields: {
            'Assign ID': 'assign ID',
            'Assigned Type': 'assigned Type',
            'Assignment End': 'end Date',
            'Assignment Start': 'start Date',
            'Case Name': 'case Name',
            'Case Type': 'case Type',
            'First Name': 'first Name',
            'FSFN Case ID': 'fsfN Case ID',
            'FSFN Person ID': 'fsfN Person ID',
            'FSFN Worker ID': 'fsfN Worker ID',
            'Last Name': 'last Name',
            'Middle Name': 'middle Name',
            'Open Date': 'open Date',
            'Restricted FSFN': 'restricted FSFN',
            'Service Role': 'service Role',
            'Staff Name': 'staff Name',
            'Supervisor Email': 'supervisor Email',
            'Supervisor Name': 'supervisor',
            'Worker Email': 'email',
            CMA: 'cma',
            County: 'county',
            DOB: 'dob',
            EMPL_FST_N: 'empL_FST_N',
            EMPL_LST_N: 'empL_LST_N',
            Ethnicity: 'ethnicity',
            Gender: 'gender',
            PRSN_SQ_R: 'prsN_SQ_R',
            Race: 'race',
            SERV_CENTER_ADDR: 'serV_CENTER_ADDR',
            SERV_CENTER_CITY: 'serV_CENTER_CITY',
            SERV_CENTER_PHONE: 'serV_CENTER_PHONE',
            SERV_CENTER_ST: 'serV_CENTER_ST',
            SERV_CENTER_ZIP: 'serV_CENTER_ZIP',
            Status: 'status',
            SupEmail: 'supEmail',
            SupFirst: 'supFirst',
            SupLast: 'sUpLast',
            SupPhone: 'supPhone',
            SupType: 'supType',
            SupWRKR_SQ_R: 'supWRKR_SQ_R',
            TX_EMAIL: 'tX_EMAIL',
            Unit: 'unit',
            unt_sq_r: 'unt_sq_r',
            WorkerPhone: 'workerPhone',
            WRKR_SQ_R: 'wrkR_SQ_R',
        },

        dates: {
            DOB: 'dob',
            'Open Date': 'open Date',
            'Assignment End': 'end Date',
            'Assignment Start': 'start Date',
        },
    };

    /****************
     Helper Functions
    *****************/

    function parseRes(vvClientRes) {
        /*
        Generic JSON parsing function
        Parameters:
            vvClientRes: JSON response from a vvClient API method
        */
        let res = vvClientRes;

        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(res);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === 'object') {
                res = jsObject;
            }
        } catch (e) {
            // If an error ocurrs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return res;
    }

    function checkMetaAndStatus(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the meta property of a vvCliente API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkDataPropertyExists(), make sure to pass the same param as well.
        */
        if (!vvClientRes.meta) {
            throw new Error(`${shortDescription}. No meta object found in response. Check method call and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status !== 200 && status !== 201 && status !== ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : 'unspecified';
            throw new Error(`${shortDescription}. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }
        return vvClientRes;
    }

    function checkDataPropertyExists(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvCliente API response object exists 
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMetaAndStatus(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`${shortDescription}. Data property was not present. Please, check parameters syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    function checkDataIsNotEmpty(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvCliente API response object is not empty
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMetaAndStatus(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === 'object';
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`${shortDescription} returned no data. Please, check parameters syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == 'Error') {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }

        return vvClientRes;
    }

    const preProcessDocuments = async function (document) {
        let fileBuffer = null;
        let newCsvItems = [];
        let tempFilePath = null;
        let deleteOriginalFile = false;
        tempFilePath = tempFileDownloadPath + '/' + document.fileName;

        // 1.GET THE FILE BYTES

        logger.info('FSFN IMPORT: Downloading file for ' + document.name + '.');

        return vvClient.files
            .getFileBytesId(document.id)
            .then(function (file) {
                fileBuffer = file;
            })
            .then(function () {
                if (fileBuffer) {
                    logger.info('FSFN IMPORT: Writing file to folder.');

                    // 2.WRITE THE FILE TO THE NODE SERVER TEMP FOLDER

                    // Need to manually create a promise to return to caller and resolve it once finished with the file write
                    return new Promise(function (resolve) {
                        fs.writeFile(tempFilePath, fileBuffer, function (err) {
                            if (!err) {
                                deleteOriginalFile = true;
                                logger.info('FSFN IMPORT: File written successfully.');
                            } else {
                                logger.info('FSFN IMPORT: Unable to write file: ' + err);
                                throw new Error(document.name + ': There was an error downloading the document.');
                            }

                            //Always resolve the promise so the promise chain isn't interrupted
                            resolve();
                        });
                    });
                } else {
                    throw new Error(document.name + ': Error obtaining document bytes.');
                }
            })
            .then(function () {
                // 3.PARSE THE CSV FILE

                logger.info('FSFN IMPORT: Parsing the csv file.');

                return new Promise(function (resolveParse) {
                    //Configure the file stream to read from the temporarily downloaded csv file
                    const fileStream = fs.createReadStream(tempFilePath);

                    fileStream.on('error', function (err) {
                        logger.info('FSFN IMPORT: An error occurred while trying to read from the csv file. ' + err.message);
                        throw new Error(document.name + ': There was an error reading the CSV file. ' + err.message);
                        // resolve();
                    });

                    const parserOptions = {
                        //Commenting out auto-parse so that numbers remain strings.
                        //auto_parse: true,           //If true, the parser will attempt to convert input string to native types. If a function, receive the value as argument and return a new value.
                        //Commented the following two columns out because date parser caused issues extracting data in testing.  Also columns will be in the CSV.
                        //auto_parse_date: true,      //If true, the parser will attempt to convert input string to dates. If a function, receive the value as argument and return a new value. It requires the "auto_parse" option. Be careful, it relies on Date.parse
                        //columns: colNames,          //List of fields as an array, a user defined callback accepting the first line and returning the column names, or true if autodiscovered in the first CSV line. Defaults to null. Affects the result data set in the sense that records will be objects instead of arrays. A value "false" skips the all column.
                        columns: true, //List of fields as an array, a user defined callback accepting the first line and returning the column names, or true if autodiscovered in the first CSV line. Defaults to null. Affects the result data set in the sense that records will be objects instead of arrays. A value "false" skips the all column.
                        delimiter: '|', //Set the field delimiter. One character only. Defaults to "," (comma).
                        skip_empty_lines: true, //Don't generate records for empty lines (line matching /\s*/), defaults to false.
                    };

                    const parser = csv.parse(parserOptions);

                    //Configure the readable event on the parser to store its data into the data array in memory
                    parser.on('readable', function () {
                        let record;
                        while ((record = parser.read()) !== null) {
                            newCsvItems.push(record);
                        }
                    });

                    // Configure the "end" event to resolve the promise passed to caller to continue with the process
                    parser.on('end', function () {
                        resolveParse();
                    });

                    //Configure the error event to set the error flag, record the error message ,and resolve the promise immediately to continue to next step
                    parser.on('error', function (err) {
                        logger.info('FSFN IMPORT: An error occurred while parsing the csv file. ' + err.message);
                        throw new Error(document.name + ': There was an error while parsing the CSV file. ' + err.message);
                        // resolve();
                    });

                    //Pipe the file to the csv parser and initiate the data flow
                    fileStream.pipe(parser);
                });
            })
            .then(function () {
                // 4.IF THE FILE IS TOO BIG SEPARATE IT INTO MULTIPLE FILES

                if (newCsvItems.length > maxRecordsPerFile - 1) {
                    // If the file has more than the max number of records per file, then we need to split it up into multiple files.
                    const newFilePartitions = createArraySegments(newCsvItems, maxRecordsPerFile - 1);

                    return Promise.all(
                        // For each file partition, create a new file and write the data to it.
                        newFilePartitions.map((partition, index) => {
                            //Start adding file headers
                            let csvFileString = Object.keys(partition[0]).join('|') + '\n';

                            //Add rows to the file
                            for (const row of partition) {
                                csvFileString += Object.values(row).join('|') + '\n';
                            }

                            // Cast string to buffer
                            const buffer = Buffer.Buffer.from(csvFileString);
                            // Create a new file name and set the new path
                            const newFileName = document.fileName.split('.')[0] + '_segment_' + ++index;
                            const newFilePath = tempFileDownloadPath + '/' + newFileName + '.csv';

                            // Write the buffer to the new file in the server temp folder
                            return new Promise(function (resolveWrite) {
                                fs.writeFile(newFilePath, buffer, function (err) {
                                    if (!err) {
                                        logger.info('FSFN IMPORT: File written successfully.');
                                        // Create a new placeholder document
                                        shortDescription = `Post document ${document.name.split('.')[0]}`;

                                        const docArgs = {
                                            documentState: 1,
                                            name: `${newFileName}`,
                                            description: `${document.description}`,
                                            revision: '0',
                                            allowNoFile: true,
                                            fileLength: 0,
                                            fileName: `${newFileName + '.csv'}`,
                                            indexFields: '{}',
                                            folderId: `${processingCSVFolderId}`,
                                        };

                                        return vvClient.documents
                                            .postDoc(docArgs)
                                            .then((res) => parseRes(res))
                                            .then((res) => checkMetaAndStatus(res, shortDescription))
                                            .then((res) => checkDataPropertyExists(res, shortDescription))
                                            .then((res) => checkDataIsNotEmpty(res, shortDescription))
                                            .then(function (postDocResp) {
                                                // Uploads the file bytes to the new placeholder document
                                                const fileParams = {
                                                    documentId: postDocResp.data.id,
                                                    name: postDocResp.data.name,
                                                    revision: '1',
                                                    changeReason: '',
                                                    checkInDocumentState: 'Released',
                                                    fileName: `${postDocResp.data.fileName}`,
                                                    indexFields: '{}',
                                                };

                                                return vvClient.files.postFile(fileParams, buffer);
                                            })
                                            .then((res) => parseRes(res))
                                            .then((res) => checkMetaAndStatus(res, shortDescription))
                                            .then((res) => checkDataPropertyExists(res, shortDescription))
                                            .then((res) => checkDataIsNotEmpty(res, shortDescription))
                                            .then(function () {
                                                // If every partition has been written to a new file, delete the original file.
                                                if (index == newFilePartitions.length) {
                                                    if (deleteOriginalFile) {
                                                        fs.unlinkSync(tempFilePath);

                                                        shortDescription = `Delete document ${document.name.split('.')[0]}`;
                                                        return vvClient.documents
                                                            .deleteDocument(null, document.id)
                                                            .then((res) => parseRes(res))
                                                            .then((res) => checkMetaAndStatus(res, shortDescription))
                                                            .then(function () {
                                                                resolveWrite();
                                                            })
                                                            .catch(function (err) {
                                                                errors.push(err);
                                                                resolveWrite();
                                                            });
                                                    }
                                                } else {
                                                    resolveWrite();
                                                }
                                            })
                                            .catch(function (error) {
                                                errors.push(error);
                                            });
                                    } else {
                                        logger.info('FSFN IMPORT: Unable to write file: ' + err);
                                        deleteOriginalFile = false;
                                        throw new Error(newFilePath + ': There was an error downloading the document.');
                                    }
                                });
                            });
                        })
                    );
                } else {
                    // MOVE FILE TO THE PROCESSING FOLDER.

                    logger.info("FSFN IMPORT: Moving csv document '" + document.name + "' to processing folder '" + processingCSVFolderPath + "'.");

                    const moveDocumentData = {
                        folderId: processingCSVFolderId,
                    };

                    return vvClient.documents
                        .moveDocument(null, moveDocumentData, document.documentId)
                        .then(function (moveDocumentResp) {
                            if (!moveDocumentResp.meta) {
                                logger.info('FSFN IMPORT: There was an error moving the document to processing folder. Aborting processing the file.');
                                throw new Error(document.name + ': There was an error moving the document to processing folder.');
                            }

                            if (moveDocumentResp.meta.status !== 200) {
                                logger.info('FSFN IMPORT: There was an error moving the document to processing folder. Aborting processing the file.');
                                throw new Error(document.name + ': There was an error moving the document to processing folder.');
                            }

                            logger.info('FSFN IMPORT: Document moved successfully.');
                        })
                        .then(function () {
                            // 3.WRITE THE FILE TO THE SERVER TEMP FOLDER

                            logger.info(`FSFN IMPORT: Writing file to folder.`);

                            // Need to manually create a promise to return to caller and resolve it once finished with the file write
                            return new Promise(function (resolve) {
                                fs.writeFile(tempFilePath, fileBuffer, function (err) {
                                    if (!err) {
                                        logger.info(`FSFN IMPORT: File written successfully.`);
                                    } else {
                                        logger.info(`${document.name}: There was an error downloading the document.`);
                                        throw new Error(`${document.name}: There was an error downloading the document.`);
                                    }

                                    //Always resolve the promise so the promise chain isn't interrupted
                                    resolve();
                                });
                            });
                        });
                }
            })
            .catch(function (error) {
                errors.push(error);
            });
    };

    const processDocument = async function (document) {
        /*
        Called from main code. Processes one document at a time. 
        Sets currentFormType before calling processCSV.
        Handles moving the document from New to Processing to Completed folder.
        Handles writing the file to the temp folder and deleting it when done.
        */

        let newCsvItems = [];
        let tempFilePath = tempFileDownloadPath + '/' + document.fileName;

        // 1.PARSE THE PREPROCESSED CSV FILE

        logger.info('FSFN IMPORT: Parsing the csv file.');

        return new Promise(function (resolve) {
            try {
                //Configure the file stream to read from the temporarily downloaded csv file
                const fileStream = fs.createReadStream(tempFilePath);

                fileStream.on('error', function (err) {
                    logger.info('FSFN IMPORT: An error occurred while trying to read from the csv file. ' + err.message);
                    throw new Error(document.name + ': There was an error reading the CSV file. ' + err.message);
                    // resolve();
                });

                const parserOptions = {
                    //Commenting out auto-parse so that numbers remain strings.
                    //auto_parse: true,           //If true, the parser will attempt to convert input string to native types. If a function, receive the value as argument and return a new value.
                    //Commented the following two columns out because date parser caused issues extracting data in testing.  Also columns will be in the CSV.
                    //auto_parse_date: true,      //If true, the parser will attempt to convert input string to dates. If a function, receive the value as argument and return a new value. It requires the "auto_parse" option. Be careful, it relies on Date.parse
                    //columns: colNames,          //List of fields as an array, a user defined callback accepting the first line and returning the column names, or true if autodiscovered in the first CSV line. Defaults to null. Affects the result data set in the sense that records will be objects instead of arrays. A value "false" skips the all column.
                    columns: true, //List of fields as an array, a user defined callback accepting the first line and returning the column names, or true if autodiscovered in the first CSV line. Defaults to null. Affects the result data set in the sense that records will be objects instead of arrays. A value "false" skips the all column.
                    delimiter: '|', //Set the field delimiter. One character only. Defaults to "," (comma).
                    skip_empty_lines: true, //Don't generate records for empty lines (line matching /\s*/), defaults to false.
                };

                const parser = csv.parse(parserOptions);

                //Configure the readable event on the parser to store its data into the data array in memory
                parser.on('readable', function () {
                    let record;
                    while ((record = parser.read()) !== null) {
                        newCsvItems.push(record);
                    }
                });

                //Configure the "end" event to resolve the promise passed to caller to continue with the process
                parser.on('end', function () {
                    logger.info('FSFN IMPORT: CSV parsing completed successfully.');

                    // 2.SEND FILE FOR PROCESSING OF EACH RECORD IN THE CSV.

                    let processCsvResult = Q.resolve();
                    let docName = document.fileName.toLowerCase();

                    //Clear out the current form type
                    currentFormType = '';

                    //Determine which type of data the file contains and set current form type, then process all the csv line items in that context.
                    if (docName.includes('part')) {
                        currentFormType = 'participant';
                    } else if (docName.includes('ind')) {
                        currentFormType = 'individual';
                    } else if (docName.includes('assign')) {
                        currentFormType = 'assignment';
                    } else if (docName.includes('case')) {
                        currentFormType = 'case';
                    } else if (docName.includes('unitworkers')) {
                        currentFormType = 'cmaunitworker';
                    } else {
                        logger.info('FSFN IMPORT: Unable to determine csv data type from fileName. File will not be processed.');
                        throw new Error(
                            document.name +
                                ": The filename did not contain 'part', 'ind', 'assign', or 'case'. Unable to determine file import type. File skipped."
                        );
                    }

                    logger.info('FSFN IMPORT: Starting process for current form type: ' + currentFormType);
                    processCsvResult = processCSV(newCsvItems);
                    return processCsvResult
                        .then(function () {
                            // 3.MOVE THE DOCUMENT TO THE "COMPLETED" FOLDER

                            logger.info("FSFN IMPORT: Moving csv document '" + document.name + "' to completed folder '" + completedCSVFolderPath + "'.");

                            const moveDocumentData = {
                                folderId: completedCSVFolderId,
                            };

                            return vvClient.documents.moveDocument(null, moveDocumentData, document.documentId).then(function (moveDocumentResp) {
                                if (!moveDocumentResp.meta) {
                                    logger.info('FSFN IMPORT: There was an error moving the document to completed folder.');
                                    throw new Error(document.name + ': There was an error moving the document to the completed folder after processing.');
                                }

                                if (moveDocumentResp.meta.status !== 200) {
                                    logger.info('FSFN IMPORT: There was an error moving the document to completed folder.');
                                    throw new Error(document.name + ': There was an error moving the document to the completed folder after processing.');
                                }

                                logger.info('FSFN IMPORT: Document moved successfully.');
                            });
                        })
                        .then(function () {
                            // 4.DELETE THE TEMPORARY CSV FILE

                            logger.info("FSFN IMPORT: Attempting to delete downloaded file '" + tempFilePath + "'.");

                            fs.unlink(tempFilePath, (err) => {
                                if (err) {
                                    logger.info('FSFN IMPORT: An error occurred while trying to delete the file. ' + err.message);
                                    errors.push('An error occurred while trying to delete the file. ' + err.message);
                                } else {
                                    logger.info('FSFN IMPORT: File deleted successfully.');
                                }
                            });

                            resolve();
                        })
                        .catch(function (error) {
                            errors.push(error);
                        });
                });

                //Configure the error event to set the error flag, record the error message ,and resolve the promise immediately to continue to next step
                parser.on('error', function (err) {
                    logger.info('FSFN IMPORT: An error occurred while parsing the csv file. ' + err.message);
                    throw new Error(document.name + ': There was an error while parsing the CSV file. ' + err.message);
                    // resolve();
                });

                //Pipe the file to the csv parser and initiate the data flow
                fileStream.pipe(parser);
            } catch (error) {
                errors.push(error);
            }
        });
    };

    function createArraySegments(inputArray, segmentSize) {
        // Creates an array of arrays of size segmentSize
        function reducer(previousValue, currentValue, index) {
            const segmentIndex = Math.floor(index / segmentSize);

            // If there is no array(segment) at this index, create one
            if (!previousValue[segmentIndex]) {
                previousValue[segmentIndex] = [];
            }

            // Add the current value to the array(segment)
            previousValue[segmentIndex].push(currentValue);

            return previousValue;
        }

        const initialValue = [];

        const segmentedArray = inputArray.reduce(reducer, initialValue);

        return segmentedArray;
    }

    const processCSV = async function (records) {
        /* 
        processCSV: 
        Calls segmentArray, then calls getForms for each array segment being processed. 
        Passes both arrays into processSubArrays.
        */
        try {
            const compareColumn = formTypeObject[currentFormType].compareColumn; //Define the column we are using to compare records
            const currentTemplateId = formTypeObject[currentFormType].templateId; //Define the template ID to be compared against and updated
            const currentQueryFields = formTypeObject[currentFormType].queryFields; //Define the fields to be returned in the query to that template.
            let csvRecordsNoDuplicates = []; //Holds an array of all records found in the imported file, minus duplicate records.

            logger.info('FSFN IMPORT: Starting processCSV. Removing duplicates. Current form type is ' + currentFormType);

            //First, create csvRecordsNoDuplicates array from the imported data. Remove duplicates from the source.
            for (let record of records) {
                if (csvRecordsNoDuplicates.length == 0) {
                    csvRecordsNoDuplicates.push(record);
                } else {
                    const duplicatedFound = findDuplicates(csvRecordsNoDuplicates, record, 'file');

                    if (!duplicatedFound) {
                        csvRecordsNoDuplicates.push(record);
                    }
                }
            }

            //Get an array of objects, each of which holds an array of a max size, where compareColumn value all starts with the same string.
            const fsfnIndArrays = segmentArray(csvRecordsNoDuplicates, compareColumn);

            logger.info('FSFN IMPORT: Array segmented. Starting loop to process each object. Current form type ' + currentFormType);

            //Loop through the objects in the segmented array and facilitate creation of new forms and update of existing forms
            for (let subString of fsfnIndArrays) {
                const currentSubstring = subString.name;

                //Get the existing forms where compareColumn starts with that string.
                const formQuery = {
                    q: `[${compareColumn}] LIKE '%${currentSubstring}%'`,
                    fields: currentQueryFields,
                    limit: formQueryLimit,
                };

                const formQueryResp = await vvClient.forms.getForms(formQuery, currentTemplateId);
                const queryResp = JSON.parse(formQueryResp);

                if (!queryResp.meta || queryResp.meta.status != 200 || !queryResp.data || queryResp.data.length == 0) {
                    logger.info(
                        'FSFN IMPORT: Error occurred while fetching ' + currentFormType + ' forms where ' + compareColumn + ' starts with ' + subString
                    );
                    errors.push('Error occurred while fetching ' + currentFormType + ' forms where ' + compareColumn + ' starts with ' + subString);
                }

                let existingForms = [];
                queryResp.data.forEach(function (indv) {
                    existingForms.push(indv);
                });

                //return the results of a function that handles finding, comparing, updating, and creating forms.
                logger.info('FSFN IMPORT: Entering processSubArrays for ' + currentFormType + ', subArray ' + currentSubstring);
                await processSubArrays(subString.array, existingForms);
            }
        } catch (error) {
            errors.push(error);
        }
        return;
    };

    const segmentArray = function (csvArray, columnName) {
        //Based on the compareColumn defined for each form type, breaks up a large array into many smaller arrays where compareColumn starts with the same string.
        logger.info('FSFN IMPORT: Entered the segmentArray function for ' + currentFormType);
        //Initialize the array that will be returned.
        let finalSegmentedArray = [];

        try {
            const segment = function (array, compareLength) {
                logger.info('FSFN IMPORT: Entered the segment function');
                let returnArray = [];

                //Go through the array and create segments based on compareLength
                for (let record of array) {
                    //Get the value in the column by which the array should be segmented. Handle errant spaces with trim.
                    let segmentColumn = record[columnName] ? record[columnName].trim() : '';

                    //Use the first X characters of the column value as the property by which to separate data.
                    const property = segmentColumn.substring(0, compareLength);

                    //Only handle items with a value. If it is missing, it won't hook up to VV
                    if (!property) {
                        throw new Error('FSFN IMPORT: Error occurred while segmenting array. Record ' + currentFormType + ' has no value in ' + columnName);
                    } else {
                        //if returnArray is empty, push the first record into it.
                        if (returnArray.length == 0) {
                            const recordObj = {
                                name: property,
                                compareLength: compareLength,
                                array: [record],
                            };

                            returnArray.push(recordObj);
                        } else {
                            //Check if returnArray has an object with this prefix already. If yes, push this record into the array. If no, create then push.
                            let found = false;

                            returnArray.forEach(function (obj) {
                                if (obj.name == property) {
                                    obj.array.push(record);
                                    found = true;
                                }
                            });

                            if (!found) {
                                const recordObj = {
                                    name: property,
                                    compareLength: compareLength,
                                    array: [record],
                                };
                                returnArray.push(recordObj);
                            }
                        }
                    }
                }
                return returnArray;
            };

            const resegment = function (segmentedArray) {
                logger.info('FSFN IMPORT: Entered the resegment function');

                let returnResegmented = [];

                //Check each object in the segmented array. If its array is too long, segment that piece only.
                for (let obj of segmentedArray) {
                    if (obj.array.length > maxArraySize) {
                        let arraySection = [];
                        let newCompareLength = obj.compareLength + 1;
                        arraySection = segment(obj.array, newCompareLength);
                        arraySection.forEach(function (set) {
                            returnResegmented.push(set);
                        });
                    } else {
                        returnResegmented.push(obj);
                    }
                }

                return returnResegmented;
            };

            //segment the array for the first time. Start with compareLength 1.
            finalSegmentedArray = segment(csvArray, segmentCompareLen);

            //Check the lengths of each array in finalSegmentedArray. If any are > maxArraySize, those need to be segmented out.
            let updatedLastRound = true;

            do {
                let updateNeeded = false;
                updatedLastRound = false;

                finalSegmentedArray.forEach(function (segment) {
                    if (segment.array.length > maxArraySize) {
                        updateNeeded = true;
                    }
                });

                if (updateNeeded) {
                    logger.info('FSFN IMPORT: Need to resegment');
                    finalSegmentedArray = resegment(finalSegmentedArray);
                    updatedLastRound = true;
                }
            } while (updatedLastRound);

            logger.info('FSFN IMPORT: Exiting the segmentArray function for ' + currentFormType);
        } catch (error) {
            errors.push(error);
        }
        return finalSegmentedArray;
    };

    const findDuplicates = function (providedArray, itemToFind, source) {
        // This function returns a matching record from a provided array.
        let returnedRecord = {};

        try {
            const compareColumn = formTypeObject[currentFormType].compareColumn; //Get the comppare column currently being used
            const queryColumnName = compareMappings.fields[compareColumn]; //Get the corresponding column name that's returned from the query

            if (currentFormType == 'individual' || currentFormType == 'case') {
                returnedRecord = providedArray.find(function (existingFormRecord) {
                    if (source == 'file') {
                        return String(existingFormRecord[compareColumn]) == String(itemToFind[compareColumn]);
                    } else {
                        return String(existingFormRecord[queryColumnName]) == String(itemToFind[compareColumn]);
                    }
                });
            } else if (currentFormType == 'participant') {
                returnedRecord = providedArray.find(function (existingFormRecord) {
                    if (source == 'file') {
                        const result =
                            String(existingFormRecord[compareColumn]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['PRSN_SQ_R']) == String(itemToFind['PRSN_SQ_R']);
                        return result;
                    } else {
                        const result =
                            String(existingFormRecord[queryColumnName]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['prsN_SQ_R']) == String(itemToFind['PRSN_SQ_R']);
                        return result;
                    }
                });
            } else if (currentFormType == 'assignment') {
                returnedRecord = providedArray.find(function (existingFormRecord) {
                    if (source == 'file') {
                        const result =
                            String(existingFormRecord[compareColumn]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['FSFN Case ID']) == String(itemToFind['FSFN Case ID']) &&
                            String(existingFormRecord['FSFN Worker ID']) == String(itemToFind['FSFN Worker ID']);
                        return result;
                    } else {
                        const result =
                            String(existingFormRecord[queryColumnName]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['fsfN Case ID']) == String(itemToFind['FSFN Case ID']) &&
                            String(existingFormRecord['fsfN Worker ID']) == String(itemToFind['FSFN Worker ID']);
                        return result;
                    }
                });
            } else if (currentFormType == 'cmaunitworker') {
                returnedRecord = providedArray.find(function (existingFormRecord) {
                    if (source == 'file') {
                        const result =
                            String(existingFormRecord[compareColumn]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['unt_sq_r']) == String(itemToFind['unt_sq_r']) &&
                            String(existingFormRecord['SupWRKR_SQ_R']) == String(itemToFind['SupWRKR_SQ_R']);
                        return result;
                    } else {
                        const result =
                            String(existingFormRecord[queryColumnName]) == String(itemToFind[compareColumn]) &&
                            String(existingFormRecord['unt_sq_r']) == String(itemToFind['unt_sq_r']) &&
                            String(existingFormRecord['supWRKR_SQ_R']) == String(itemToFind['SupWRKR_SQ_R']);
                        return result;
                    }
                });
            }
        } catch (error) {
            errors.push(error);
        }

        return returnedRecord;
    };

    const processSubArrays = async function (fsfnArray, existingArray) {
        //This function iterates through FSFN records to determine if found in VV. If no, buildObject and postForms.
        //If yes, compareRecords to determine if update needed. If yes, buildObject and postFormRevision.
        logger.info('FSFN IMPORT: Entering processSubArrays');

        try {
            const compareColumn = formTypeObject[currentFormType].compareColumn; //Get the comppare column currently being used
            const queryColumnName = compareMappings.fields[compareColumn]; //Get the corresponding column name that's returned from the query
            const currentTemplateId = formTypeObject[currentFormType].templateId; //Get the templateId in the current context.
            let updateObject = {}; //Initialize an empty object for updating and posting forms.

            //Loop through each item in the fsfnArray and compare it to the existingForms
            for (let fsfnItem of fsfnArray) {
                //Find the form pertaining to the compareColumn. Participants and Assignments need to match on two columns
                const foundFormRecord = findDuplicates(existingArray, fsfnItem, 'vv');

                //Handle whether found (udpate) or not found (create)
                if (foundFormRecord) {
                    //Record was found. Go down UPDATE path.
                    //compareRecords to find out if an update is needed.
                    const update = compareRecords(foundFormRecord, fsfnItem);

                    if (update == 'Update Needed') {
                        const updateObject = buildObject(fsfnItem);

                        //If the revisionId is undefined, then the record is a duplicate and should not be revised. In theory, this should never be the case since a different status is returned from compareRecords.
                        if (foundFormRecord.revisionId) {
                            const updateResp = await vvClient.forms.postFormRevision(null, updateObject, currentTemplateId, foundFormRecord.revisionId);

                            if (!updateResp.meta) {
                                throw new Error(
                                    'An error occurred when attempting to update ' + currentTemplateId + ' for ' + compareColumn + ' ' + fsfnItem[compareColumn]
                                );
                            }
                            if (updateResp.meta.status !== 201) {
                                logger.info(
                                    'FSFN IMPORT: An error occurred when attempting to update ' +
                                        currentTemplateId +
                                        ' for ' +
                                        compareColumn +
                                        ' ' +
                                        fsfnItem[compareColumn]
                                );
                                throw new Error(
                                    'An error occurred when attempting to update ' + currentTemplateId + ' for ' + compareColumn + ' ' + fsfnItem[compareColumn]
                                );
                            }
                        } else {
                            logger.info(
                                'The compareRecords result was Update Needed, but the revisionID was not present. This is an invalid state. The record is: ' +
                                    foundFormRecord
                            );
                            throw new Error(
                                'The compareRecords result was Update Needed, but the revisionID was not present. This is an invalid state. The record is: ' +
                                    foundFormRecord
                            );
                        }
                    }
                } else {
                    //Record was not found. Go down CREATE path.
                    updateObject = buildObject(fsfnItem);

                    const postResp = await vvClient.forms.postForms(null, updateObject, currentTemplateId);

                    if (!postResp.meta) {
                        logger.info(
                            'FSFN IMPORT: An error occurred when attempting to post a new ' +
                                currentTemplateId +
                                ' for ' +
                                compareColumn +
                                ' ' +
                                fsfnItem[compareColumn]
                        );
                        throw new Error(
                            'An error occurred when attempting to post a new ' + currentTemplateId + ' for ' + compareColumn + ' ' + fsfnItem[compareColumn]
                        );
                    }

                    if (postResp.meta.status !== 201) {
                        logger.info(
                            'FSFN IMPORT: An error occurred when attempting to post a new ' +
                                currentTemplateId +
                                ' for ' +
                                compareColumn +
                                ' ' +
                                fsfnItem[compareColumn]
                        );
                        throw new Error(
                            'An error occurred when attempting to post a new ' + currentTemplateId + ' for ' + compareColumn + ' ' + fsfnItem[compareColumn]
                        );
                    }
                    //logger.info(currentTemplateId +" posted successfully for " + compareColumn + ' ' + fsfnItem[compareColumn]);
                    //Once this form has been created, it becomes an existing form. Push it into the array with a query column name property.
                    fsfnItem[queryColumnName] = fsfnItem[compareColumn];
                    existingArray.push(fsfnItem);
                }
            }
            logger.info('FSFN IMPORT. Exiting processSubArrays function');
        } catch (error) {
            errors.push(error);
        }
        return;
    };

    const compareRecords = function (existingRecord, fsfnRecord) {
        //This function compares a FSFN record with existing VV data to determine if Update Needed.
        //Default result should be no update needed.
        let result = 'No Update Needed';

        try {
            //Use the FSFN record as a guide. Loop through each field passed in from FSFN import.
            for (let fsfnProperty in fsfnRecord) {
                const existingProperty = compareMappings.fields[fsfnProperty]; //Get the property name with query casing (FSFN Person ID -> fsfN Person ID)
                let fsfnValue = fsfnRecord[fsfnProperty]; //Value of the field in FSFN
                let currentValue = '';

                if (existingRecord.hasOwnProperty(existingProperty)) {
                    currentValue = existingRecord[existingProperty]; //Value of the field in VV
                } else if (existingRecord.hasOwnProperty(fsfnProperty)) {
                    break; //In case this is a duplicate record that was pushed into existingRecords array.
                } else {
                    logger.info(
                        'FSFN IMPORT: The existing record being processed does not have VisualVault values or FSFN values. This is an invalid state. The record is: ' +
                            JSON.stringify(existingRecord)
                    );
                    throw new Error(
                        'FSFN IMPORT: The existing record being processed does not have VisualVault values or FSFN values. This is an invalid state. The record is: ' +
                            JSON.stringify(existingRecord)
                    );
                }

                //Check to see if the current field is a date field
                if (compareMappings.dates[fsfnProperty]) {
                    //Convert dates to the same format for comparison, using moment
                    if (currentFormType == 'case') {
                        //Open Dates in Case file imports are a messy format. Pull out just the date portion.
                        fsfnValue = fsfnValue.substring(0, 10);
                        fsfnValue = moment(fsfnValue).format('L');
                    }

                    fsfnValue = moment(new Date(fsfnValue)).format('L');

                    if (!currentValue) {
                        currentValue = 'Invalid date';
                    } else {
                        currentValue = moment(new Date(currentValue)).format('L');
                    }
                }

                //If this is a status field that's converted during buildObject, convert it back here so that it doesn't flag an unnecessary update
                if (fsfnProperty == 'Status') {
                    fsfnValue = transformStatus(fsfnValue);
                }

                //Now check to see if the FSFN value is the same as the VV value. If even one value is different, form must be updated.
                if ((fsfnValue || fsfnValue.length != 0) && (currentValue || fsfnValue.length != 0)) {
                    if (fsfnValue.trim() != currentValue.trim()) {
                        result = 'Update Needed';
                        break;
                    }
                }
            }
        } catch (error) {
            errors.push(error);
        }
        return result;
    };

    const buildObject = function (fsfnRecord) {
        //This function, given a FSFN record, uses compareMappings to create a post or udpate object with correct field names.
        try {
            let returnObject = {}; //Initialize return object

            //loop over the properties of the fsfnRecord and build an object with template field names
            for (let key in fsfnRecord) {
                //postForms and postFormRevision are case-insensitive to template field names, so OK to use compareMappings.
                const templateFieldName = compareMappings.fields[key];

                //Check if this is a date field to ensure consistent format
                if (compareMappings.dates[key]) {
                    let dateString = '';

                    //Open Dates in Case imports are a messy format. Extract just the date portion.
                    if (currentFormType == 'case') {
                        const date = fsfnRecord[key].substring(0, 10);
                        dateString = moment(date).format('L');
                    } else {
                        //dateString = moment(new Date(fsfnRecord[key])).format('L');
                        dateString = fsfnRecord[key];
                    }

                    returnObject[templateFieldName] = dateString;
                } else {
                    //If the field wasn't a date, OK to just pass the FSFN value right into the returnObject.
                    returnObject[templateFieldName] = fsfnRecord[key];
                }
            }

            //If working with a participant record, build the FSFN Participant ID.
            if (currentFormType == 'participant') {
                returnObject['FSFN Participant ID'] = fsfnRecord['FSFN Case ID'] + fsfnRecord['PRSN_SQ_R'];
            }

            //Translate status into a string that exist in drop-downs.
            const formattedStatus = transformStatus(returnObject['status']);
            returnObject['status'] = formattedStatus;

            return returnObject;
        } catch (error) {
            errors.push(error);
        }
    };

    const transformStatus = function (importStatus) {
        //This function, Given a FSFN status, checks the currentFormType and returns the status that is present in template drop-downs.
        //This function is used in compareRecords and buildObject.
        //If something goes wrong, send back the status that was passed in.
        let returnStatus = importStatus;

        try {
            if (formTypeObject[currentFormType]['status'][importStatus]) {
                returnStatus = formTypeObject[currentFormType]['status'][importStatus];
            }
        } catch (error) {
            errors.push(error);
        }

        return returnStatus;
    };

    const fetchFolderData = async function () {
        //This function gets the folder IDs for each of the three processing folders in the document library.

        //Fetch all the folder IDs for the 3 folders
        const getNewFolderParams = {
            folderPath: newCSVFolderPath,
        };

        const getProcessingFolderParams = {
            folderPath: processingCSVFolderPath,
        };

        const getCompletedFolderParams = {
            folderPath: completedCSVFolderPath,
        };

        const getNewFolderPromise = await vvClient.library.getFolders(getNewFolderParams);
        //Extract Import Folders Information.
        const newFolderResult = JSON.parse(getNewFolderPromise);

        if (!newFolderResult.meta || newFolderResult.meta.status != 200 || !newFolderResult.data) {
            throw new Error("An error occurred while trying to retrieve + '" + newCSVFolderPath + "' FSFN import folder.");
        }

        let newCSVFolderId = newFolderResult.data.id;

        const getProcessingFolderPromise = await vvClient.library.getFolders(getProcessingFolderParams);
        const processingFolderResult = JSON.parse(getProcessingFolderPromise);

        if (!processingFolderResult.meta || processingFolderResult.meta.status != 200 || !processingFolderResult.data) {
            throw new Error("An error occurred while trying to retrieve + '" + newCSVFolderPath + "' FSFN import folder.");
        }

        processingCSVFolderId = processingFolderResult.data.id;

        var getCompletedFolderPromise = await vvClient.library.getFolders(getCompletedFolderParams);
        var completedFolderResult = JSON.parse(getCompletedFolderPromise);

        if (!completedFolderResult.meta || completedFolderResult.meta.status != 200 || !completedFolderResult.data) {
            throw new Error("An error occurred while trying to retrieve + '" + newCSVFolderPath + "' FSFN import folder.");
        }

        completedCSVFolderId = completedFolderResult.data.id;

        return;
    };

    const sendErrorLogEmail = async function () {
        logger.info('FSFN IMPORT. Entered sendErrorLogEmail process.');
        let emailList = testEmailList;

        //Fetch the admin users' emails
        let respAdminEmail = await vvClient.scripts.runWebService('GetGroupUserEmails', groupsParamObj);

        if (respAdminEmail.data) {
            const emailData = respAdminEmail.data.data;

            for (var c = 0; c < emailData.length; c++) {
                if (emailList.length == 0) {
                    emailList = emailData[c]['emailAddress'];
                } else {
                    emailList = emailList + ',' + emailData[c]['emailAddress'];
                }
            }
        }

        logger.info('FSFN IMPORT: Attempting to send error log.');
        let body = 'The following errors or messages were logged while processing the FSFN Import <br><br>';

        body += '<ul>';
        for (let errorItem of errors) {
            //Generate the body of the email.
            body += '<li>' + errorItem + '</li>';
        }

        body += '</ul>';
        let emailData = {};

        if (useTestEmail == 0) {
            emailData.recipients = emailList;
        } else {
            emailData.recipients = testEmailList;
        }
        emailData.subject = 'Errors or messages generated during FSFN Import on ' + moment().format('MM/DD/YYYY');
        emailData.body = body;

        const resp = await vvClient.email.postEmails(null, emailData);

        if (!resp.meta || resp.meta.status !== 201) {
            errorAfterSent.push('Issue occurred while sending error log email to admin staff.');
            logger.info('FSFN IMPORT: Issue occurred while sending error log email to admin staff.');
        }

        logger.info('FSFN IMPORT: Email sent successfully.');
    };

    const getDocuments = async function (path) {
        const getDocsParams = {
            q: "FolderPath = '" + path + "'",
            sort: 'CreateDate',
            sortDir: 'ASC',
        };
        const getDocsResp = await vvClient.documents.getDocuments(getDocsParams);
        const getDocsRespObj = JSON.parse(getDocsResp);

        if (!getDocsRespObj.meta || getDocsRespObj.meta.status !== 200) {
            logger.info('FSFN IMPORT: An error occurred while retrieving the documents from ' + path + '.');
            errors.push('An error occurred while retrieving the documents from ' + path + '.');
        }

        logger.info('FSFN IMPORT: ' + getDocsRespObj.data.length + ' documents returned.');

        return getDocsRespObj.data.filter((respDoc) => respDoc.extension === 'csv' || respDoc.extension === 'txt');
    };

    /**********
     MAIN CODE
    ***********/

    try {
        // 1.GET DOCUMENTS DATA FROM IMPORT FOLDER

        newCSVDocuments = await getDocuments(newCSVFolderPath);

        // 2.GET FOLDER IDS

        if (newCSVDocuments.length > 0) {
            logger.info('FSFN IMPORT: Call fetchFolderData.');
            await fetchFolderData();
        } else {
            logger.info('FSFN IMPORT: No documents to be processed. Skipping data fetch.');
            errors.push('FSFN IMPORT: No documents to be processed. Skipping data fetch.');
        }

        // 3.PROCESS DOCUMENTS

        if (newCSVDocuments.length > 0) {
            for (const newDoc of newCSVDocuments) {
                // If the file is too big create new smaller files
                await preProcessDocuments(newDoc);
            }

            // Get the documents again after preprocessing
            newCSVDocuments = await getDocuments(processingCSVFolderPath);

            for (let doc of newCSVDocuments) {
                // Process the documents
                logger.info('FSFN IMPORT: Call processDocument');
                await processDocument(doc);
            }
        } else {
            logger.info('FSFN IMPORT: Import files were not present for processing.');
            errors.push('Import files were not present for processing.');
        }

        // 4.SEND ERROR LOG EMAIL

        if (alwaysSendEmail == 1) {
            sendErrorLogEmail();
        } else if (errors.length > 0) {
            //Send an email to the admin staff with all error log.
            sendErrorLogEmail();
        }

        // 5.SEND COMPLETION TO SERVER

        let messageData = '';

        if (errors.length > 0 || errorAfterSent.length > 0) {
            logger.info('FSFN IMPORT: Ecompleted with errors that have been sent to the support team.  ' + errorAfterSent.length);
            messageData = 'FSFN import completed with errors that have been sent to the support team.  ' + errorAfterSent;
        } else {
            logger.info('FSFN IMPORT: Import completed with no logged messages or errors.');
            messageData = 'Import completed with no logged messages or errors.';
        }

        logger.info('FSFN IMPORT: Error Log: ' + 'Errors:' + errors.join('; '));
        return vvClient.scheduledProcess.postCompletion(scheduledProcessGUID, 'complete', true, messageData);
    } catch (err) {
        logger.info('FSFN IMPORT: ERROR: ' + JSON.stringify(err));
        sendErrorLogEmail();
        let messageData = '';

        if (err && err.message) {
            messageData = 'An error has occured while processing the FSFN Import: ' + err.toString() + err.stack + errors.join('; ');
        } else {
            messageData = 'An unknown error has occured while processing the FSFN Import.' + errors.join('; ');
        }

        //Append the error message to the errors array for use by the error notification
        errors.push(messageData);
        logger.info('FSFN IMPORT: Error Log: ' + 'Errors:' + errors.join('; '));

        return vvClient.scheduledProcess.postCompletion(scheduledProcessGUID, 'complete', false, messageData);
    }
};

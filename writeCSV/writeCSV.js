const logger = require("../log");
const fs = require("fs");
//const Buffer = require("buffer");

const writeCSV = async function (data, csvFileName, separator = ",") {
    /*
    Converts JSON, objects or arrays into csv and writes the csv file on a predeterminated path.
    Parameters:
            data: Input data to convert to csv.
            csvFileName: A string with the name for the new file. It could be the name with the csv extension or only the name.
            separator (Optional): A string with the character used as separator.
    */

    // Response array to be returned
    // outputCollection[0]: Status
    // outputCollection[1]: Short description message
    // outputCollection[2]: Data. Path of the created file if the process is successful
    const outputCollection = [];
    // Array for capturing error messages that may occur within helper functions.
    const errorLog = [];

    let fileBuffer = null;
    let saveFilePath = null;

    let fileFolder = "./lib/VVRestApi/VVRestApiNodeJs/files";
    //let fileFolder = "./files";

    // If file name passed don't have an appropriate file extension, here it is added.
    if (csvFileName.endsWith(".csv")) {
        saveFilePath = fileFolder + "/" + csvFileName;
    } else {
        saveFilePath = fileFolder + "/" + csvFileName + ".csv";
    }

    // check if folder exists, if folder does not exist try to create it
    try {
        await fs.promises.access(fileFolder);
    } catch (error) {
        // The folder does not exist, try to create it
        await fs.promises
            .mkdir(fileFolder, { recursive: true })
            .then(function () {
                logger.info("Directory created successfully");
            })
            .catch(function () {
                logger.info("Failed to create directory");
            });
    }

    function parseRes(data) {
        /*
    Generic JSON parsing function
    Parameters:
            data: data to be converted to JSON format
    */
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(data);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === "object") {
                data = jsObject;
            }
        } catch (e) {
            // If an error ocurrs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return data;
    }

    // Function used to parse input data
    function toCsv(obj, columnDelimiter, lineDelimiter) {
        // configure this according to your location and project needs:
        const COLUMN_SEPARATOR = ",";
        const NUMERIC_COMMA = ".";

        function convertSimpleValue(value, columnDelimiter) {
            if (value == null || value == undefined) {
                return "";
            }

            let type = typeof value;
            if (columnDelimiter == null) columnDelimiter = COLUMN_SEPARATOR;

            value = String(value);
            if (type == "number" && NUMERIC_COMMA != ".") {
                value = value.replace(".", NUMERIC_COMMA);
            }
            // converting \n to \\n is not part of CSV!

            if (value.includes('"')) {
                value = value.replace(/"/g, '""');
            }
            if (value.includes('"') || value.includes(columnDelimiter) || value.includes("\n")) {
                value = `"${value}"`;
            }
            return value;
        }

        function buildKeys(...objs) {
            let keys = [];
            for (let obj of objs) {
                for (let key in obj) {
                    if (!keys.includes(key)) {
                        keys.push(key);
                    }
                }
            }
            return keys;
        }

        function convertObject(obj, columnDelimiter, keys) {
            if (obj == null || obj == undefined) {
                return "";
            }
            if (typeof obj != "object") {
                return convertSimpleValue(obj, columnDelimiter);
            }

            if (columnDelimiter == null) columnDelimiter = COLUMN_SEPARATOR;

            if (keys == null) keys = buildKeys(obj);

            let values = [];
            // for..of works differently compared to Object.values() and Object.entries()
            for (let key of keys) {
                values.push(convertSimpleValue(obj[key], columnDelimiter));
            }
            return values.join(columnDelimiter);
        }

        function convertArray(arr, columnDelimiter, lineDelimiter) {
            if (arr == null || arr == undefined || !arr.length) {
                return "";
            }

            if (columnDelimiter == null) columnDelimiter = COLUMN_SEPARATOR;

            if (lineDelimiter == null) lineDelimiter = "\n";

            let keys = buildKeys(...arr);
            let lines = [keys.map(convertSimpleValue).join(columnDelimiter), ...arr.map((obj) => convertObject(obj, columnDelimiter, keys))];
            return lines.join(lineDelimiter);
        }

        if (Array.isArray(obj)) {
            return convertArray(obj, columnDelimiter, lineDelimiter);
        }
        return convertObject(obj, columnDelimiter);
    }

    // 1. PARSE DATA IF IT IS A STRING
    logger.info("writeCSV: processing data to file: " + csvFileName + ".");

    let inputData = parseRes(data);

    // 2. CONVERT DATA TO CSV
    await new Promise(function (resolve) {
        resolve(toCsv(inputData, separator, null));
    })
        .then(function (file) {
            fileBuffer = file;
        })
        .then(function () {
            if (fileBuffer) {
                logger.info("writeCSV: Writing file to folder.");

                // 3. WRITE THE FILE TO THE NODE SERVER FOLDER

                // Need to manually create a promise to return to caller and resolve it once finished with the file write
                return new Promise(function (resolve) {
                    fs.writeFile(saveFilePath, fileBuffer, function (err) {
                        if (!err) {
                            deleteOriginalFile = true;
                            logger.info("writeCSV: File written successfully.");

                            // Builds the success response array
                            outputCollection[0] = "Success";
                            outputCollection[1] = "Process Complete";
                            outputCollection[2] = `CSV file created at: ${saveFilePath}`;
                        } else {
                            logger.info("writeCSV: Unable to write file: " + err);
                            throw new Error(csvFileName + ": There was an error downloading the document.");
                        }

                        //Always resolve the promise so the promise chain isn't interrupted
                        resolve();
                    });
                });
            } else {
                throw new Error(csvFileName + ": Error obtaining document bytes.");
            }
        })
        .catch(function (err) {
            errorLog.push(err.message ? err.message : err);
            logger.info(JSON.stringify(errorLog));

            // Builds the error response array
            outputCollection[0] = "Error";
            outputCollection[1] = err.message ? err.message : err;
        });

    return outputCollection;
};

//////// FOR TESTING PURPOSES ///////

const input1 = [
    ["uno", "dos"],
    ["tres", "cuatro"],
];
const input2 = '[{"prop1":"hola","prop2":45},{"prop1":"chau","prop2":55}]';
const input3 = { name: "John", age: 30, car: "Ford" };
const input4 = [
    { name: "John", age: 30, car: "Ford" },
    { name: "Anne", age: 45, car: "Chevrolet" },
    { name: "Mary", age: 25, car: "Chrysler" },
];

writeCSV(input4, "testFile4.csv", ",").then((res) => console.log(res));
//writeCSV(input4, "testFile4.csv").then((res) => console.log(res));
//writeCSV(input4, "testFile4").then((res) => console.log(res));

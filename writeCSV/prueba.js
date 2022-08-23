var Buffer = require("buffer");
var fs = require("fs");

function parseObject(o) {
    let res = "";

    if (typeof o == "object") {
        if (o.length > 0) {
            for (const i of o) {
                res += i.toString() + "\n";
            }
        } else {
            res = o.toString();
        }
    }

    return res;
}

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

const Example1 = [
    ["Pablo", "18"],
    ["Juan", "32"],
    ["Jorge", "24"],
];

/*
const Example1 = [{
    Comment: "Good",
    Experince_Months: "4",
    Experince_Years: "4",
    Score: "3",
    Subject: "CPP",
    Topic: "Scripting (mention details)"
    },
    {
    Comment: "Excilent",
    Experince_Months: "6",
    Experince_Years: "6",
    Score: "6",
    Subject: "CSharp",
    Topic: "WPF"
    }]
*/

const s1 = toCsv(Example1, ",", "\n");

const a = Buffer.Buffer.from(s1);

const fileName = "prueba.csv";

fs.writeFile(fileName, a, function (err) {
    console.log(err);
});

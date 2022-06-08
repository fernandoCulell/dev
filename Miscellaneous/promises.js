let flagOk = true;

const promise = new Promise((resolve, reject) => {
    if (flagOk) {
        setTimeout(function () {
            resolve("hello world");
        }, 2000);
    } else {
        reject("something went wrong");
    }
});

promise
    .then((data) => data + " 1")
    .then((data) => data + " 2")
    .then((data) => data + " 3")
    .then((data) => console.log(data))
    .catch((error) => console.error(error))
    .finally(console.log("Process executed"));

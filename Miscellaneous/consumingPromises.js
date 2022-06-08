fetch("./hellotext.txt")
    .then((response) => response.text())
    .then((data) => console.log(data))
    .catch((error) => console.error(error))
    .finally(() => console.log("Process completed."));

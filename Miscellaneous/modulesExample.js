import Person from "./modules/person.js";
import { name, occupation, nationality, age } from "./modules/mary.js";

const mary = new Person(name, occupation, nationality, age);

console.log(mary);

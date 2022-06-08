const listOfEmployees = [
    { name: "Anne Doe", role: "Sales Manager" },
    { name: "John Doe", role: "HR Manager" },
    { name: "Jane Doe", role: "Product Owner" },
];

for (const employee of listOfEmployees) {
    let divCard = document.createElement("div");
    let card = `<div class="card">
                    <div class="container">
                        <h4><b>${employee.name}</b></h4> 
                        <p>${employee.role}</p> 
                    </div>
                </div>
                `;
    divCard.innerHTML = card;
    const parent = document.querySelector("#list");
    parent.append(divCard);
}

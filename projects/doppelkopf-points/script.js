function setAddr() {
    document.body.innerHTML += `
    
  <div class="popUp">
    <h3>Enter the start of the server address:</h3>
    <input type="text" name="add" id="srv_addr">
    <button onclick="localStorage.setItem('server', 'https://'+document.getElementById('srv_addr').value+'dymszuuaqyugwf.supabase.co'); window.location.reload()">Save</button>
  </div>`
    
}
if (!localStorage.getItem("server")) {
    setAddr();
}
const server = localStorage.getItem("server");
if (document.getElementById("quote")) {
    const quotes = ["Doppelkopf ist die META", "Skillissue", "Der Sinn des Lebens ist Doppelkopf", "Ein Tag ohne Doppelkopf ist ein Tag ohne Sinn", "Entweder spielt man Doppelkopf oder man sieht das eigene Leben an einem vorbeiziehen", "Oeddeloeddeldoeddel", "Das ist nen goofie Blatt"]
    document.getElementById("quote").innerText = "„" + quotes[Math.floor(Math.random() * quotes.length)] + "“";
}

function getCurrent() {
    fetch(server+"/functions/v1/getCurrent", {
        method: "GET",
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.success) {
                let table = document.getElementById("cur").querySelector("table");
                let html = `<tr><th>No.</th>`;
                for (let user of json.users) {
                    html += `<th>${user.name}</th>`;
                }
                html += `<th>Böcke</th></tr><tr><td>${json.data.id}</td>`;
                for (let user of json.users) {
                    html += `<td>${user.points}</td>`;
                }
                html += `<td>${json.data.bock}</td></tr>`;
                table.innerHTML = html;
            } else console.error(json.message);
        });
}
function getAll() {
    fetch(server+"/functions/v1/getAll", {
        method: "GET",
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.success) {
                let table = document.getElementById("full").querySelector("table");
                let html = `<tr><th>No.</th>`;
                let users = {};
                let points = []
                for (let i = 0; i < json.users.length; i++) {
                    html += `<th>${json.users[i].name}</th>`;
                    users[json.users[i].name] = i;
                    points.push(0);
                }
                html += "<th>Böcke</th></tr>";
                for (let round of json.data) {
                    for (let value of Object.keys(round.points)) {
                        points[users[value]] += round.points[value];
                    }
                    html += `<tr><td>${round.id}</td>`;
                    for (let i = 0; i < json.users.length; i++) {
                        html += `<td>${points[i]}</td>`;
                    }
                    html += `<td>${round.bock}</td></tr>`;
                }
                table.innerHTML = html;
                doStats(json.data, json.users);
            } else console.error(json.message);
        });
}
function addRound() {
    const personFields = document.getElementById("personFields");
    let sum = 0;
    let data = {}
    let valuesForNext = [];
    const persons = personFields.querySelectorAll(".person");
    const numbers = personFields.querySelectorAll(".number");
    for (let i = 0; i < 4; i++) {
        let number = numbers[i].value;
        if (number != Number(number) || Number(number) == 0)
            return;
        data[persons[i].value] = Number(number);
        valuesForNext.push(persons[i].value);
        sum += Number(number);
    }
    valuesForNext.push(personFields.querySelector("#eintragender").value);
    localStorage.setItem("lastPlayers", JSON.stringify(valuesForNext));
    if (Object.keys(data).length != 4)
        return
    if (sum !== 0)
        return;

    fetch(server+"/functions/v1/addRound", {
        method: "POST",
        body: JSON.stringify({
            points: data,
            eintraeger: personFields.querySelector("#eintragender").value,
            bock: personFields.querySelector("#bock").checked
        }),
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.success) {
                document.location.href = ".."
            } else console.error(json.message);
        });
}
function getAddUsers() {
    fetch(server+"/functions/v1/getUsers", {
        method: "GET",
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.success) {
                const personFields = document.getElementById("personFields");
                let persons = [];
                for (let user of json.users) {
                    persons.push(user.name);
                }
                for (let i = 0; i < 4; i++) {
                    let div = document.createElement("div");
                    div.innerHTML = `
                        <select class='person'>
                            ${persons.map(person => `<option value="${person}">${person}</option>`).join("")}
                        </select>
                        <input type="number" class="number" placeholder="Enter points" required>
                    `;
                    personFields.appendChild(div);
                }
                personFields.innerHTML += `
                <br>
                <label>You: </label>
                <select id="eintragender">
                            ${persons.map(person => `<option value="${person}">${person}</option>`).join("")}
                </select>
                <br>
                <br>
                <label>New Bocks? </label>
                <input type="checkbox" id="bock">
                <br>

                <button onclick="addRound()">Add Round</button>

                `;
                const lastValues = localStorage.getItem("lastPlayers") ? JSON.parse(localStorage.getItem("lastPlayers")) : [" ", " ", " ", " ", " "];
                for (let i = 0; i < personFields.querySelectorAll("select").length; i++) {
                    personFields.querySelectorAll("select")[i].value = lastValues[i];
                }
            } else console.error(json.message);
        });
}

class BarChart {
    constructor (title, data, canvas, isPercentage) {
        this.title = title;
        this.data = data;
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.isPercentage = isPercentage;
        this.draw();
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "14px Arial";
        let maxVal = Math.max(...Object.values(this.data));
        if (maxVal == 0)
            maxVal = 1;     //to not divide by zero
        const minVal = Math.min(...Object.values(this.data));   //wanted to make avg win/lose points in one plot -> negative values
                                                                //and total points ofc
        const barWidth = (this.canvas.width - 20) / (Object.keys(this.data).length * 1.5);
        const scaleFactor = (this.canvas.height * 0.9 - 20) / maxVal;

        

        for (let i = 0; i < Object.keys(this.data).length; i++) {
            const key = Object.keys(this.data)[i];
            const val = this.data[key];
            const x = 20 + i * (barWidth) + barWidth * 0.25;
            const height = val * scaleFactor;
            const y = (this.canvas.height * 0.9) - height;

            this.ctx.fillStyle = "#FFF";
            this.ctx.fillRect(x, y, barWidth/1.5, height);
    
            let valText = "" + Math.round(val*100)/100;
            if (this.isPercentage) {
                valText = "" + Math.round(val*100) + "%";
            }
            this.ctx.fillText(valText, x, y - 5);
    
            this.ctx.fillText(key.slice(0,4), x, this.canvas.height - 4);
        }
    }
}

function doStats(data, users) {
    let userNames = [];
    let participation = {};
    let wins = {};
    let soli = {};
    let eintragender = {};
    let winPoints = {};
    let losePoints = {};
    let bocks = 0.0;

    for (let user of users) {
        userNames.push(user.name);
        participation[user.name] = 0;
        soli[user.name] = 0;
        winPoints[user.name] = 0;
        losePoints[user.name] = 0;
        wins[user.name] = 0;
        eintragender[user.name] = 0;
    }

    for (let round of data) {
        if (Object.keys(round.points).length == 0)
            continue;



        if (round.eintragender != null && round.eintragender != "" && round.eintragender != " ") {
            eintragender[round.eintragender] += 1;
        }
        if (Number(round.bock) > 0) {
            bocks += 1.0;
        }
        for (let player of Object.keys(round.points)) {
            participation[player] += 1;
            if (round.points[player] > 0) {
                wins[player] += 1;
                winPoints[player] += round.points[player];
            } else if (round.points[player] < 0) {
                losePoints[player] -= round.points[player];
            }

        }

        //prob overly complicated but whatever
        const count = {};
        for (let num of Object.values(round.points)) {
            count[num] = (count[num] || 0) + 1;
        }
        if (Object.values(count)[0] == 3) {
            for (let player of Object.keys(round.points)) {
                if (round.points[player] == Number(Object.keys[1])) {
                    soli[player] += 1;
                }
            }
            
        } else if (Object.values(count)[1] == 3) {
            for (let player of Object.keys(round.points)) {
                if (round.points[player] == Number(Object.keys(count)[0])) {
                    soli[player] += 1;
                }
            }
        }


    }
    for (let user of userNames) {
        if (data.length-1 > 1) {
            if (participation[user] > 0) {
                if (wins[user] > 0) {
                    winPoints[user] /= wins[user];
                }
                if (participation[user] - wins[user] > 0) { //technically inaccurate beacuse of round with 0 points but whatever
                    losePoints[user] /= participation[user] - wins[user];
                }
                wins[user] /= participation[user];
                soli[user] /= participation[user];
                
            }
            participation[user] /= data.length-1;
            eintragender[user] /= data.length-1;
            
        }

    }
    if (data.length-1 > 1) {
        bocks /= data.length-1;
    }

    new BarChart("Participation", participation, document.getElementById("participation"), true);    //title, data, canvas, siPercentage
    new BarChart("Average Win points", winPoints, document.getElementById("winP"), false);    //title, data, canvas, siPercentage
    new BarChart("Average Lose points", losePoints, document.getElementById("loseP"), false);    //title, data, canvas, siPercentage
    new BarChart("Wins", wins, document.getElementById("wins"), true);    //title, data, canvas, siPercentage
    new BarChart("Eintragender", eintragender, document.getElementById("eintragender"), true);    //title, data, canvas, siPercentage
    new BarChart("Soli", soli, document.getElementById("soli"), true);    //title, data, canvas, siPercentage
    document.getElementById("num_bocks").innerText = "" + Math.round(bocks*1000)/10 + "% of the rounds were Böckis."
}

if (document.getElementById("cur")) {
    getCurrent();
}

if (document.getElementById("full")) {
    getAll();
}
if (document.getElementById("addRound")) {
    getAddUsers();
}
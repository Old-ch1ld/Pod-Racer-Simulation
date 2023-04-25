// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
    track_id: undefined,
    player_id: undefined,
    race_id: undefined,
    tracks: [],
    players: [],
};

// update state
const updateState = (newState) => {
    store = { ...store, ...newState };
};

// read state
const readState = (property) => store[property];

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    onPageLoad();
    setupClickHandlers();
});

async function onPageLoad() {
    try {
        getTracks().then((tracks) => {
            updateState({ tracks });
            const html = renderTrackCards(tracks);
            renderAt("#tracks", html);
        });

        getRacers().then((racers) => {
            updateState({ players: racers });
            const html = renderRacerCars(racers);
            renderAt("#racers", html);
        });
    } catch (error) {
        console.log("Problem getting tracks and racers ::", error.message);
        console.error(error);
    }
}

function setupClickHandlers() {
    document.addEventListener(
        "click",
        function (event) {
            const { target } = event;

            // Race track form field
            if (target.matches(".card.track")) {
                handleSelectTrack(target);
            }

            // Podracer form field
            if (target.matches(".card.podracer")) {
                handleSelectPodRacer(target);
            }

            // Submit create race form
            if (target.matches("#submit-create-race")) {
                event.preventDefault();

                // start race
                handleCreateRace();
            }

            // Handle acceleration click
            if (target.matches("#gas-peddle")) {
                handleAccelerate(target);
            }
        },
        false
    );
}

async function delay(ms) {
    try {
        return await new Promise((resolve) => setTimeout(resolve, ms));
    } catch (error) {
        console.log("an error shouldn't be possible here");
        console.log(error);
    }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
    try {
        const tracks = readState("tracks");
        const selectedTrackId = readState("track_id");
        const selectedPlayerId = readState("player_id");
        const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
        // render starting UI
        renderAt("#race", renderRaceStartView(selectedTrack));

        // invoke the API call to create the race, then save the result
        const { ID: race_id } = await createRace(
            selectedPlayerId,
            selectedTrackId
        );

        // update the store with the race id
        updateState({ race_id });

        // The race has been created, now start the countdown
        // call the async function runCountdown
        await runCountdown();

        // call the async function startRace
        await startRace(race_id);

        // call the async function runRace
        await runRace(race_id);
    } catch (err) {
        console.error(err);
    }
}

function runRace(raceID) {
    return new Promise((resolve) => {
        let raceInterval;
        try {
            // use Javascript's built in setInterval method to get race info every 500ms
            raceInterval = setInterval(async () => {
                try {
                    const res = await getRace(raceID);
                    // if the race info status property is "in-progress", update the leaderboard by calling:
                    if (res.status === "in-progress") {
                        renderAt("#leaderBoard", raceProgress(res.positions));
                    } else if (res.status === "finished") {
                        // if the race info status property is "finished", run the following:
                        clearInterval(raceInterval); // to stop the interval from repeating
                        renderAt("#race", resultsView(res.positions)); // to render the results view
                        resolve(res); // resolve the promise
                    }
                } catch (err) {
                    console.log(
                        "Err...something went wrong. The race can't start "
                    );
                    clearInterval(raceInterval); // to stop the interval from repeating
                }
            }, 500);
        } catch (err) {
            // remember to add error handling for the Promise
            clearInterval(raceInterval); // to stop the interval from repeating
            console.error(err);
        }
    });
}

async function runCountdown() {
    try {
        // wait for the DOM to load
        await delay(1000);
        let timer = 3;

        return new Promise((resolve) => {
            // use Javascript's built in setInterval method to count down once per second
            const interval = setInterval(() => {
                timer--;
                // run this DOM manipulation to decrement the countdown for the user
                document.getElementById("big-numbers").innerHTML = timer;

                // if the countdown is done, clear the interval, resolve the promise, and return
                if (timer === 1) {
                    clearInterval(interval);
                    resolve(timer);
                    return;
                }
            }, 1000);
        });
    } catch (error) {
        console.log(error);
    }
}

function handleSelectPodRacer(target) {
    // remove class selected from all racer options
    const selected = document.querySelector("#racers .selected");
    if (selected) {
        selected.classList.remove("selected");
    }

    // add class selected to current target
    target.classList.add("selected");

    // save the selected racer to the store
    updateState({ player_id: +target.id });
}

function handleSelectTrack(target) {
    // remove class selected from all track options
    const selected = document.querySelector("#tracks .selected");
    if (selected) {
        selected.classList.remove("selected");
    }

    // add class selected to current target
    target.classList.add("selected");

    // save the selected track id to the store
    updateState({ track_id: +target.id });
}

async function handleAccelerate() {
    const selectedRaceId = readState("race_id");
    // Invoke the API call to accelerate
    accelerate(selectedRaceId);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
    if (!racers.length) {
        return `
			<h4>Loading Racers...</4>
		`;
    }

    const results = racers.map(renderRacerCard).join("");

    return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
    const { id, driver_name, top_speed, acceleration, handling, img } = racer;

    return `
		<li class="card podracer" id="${id}">
            <img src="assets/images/${img}.webp"/>
			<h3>${driver_name}</h3>
			<p>Max speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
    if (!tracks.length) {
        return `
			<h4>Loading Tracks...</4>
		`;
    }

    const results = tracks.map(renderTrackCard).join("");

    return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
    const { id, name, img } = track;

    return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
            <img src="assets/images/${img}.png"/>
		</li>
	`;
}

function renderCountdown(count) {
    return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
    return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
    positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

    return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
    const players = readState("players");
    const selectedPlayerId = readState("player_id");

    positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
    let count = 1;

    const results = positions.map((p) => {
        const player = players.find((e) => e.id === p.id);

        player.id === selectedPlayerId &&
            !player.driver_name.includes("you") &&
            (player.driver_name += " (you)");

        return `
			<tr>
				<td>
					<h3>${count++} - ${player.driver_name}</h3>
				</td>
			</tr>
		`;
    });

    return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
    const node = document.querySelector(element);

    node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
    return {
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": SERVER,
        },
    };
}

// Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
    // GET request to `${SERVER}/api/tracks`
    try {
        const data = await fetch(`assets/json/tracks.json`, { method: "GET" });

        const res = await data.json();

        return res;
    } catch (error) {
        console.error(error);
    }
}

async function getRacers() {
    // GET request to `${SERVER}/api/cars`
    try {
        const data = await fetch(`assets/json/cars.json`, { method: "GET" });

        return await data.json();
    } catch (error) {
        console.error(error);
    }
}

function createRace(player_id, track_id) {
    const body = {
        player_id: parseInt(player_id),
        track_id: parseInt(track_id),
    };

    return fetch(`${SERVER}/api/races`, {
        method: "POST",
        ...defaultFetchOpts(),
        dataType: "jsonp",
        body: JSON.stringify(body),
    })
        .then((res) => res.json())
        .catch((err) => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
    // GET request to `${SERVER}/api/races/${id}`
    try {
        const res = await fetch(`${SERVER}/api/races/${id - 1}`);

        return await res.json();
    } catch (e) {
        console.error(err);
    }
}

async function startRace(id) {
    try {
        const res = await fetch(`${SERVER}/api/races/${id - 1}/start`, {
            method: "POST",
            ...defaultFetchOpts(),
        });
        return res;
    } catch (err) {
        console.log("Problem with getRace request::", err);
    }
}

async function accelerate(id) {
    // POST request to `${SERVER}/api/races/${id}/accelerate`
    // options parameter provided as defaultFetchOpts
    // no body or datatype needed for this request
    try {
        return await fetch(`${SERVER}/api/races/${id - 1}/accelerate`, {
            method: "POST",
            ...defaultFetchOpts(),
        });
    } catch (err) {
        console.error(err);
    }
}

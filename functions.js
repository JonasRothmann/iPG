/* --- Question Functions --- */

function next_q() {
  if (document.querySelector('#end').classList.contains('hide')) {
		question = q.shift();

		if (question != 'done') {
      if(question) document.querySelector('#question').innerHTML = question;
      timer_restart();
    } else {
      document.querySelector('#question').classList.add('hide');
      document.querySelector('#timer').classList.add('hide');
      document.querySelectorAll('.pg').forEach(el => el.classList.add('hide'));

      document.querySelector('#end').classList.remove('hide');
    }
  }
}

function retry(question) {
  if (document.querySelector('#end').classList.contains('hide')) {
		document.querySelector('#response').innerHTML = '';
		document.querySelector('#openai').innerHTML = '';
		document.querySelector('#question').classList.add('transparent');


  }
}

/* --- Timer Functions --- */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition;
if (!SpeechRecognition) console.warn("not supported")


let recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;
recognition.continuous = true;

let started = false;
let timer = 50;
let timerId;

function timer_tick() {
  document.querySelector('#timer').classList.remove('warning');
  document.querySelector('#timer').classList.remove('fail');

  timer = timer - 1;

  document.querySelector('#timer').innerHTML = timer + ' s';

  if (timer < 10) {
    document.querySelector('#timer').classList.add('warning');
  }
  if (timer < 5) {
    document.querySelector('#timer').classList.remove('warning');
    document.querySelector('#timer').classList.add('fail');
  }
  if (timer <= 0) {
		clearInterval(timerId);
		on_question_end();
  }
}

function timer_restart() {
	document.querySelector('#response').innerHTML = '';
	document.querySelector('#openai').innerHTML = '';

	recognition.abort();
  clearInterval(timerId);
  document.querySelector('#timer').classList.remove('warning');
  document.querySelector('#timer').classList.remove('fail');
  document.querySelectorAll('.pg').forEach(el => el.classList.add('hide'));
  document.querySelector('#timer').classList.remove('hide');

  timer = 50;

	recognition = new SpeechRecognition();
	recognition.lang = "en-US";
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;
	recognition.continuous = true;

	//if recognition isnt started then start it
	recognition.start();

  recognition.onresult = function (event) {
		if(timer <= 0) return;
    let speechResult = event.results[event.results.length - 1][0].transcript;
		// first letter should be capitalized
    document.querySelector('#response').innerHTML += `${speechResult.charAt(0).toUpperCase() + speechResult.slice(1)}. `;
  }

	recognition.onstart = function () {
		timerId = setInterval(timer_tick, 1000);
    document.querySelector('#question').classList.remove('transparent');
    document.querySelector('#loading').classList.remove('hide');
	}
}

function on_question_end() {
	recognition.abort();
	document.querySelector('#timer').classList.add('hide');
	document.querySelector('#loading').classList.add('hide');

	const companyDescription = localStorage.getItem("companyDescription");
	const question = document.querySelector('#question').innerHTML;
	const response = document.querySelector('#response').innerHTML;

	fetch("https://ipg-key.vercel.app/api/openai-api", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: "You are a helpful assistant trained to analyze and grade responses to Y-Combinator interview simulator questions. You ignore grammatical errors as the user data is generated from speech-to-text, as well as other errors that may occour from that."
				},
				{
					role: "user",
					content: `Please analyze and grade the following response to a Y-Combinator interview simulator question. Provide a score from 1 to 10, with 8 being a great answer but still optainable, along with feedback on what was good, what was bad, suggestions for improvement and an example of a better response. You ignore grammatical errors as the user data is generated from speech-to-text, as well as other errors that may occour from that. The user is given 50 seconds to respond to the question, so you should not expect a super in-depth response. If the user does not give a response at all, then give the user a 0/10 grade and do not give the user any "good" attributes. A 5/10 response should be middling and somewhat answer the question, but have plenty of room for improvement. A 10/10 should be an answer that is precise, intelligent, and coherent. 

					Company description: ${companyDescription}
					Question: ${question}
					Response: ${response}

					Use the following format:

					Grade: X/10

					Good: 
					Bad: 

					Suggestions: 

					Better response: "A better response to the question would be..."`
				}
			],
			temperature: 0.7,
			max_tokens: 2000
		})
	})
		.then((response) => response.json())
		.then((data) => {
			if(!data) throw new Error("OpenAI returned empty body")
			else if (data.error) throw new Error(data.error)
			else if (!data.choices.length) throw new Error("OpenAI sent invalid response format")
			console.log(data, data.choices[0].message.content)

			document.querySelector('#openai').innerHTML = data.choices[0].message.content;
		})
		.catch((error) => {
		console.error("Error:", JSON.stringify(error));
		alert(`An error occurred: ${error.message}`); 
		})

}


/* --- Tip Functions --- */

function display_tip() {
  // not implemented
}

/* --- Loading animation --- */
const loadingEl = document.getElementById('loading');
const numDots = 3;
let numVisibleDots = 1;

setInterval(() => {
  document.getElementById('loading').innerHTML = '';
  for (let i = 0; i < numVisibleDots; i++) {
    const dot = document.createElement('span');
    dot.textContent = '.';
    document.getElementById('loading').appendChild(dot);
  }
  numVisibleDots++;
  if (numVisibleDots > numDots) {
    numVisibleDots = 1;
  }
}, 500);
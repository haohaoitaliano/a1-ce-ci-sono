(function () {
  "use strict";

  var questions = [
    { sentence: "Sul tavolo ___ un cellulare.", options: ["c'è", "ci sono", "ho"], answer: 0 },
    { sentence: "Sul tavolo ___ due matite.", options: ["c'è", "ci sono", "ha"], answer: 1 },
    { sentence: "In Italia ___ tanti cinesi.", options: ["ha", "c'è", "ci sono"], answer: 2 },
    { sentence: "In classe ___ un ragazzo cinese.", options: ["c'è", "ci sono", "ha"], answer: 0 },
    { sentence: "In classe ___ tre ragazze italiane.", options: ["c'è", "ci sono", "hanno"], answer: 1 },
    { sentence: "A Roma ___ una questura.", options: ["ci sono", "ha", "c'è"], answer: 2 },
    { sentence: "Io ___ un fidanzato.", options: ["c'è", "ho", "ci sono"], answer: 1 },
    { sentence: "Tu ___ un gatto.", options: ["hai", "c'è", "ci sono"], answer: 0 },
    {
      sentence: "In classe ___ un'insegnante e ___ dieci studenti.",
      groups: [
        { label: "第一个空", options: ["c'è", "ci sono", "ha"], answer: 0 },
        { label: "第二个空", options: ["ha", "c'è", "ci sono"], answer: 2 }
      ]
    },
    { sentence: "A scuola ___ tanti studenti stranieri.", options: ["hanno", "ci sono", "c'è"], answer: 1 }
  ];

  var letters = ["A", "B", "C"];
  var currentIndex = 0;
  var isAnswered = false;
  var groupAnswers = [];
  var pendingSummary = null;

  var introView = document.getElementById("intro-view");
  var quizView = document.getElementById("quiz-view");
  var summaryView = document.getElementById("part-summary");
  var completionView = document.getElementById("completion-view");
  var progress = document.getElementById("progress");
  var progressBar = document.getElementById("progress-bar");
  var partLabel = document.getElementById("part-label");
  var instructionIt = document.getElementById("instruction-it");
  var instructionZh = document.getElementById("instruction-zh");
  var questionNumber = document.getElementById("question-number");
  var questionText = document.getElementById("question-text");
  var options = document.getElementById("options");
  var doubleOptions = document.getElementById("double-options");
  var feedback = document.getElementById("feedback");
  var continueButton = document.getElementById("continue-button");
  var startButton = document.getElementById("start-button");
  var summaryEyebrow = document.getElementById("summary-eyebrow");
  var summaryRules = document.getElementById("summary-rules");
  var summaryContinue = document.getElementById("summary-continue");
  var restartTop = document.getElementById("restart-top");
  var restartBottom = document.getElementById("restart-bottom");

  function createOptionButton(option, optionIndex, groupIndex) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.setAttribute("data-index", String(optionIndex));
    button.setAttribute("aria-label", letters[optionIndex] + ". " + option);

    if (typeof groupIndex === "number") {
      button.setAttribute("data-group", String(groupIndex));
      button.addEventListener("click", chooseGroupAnswer);
    } else {
      button.addEventListener("click", chooseAnswer);
    }

    var letter = document.createElement("span");
    letter.className = "option-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = letters[optionIndex];

    var text = document.createElement("span");
    text.className = "option-text";
    text.textContent = option;

    var status = document.createElement("span");
    status.className = "option-status";
    status.setAttribute("aria-hidden", "true");
    status.textContent = "·";

    button.appendChild(letter);
    button.appendChild(text);
    button.appendChild(status);
    return button;
  }

  function renderSingleOptions(question) {
    options.hidden = false;
    doubleOptions.hidden = true;

    question.options.forEach(function (option, optionIndex) {
      options.appendChild(createOptionButton(option, optionIndex));
    });
  }

  function renderDoubleOptions(question) {
    options.hidden = true;
    doubleOptions.hidden = false;

    question.groups.forEach(function (group, groupIndex) {
      var fieldset = document.createElement("fieldset");
      fieldset.className = "option-group";

      var legend = document.createElement("legend");
      legend.textContent = group.label;
      fieldset.appendChild(legend);

      var groupContainer = document.createElement("div");
      groupContainer.className = "options";
      groupContainer.setAttribute("role", "group");
      groupContainer.setAttribute("aria-label", group.label);

      group.options.forEach(function (option, optionIndex) {
        groupContainer.appendChild(createOptionButton(option, optionIndex, groupIndex));
      });

      fieldset.appendChild(groupContainer);
      doubleOptions.appendChild(fieldset);
    });
  }

  function renderQuestion() {
    var question = questions[currentIndex];
    var isPartTwo = currentIndex >= 6;

    isAnswered = false;
    groupAnswers = question.groups ? question.groups.map(function () { return false; }) : [];
    progress.textContent = (currentIndex + 1) + " / " + questions.length;
    progressBar.style.width = ((currentIndex + 1) / questions.length * 100) + "%";
    partLabel.textContent = isPartTwo ? "PARTE 2" : "PARTE 1";
    instructionIt.textContent = isPartTwo ? "Avere o esserci?" : "C'è o ci sono?";
    instructionZh.textContent = isPartTwo
      ? "请选择正确答案，注意“拥有”和“某地有”的区别。"
      : "请选择正确答案。";
    questionNumber.textContent = "DOMANDA " + (currentIndex + 1);
    questionText.textContent = question.sentence;
    feedback.hidden = true;
    feedback.className = "feedback";
    feedback.textContent = "";
    continueButton.hidden = true;
    options.innerHTML = "";
    doubleOptions.innerHTML = "";

    if (question.groups) {
      renderDoubleOptions(question);
    } else {
      renderSingleOptions(question);
    }
  }

  function markWrong(button, option, optionIndex) {
    button.classList.add("is-wrong");
    button.querySelector(".option-status").textContent = "×";
    button.setAttribute("aria-label", letters[optionIndex] + ". " + option + ", risposta errata");
    feedback.textContent = "Riprova!";
    feedback.className = "feedback wrong";
    feedback.hidden = false;
  }

  function markQuestionCorrect(button, container) {
    isAnswered = true;
    button.classList.remove("is-wrong");
    button.classList.add("is-correct");
    button.querySelector(".option-status").textContent = "✓";
    feedback.textContent = "Bravissimo!";
    feedback.className = "feedback correct";
    feedback.hidden = false;
    continueButton.hidden = false;

    Array.prototype.forEach.call(container.querySelectorAll(".option-button"), function (optionButton) {
      optionButton.disabled = true;
    });
    continueButton.focus();
  }

  function chooseAnswer(event) {
    if (isAnswered) {
      return;
    }

    var selectedButton = event.currentTarget;
    var selectedIndex = Number(selectedButton.getAttribute("data-index"));
    var question = questions[currentIndex];

    if (selectedIndex === question.answer) {
      markQuestionCorrect(selectedButton, options);
      return;
    }

    markWrong(selectedButton, question.options[selectedIndex], selectedIndex);
  }

  function chooseGroupAnswer(event) {
    if (isAnswered) {
      return;
    }

    var selectedButton = event.currentTarget;
    var selectedIndex = Number(selectedButton.getAttribute("data-index"));
    var groupIndex = Number(selectedButton.getAttribute("data-group"));
    var question = questions[currentIndex];
    var group = question.groups[groupIndex];
    var fieldset = selectedButton.closest(".option-group");

    if (groupAnswers[groupIndex]) {
      return;
    }

    if (selectedIndex !== group.answer) {
      markWrong(selectedButton, group.options[selectedIndex], selectedIndex);
      return;
    }

    groupAnswers[groupIndex] = true;
    selectedButton.classList.remove("is-wrong");
    selectedButton.classList.add("is-correct");
    selectedButton.querySelector(".option-status").textContent = "✓";
    Array.prototype.forEach.call(fieldset.querySelectorAll(".option-button"), function (button) {
      button.disabled = true;
    });

    if (groupAnswers.every(function (answer) { return answer; })) {
      isAnswered = true;
      feedback.textContent = "Bravissimo!";
      feedback.className = "feedback correct";
      feedback.hidden = false;
      continueButton.hidden = false;
      continueButton.focus();
    } else {
      feedback.textContent = "Bene! Ora completa l'altro spazio.";
      feedback.className = "feedback correct";
      feedback.hidden = false;
    }
  }

  function showSummary(partNumber) {
    quizView.hidden = true;
    summaryView.hidden = false;
    pendingSummary = partNumber;
    summaryEyebrow.textContent = "PARTE " + partNumber + " COMPLETATA";

    if (partNumber === 1) {
      summaryRules.innerHTML =
        "<p class=\"rule-line\">C'è + 单数名词</p>" +
        "<p class=\"rule-line\">Ci sono + 复数名词</p>";
      summaryContinue.innerHTML = "Vai alla Parte 2 <span aria-hidden=\"true\">→</span>";
    } else {
      summaryRules.innerHTML =
        "<p class=\"rule-line\">Avere：某人拥有某物</p>" +
        "<p class=\"rule-line\">C'è / Ci sono：某个地方有某人或某物</p>" +
        "<p class=\"rule-note\">注意：c'è / ci sono 要根据所存在的人或东西的单复数判断，而不是根据地点判断。</p>";
      summaryContinue.innerHTML = "Continua <span aria-hidden=\"true\">→</span>";
    }

    summaryView.focus();
    window.scrollTo(0, 0);
  }

  function nextQuestion() {
    if (!isAnswered) {
      return;
    }

    if (currentIndex === 5) {
      showSummary(1);
      return;
    }

    if (currentIndex === questions.length - 1) {
      showSummary(2);
      return;
    }

    currentIndex += 1;
    renderQuestion();
    questionText.focus();
    window.scrollTo(0, 0);
  }

  function continueAfterSummary() {
    summaryView.hidden = true;

    if (pendingSummary === 1) {
      currentIndex = 6;
      quizView.hidden = false;
      renderQuestion();
      questionText.focus();
    } else {
      completionView.hidden = false;
      restartTop.hidden = true;
      completionView.focus();
    }

    pendingSummary = null;
    window.scrollTo(0, 0);
  }

  function startQuiz() {
    introView.hidden = true;
    quizView.hidden = false;
    renderQuestion();
    questionText.focus();
    window.scrollTo(0, 0);
  }

  function restart() {
    currentIndex = 0;
    isAnswered = false;
    groupAnswers = [];
    pendingSummary = null;
    quizView.hidden = true;
    summaryView.hidden = true;
    completionView.hidden = true;
    introView.hidden = false;
    restartTop.hidden = false;
    startButton.focus();
    window.scrollTo(0, 0);
  }

  questionText.setAttribute("tabindex", "-1");
  summaryView.setAttribute("tabindex", "-1");
  completionView.setAttribute("tabindex", "-1");
  startButton.addEventListener("click", startQuiz);
  continueButton.addEventListener("click", nextQuestion);
  summaryContinue.addEventListener("click", continueAfterSummary);
  restartTop.addEventListener("click", restart);
  restartBottom.addEventListener("click", restart);
}());

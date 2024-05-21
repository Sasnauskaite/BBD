//you can change the port number depending on the port that your server is running on
const port = '3000'; 

const boxCodeInputs = document.querySelectorAll("#boxes input");

function focusFirstBox() {
  const boxCodeInputs = document.querySelectorAll('.box-code-input input');
  let allEmpty = true;

  for (const input of boxCodeInputs) {
    if (input.value.trim() !== "") {
      allEmpty = false;
      break;
    }
  }

  if (allEmpty) {
    const firstBox = document.getElementById("boxCode1");
    if (firstBox) {
      firstBox.focus();
    }
  }
}

function replaceWhenFull(event) {
  const input = event.target;
  if (input.value.length === input.maxLength) {
    input.value = input.value.slice(0, -1) + event.key;
  }
}

function nextBox(event) {
  if (event.target.value.length === 1) {
    const nextInput = event.target.nextElementSibling;
    if (nextInput) {
      nextInput.focus();
    }
  }
}

function prevBox(event) {
  if (event.keyCode === 8 && event.target.value.length === 0) {
    const prevInput = event.target.previousElementSibling;
    if (prevInput) {
      prevInput.focus();
    }
  }
}

function validateInput(event, codeInputBox) {
  const key = String.fromCharCode(event.charCode);
  const regex = codeInputBox ? /[A-Za-z0-9ĄČĘĖĮŠŲŪŽąčęėįšųūž]/ : /[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]/;
  return regex.test(key);
}

function clearInputFields() {
  for (let i = 1; i <= 7; i++) {
    const boxCode = document.getElementById(`boxCode${i}`);
    boxCode.value = "";
  }
  document.getElementById("message").value = "";
  document.getElementById("sender").value = "";
}

function sendMessage() {
  const boxCodeInputs = document.querySelectorAll('.box-code-input input');
  let boxCode = '';
  let allFilled = true;

  boxCodeInputs.forEach(input => {
      if (input.value === '') {
          input.style.border = '2px solid #E84F7F';
          allFilled = false;
      } else {
          input.style.border = '';
          boxCode += input.value;
      }
  });

  const messageInput = document.getElementById('message');
  const senderInput = document.getElementById('sender');

  if (messageInput.value === '') {
      messageInput.style.border = '2px solid #E84F7F';
      allFilled = false;
  } else {
      messageInput.style.border = '';
  }

  if (senderInput.value === '') {
      senderInput.style.border = '2px solid #E84F7F';
      allFilled = false;
  } else {
      senderInput.style.border = '';
  }

  if (!allFilled) {
      showModal('Please fill in all the fields.');
      return;
  }

  const messageData = {
      code: boxCode,
      messageText: messageInput.value,
      senderName: senderInput.value
  };

  fetch('http://localhost:' + port + '/send-message', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.message === "Message sent successfully!") {
          showModal("Message sent successfully!");
          clearInputFields();
      } else {
          showModal("Failed to send message!");
          clearInputFields();
      }
  })
  .catch(error => {
      console.error("Error sending message:", error);
      showModal("Error sending message. Please try again later.");
  });
}

function showModal(messageContent) {
  const modal = document.getElementById("messageModal");
  const message = document.getElementById("modalMessage");
  const backdrop = document.getElementById("modalBackdrop");
  const body = document.querySelector("body");

  message.innerText = messageContent;
  modal.classList.add("show");
  backdrop.classList.add("show");
  body.classList.add("blur");

  setTimeout(() => {
    modal.classList.remove("show");
    backdrop.classList.remove("show");
    body.classList.remove("blur");
  }, 3000);
}
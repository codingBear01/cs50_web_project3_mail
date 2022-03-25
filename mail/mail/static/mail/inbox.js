document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document
    .querySelector('#inbox')
    .addEventListener('click', () => load_mailbox('inbox'));
  document
    .querySelector('#sent')
    .addEventListener('click', () => load_mailbox('sent'));
  document
    .querySelector('#archived')
    .addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document
    .querySelector('#compose-form')
    .addEventListener('submit', submit_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function submit_email(event) {
  event.preventDefault();

  const errorMessage = document.querySelector('.error_message');

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === 201) {
        load_mailbox('sent');
        console.log(result.message);
      } else {
        errorMessage.innerHTML = `<div class="alert alert-danger" role="alert">
            ${result.error}
          </div>`;
      }
    });
}

function compose_email() {
  document.querySelector('h3').innerHTML = 'New Email';

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector('#emails-view');
  const composeView = document.querySelector('#compose-view');

  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  composeView.style.display = 'none';

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  // Show all of the emails in mailbox
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((email) => {
        const item = document.createElement('div');

        item.innerHTML = `
        <div class="email">
          <div>No.${email.id} From: ${email.sender}|To: ${email.recipients}|Subject: ${email.subject}|${email.timestamp}</div>
        </div>
        `;

        emailsView.appendChild(item);

        if (mailbox === 'inbox') {
          item.addEventListener('click', () => {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                read: true,
              }),
            });
            show_email(email.id, mailbox);
          });
          email.read
            ? (item.style.background = 'grey')
            : (item.style.background = 'white');
        } else {
          item.addEventListener('click', () => show_email(email.id, mailbox));
        }
      });
    });

  // Read
}

function show_email(id, mailbox) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector('#emails-view').innerHTML = `
      <div>
        <div>From: ${email.sender} | ${email.timestamp}</div>
        <div>To: ${email.recipients}</div>
        <div>Subject: ${email.subject}</div>
        <div>${email.body}</div>
      </div>

      <div class="button_box">
        <button class="archive_button">Archive</button>
        <button class="reply_button">Reply</button>
      </div>
      `;

      const archiveButton = document.querySelector('.archive_button');
      const replyButton = document.querySelector('.reply_button');

      archiveButton.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived,
          }),
        });
        archiveButton.innerText === 'Archive'
          ? (archiveButton.innerText = 'Unarchive')
          : (archiveButton.innerText = 'Archive');
        if (email.archived) {
          archiveButton.innerText = 'Unarchive';
        } else {
          archiveButton.innerText = 'Archive';
        }
        console.log(email.archived);
      });

      replyButton.addEventListener('click', () => {
        reply_email(
          email.sender,
          email.subject,
          email.body,
          email.id,
          email.timestamp
        );
      });
    });
}

function reply_email(from, subject, body, id, time) {
  compose_email();

  document.querySelector('h3').innerHTML = 'Reply Email';
  document.querySelector('#compose-recipients').value = from;
  document.querySelector('#compose-subject').value =
    subject.slice(0, 4) === 'Re: ' ? subject : `Re: ${subject}`;
  document.querySelector('#compose-body').value = `On ${time} ${from} wrote: 
  ${body}
  `;
}

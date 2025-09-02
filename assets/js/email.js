// Ito ang iyong personal na Apps Script URL.
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX_8XE3wJPnCzMLpV_itFEF1tUB7iblUchBn7j35pQSnvwx6HkMMwMUouNSj7RGdh-/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Hanapin ang form sa iyong HTML gamit ang ID na 'contact-form'.
    const contactForm = document.getElementById('contact-form');
    // Hanapin ang submit button sa loob ng form.
    const submitButton = contactForm.querySelector('button[type="submit"]');

    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            // Pigilan ang default na pag-submit ng form para hindi mag-reload ang page.
            event.preventDefault();

            // Kunin ang original na text ng button at i-disable ito habang nagpapadala.
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span class="animate-spin" style="width: 20px; height: 20px; border: 2px solid transparent; border-top-color: white; border-radius: 50%; display: inline-block;"></span>
                Sending...
            `;
            
            // Kunin ang lahat ng data mula sa form.
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message'),
            };

            // Ipadala ang data sa iyong Apps Script URL gamit ang fetch.
            fetch(APPSCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Mahalaga ito para maiwasan ang CORS error sa simpleng setup.
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                // BINAGO: Pinalitan ang alert ng SweetAlert para sa success.
                Swal.fire({
                    title: 'Salamat!',
                    text: 'Matagumpay na naipadala ang iyong mensahe. 📬',
                    icon: 'success',
                    confirmButtonText: 'Okay',
                    confirmButtonColor: '#06b6d4' // Itinugma sa kulay ng theme mo.
                });
                contactForm.reset(); // I-clear ang form pagkatapos maipadala.
            })
            .catch(error => {
                console.error('Error:', error);
                // BINAGO: Pinalitan ang alert ng SweetAlert para sa error.
                Swal.fire({
                    title: 'Oops!',
                    text: 'Nagkaroon ng problema. Pakisubukang muli. 😟',
                    icon: 'error',
                    confirmButtonText: 'Okay',
                    confirmButtonColor: '#06b6d4'
                });
            })
            .finally(() => {
                // Ibalik sa dati ang button, kahit success man o may error.
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            });
        });
    }
});
function openForm(formId) {
    // Hide all forms
    const forms = document.querySelectorAll('.form-container');
    forms.forEach(form => {
        form.classList.remove('form-active');
    });
    
    // Show the selected form
    document.getElementById(formId).classList.add('form-active');
}

function closeForm(formId) {
    document.getElementById(formId).classList.remove('form-active');
    return false; // Prevent default anchor behavior
}
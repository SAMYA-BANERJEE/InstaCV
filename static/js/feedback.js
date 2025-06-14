document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    let isValid = true;
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');
    
    // Simple validation
    if (name.value.trim() === '') {
        name.classList.add('invalid');
        isValid = false;
    } else {
        name.classList.remove('invalid');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        email.classList.add('invalid');
        isValid = false;
    } else {
        email.classList.remove('invalid');
    }
    
    if (subject.value.trim() === '') {
        subject.classList.add('invalid');
        isValid = false;
    } else {
        subject.classList.remove('invalid');
    }
    
    if (message.value.trim() === '') {
        message.classList.add('invalid');
        isValid = false;
    } else {
        message.classList.remove('invalid');
    }
    
    if (!isValid) {
        e.preventDefault(); // Prevent form submission if validation fails
    }
});

// Auto-hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            message.style.transition = 'opacity 0.5s, transform 0.5s';
            
            setTimeout(() => {
                message.remove();
            }, 500);
        }, 5000);
    });
    
    // Add subtle animation to form elements on page load
    const formElements = document.querySelectorAll('.form-group, .feedback-header, .submit-btn');
    
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
});
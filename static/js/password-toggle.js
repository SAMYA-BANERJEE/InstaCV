document.addEventListener("DOMContentLoaded", () => {
  // Get the password input and checkbox elements
  const passwordInput = document.getElementById("password")
  const showPasswordCheckbox = document.getElementById("remember")

  // Add event listener to the checkbox
  if (showPasswordCheckbox && passwordInput) {
    showPasswordCheckbox.addEventListener("change", function () {
      // Toggle between password and text type
      passwordInput.type = this.checked ? "text" : "password"
    })
  }
})


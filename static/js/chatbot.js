const chatBody = document.querySelector(".chat-body")
const messageInput = document.querySelector(".message-input")
const sendMessage = document.querySelector("#send-message")
const fileInput = document.querySelector("#file-input")
const fileUploadWrapper = document.querySelector(".file-upload-wrapper")
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel")
const chatbotToggler = document.querySelector("#chatbot-toggler")
const closeChatbot = document.querySelector("#close-chatbot")
const emojiPickerBtn = document.querySelector("#emoji-picker")

// API setup
const API_KEY = "AIzaSyAnttDfJrZZDHRyULNRgrprPIkWxE3ViN8"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
}

// Store chat history
const chatHistory = []

// System instructions for the chatbot
const systemPrompt = `You are a helpful resume assistant for the Resume Builder Web Application called InstaCV. Provide accurate, helpful information about using the application, building resumes, and career tips.

PROJECT OVERVIEW:
InstaCV is a Resume Builder Web Application built using Python Flask. It enables users to sign up (via email or Google), fill in resume information, choose from multiple professional templates, and download resumes as PDFs. Users can also view resume previews, save templates, and manage their profile.

FEATURES:
1. User Authentication (Register/Login/Logout)
2. Google Sign-In using OAuth 2.0
3. Resume Information Input Form (Personal, Education, Experience, Skills, Projects, Objective, References)
4. Upload Profile Picture
5. Multiple Resume Templates with Previews and Categories
6. Save and Manage Favorite Templates
7. Download Resume as PDF
8. View Resume History and Profile
9. Feedback Form with Rating System
10. Privacy Policy and Terms of Use Pages

RESUME TEMPLATES:
InstaCV offers 20+ resume templates categorized as:
- Professional Templates (e.g., Professional Dark, Two Column, Blue Gradient, Elegant Sidebar, Modern Two-Column, etc.)
- Creative Templates (e.g., Modern Sidebar, Hexagon Pattern, Orange Accents, Creative Geometric, etc.)
- Minimal Templates (e.g., Blue Header, Clean Borders, Simple Gray, Minimal Dots, Minimalist Elegant, etc.)

Each template can be previewed, selected, and saved to the user's account.

RESUME WRITING TIPS:
1. Keep it concise (1-2 pages)
2. Tailor each resume to the specific job
3. Use active verbs and quantify achievements
4. Match the job description keywords
5. Carefully proofread before submission
6. Choose a clean, modern design
7. Emphasize achievements over responsibilities

IMPORTANT:
- If a user uploads an image, acknowledge it: "I can see the image you've uploaded" and comment on what is visible.
- Always guide users clearly on where to go in the app based on their questions.

NOTES:
- Google sign-in creates an account if none exists, using a random secure password in the backend.
- Saved templates prevent duplicates using a unique constraint.
- Users can preview, select, save, and remove templates from their dashboard.`


// const systemPrompt = `You are a helpful resume assistant for the Resume Builder Web Application. Provide accurate, helpful information about the application, resume building, and career advice.

// PROJECT OVERVIEW:
// This is a Resume Builder Web Application built using Python Flask. It allows users to register and log in, fill in their resume details, select from multiple modern templates, and download a professional resume in PDF format.

// FEATURES:
// 1. User Authentication (Register/Login/Logout)
// 2. Resume Information Input Form
// 3. Multiple Resume Templates with Previews
// 4. Download Resume as PDF
// 5. Profile Management (Profile Picture Upload)
// 6. Resume History View
// 7. Privacy & Terms Section

// RESUME TEMPLATES:
// The website offers 7 different resume templates:
// - Professional Dark: Clean template with dark header
// - Modern Sidebar: Template with colored sidebar and timeline
// - Blue Header: Clean template with blue section headers
// - Two Column: Modern layout with dark sidebar and skill bars
// - Blue Gradient: Template with blue gradient headers
// - Hexagon Pattern: Clean template with hexagonal profile photo
// - Orange Accents: Minimalist template with orange accent icons

// RESUME WRITING TIPS:
// 1. Keep your resume concise (1-2 pages)
// 2. Tailor your resume for each job application
// 3. Use action verbs and quantify achievements
// 4. Include keywords from the job description
// 5. Proofread carefully for errors
// 6. Use a clean, professional design
// 7. Focus on achievements rather than just responsibilities

// IMPORTANT: If the user uploads an image, always acknowledge that you can see it. For example, say "I can see the image you've uploaded" and then comment on what you observe in it.`

const initialInputHeight = messageInput.scrollHeight

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div")
  div.classList.add("message", ...classes)
  div.innerHTML = content
  return div
}

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text")

  try {
    // Prepare the messages for the API
    const messages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "I understand. I'll act as a helpful resume assistant with knowledge about the Resume Builder Web Application and provide resume advice. I'll also acknowledge when users upload images.",
          },
        ],
      },
    ]

    // Add previous messages from chat history
    chatHistory.forEach((msg) => {
      messages.push(msg)
    })

    // Create the current user message parts
    const userMessageParts = [{ text: userData.message }]

    // Add image data if present
    if (userData.file.data && userData.file.mime_type) {
      userMessageParts.push({
        inline_data: {
          mime_type: userData.file.mime_type,
          data: userData.file.data,
        },
      })
    }

    // Add the current user message with possible image
    messages.push({
      role: "user",
      parts: userMessageParts,
    })

    // API request options
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    }

    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed")
    }

    // Extract and display bot's response text
    const apiResponseText = data.candidates[0].content.parts[0].text.trim()
    messageElement.innerText = apiResponseText

    // Add user message and bot response to chat history
    chatHistory.push({
      role: "user",
      parts: userMessageParts,
    })

    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    })
  } catch (error) {
    console.error("Error generating response:", error)
    messageElement.innerText = "I'm having trouble connecting right now. Please try again in a moment."
    messageElement.style.color = "#ff0000"
  } finally {
    // Reset user's file data, removing thinking indicator and scroll chat to bottom
    userData.file = {
      data: null,
      mime_type: null,
    }
    incomingMessageDiv.classList.remove("thinking")
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" })
  }
}

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault()
  userData.message = messageInput.value.trim()
  if (!userData.message && !userData.file.data) return // Don't send empty messages without files

  // If no text but has file, add a default message
  if (!userData.message && userData.file.data) {
    userData.message = "Here's an image."
  }

  messageInput.value = ""
  messageInput.dispatchEvent(new Event("input"))

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`
  const outgoingMessageDiv = createMessageElement(messageContent, "user-message")
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message
  chatBody.appendChild(outgoingMessageDiv)
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" })

  // Keep a copy of the file data before clearing the UI
  const fileData = userData.file.data ? { ...userData.file } : null

  // Clear the file upload UI
  fileUploadWrapper.classList.remove("file-uploaded")
  fileUploadWrapper.querySelector("img").src = "#"

  // Restore the file data for the API call
  if (fileData) {
    userData.file = fileData
  }

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/></svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking")
    chatBody.appendChild(incomingMessageDiv)
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" })
    generateBotResponse(incomingMessageDiv)
  }, 600)
}

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`
  messageInput.style.height = `${messageInput.scrollHeight}px`
  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px"
})

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim()
  if (e.key === "Enter" && !e.shiftKey && (userMessage || userData.file.data) && window.innerWidth > 768) {
    handleOutgoingMessage(e)
  }
})

// Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    fileInput.value = ""
    fileUploadWrapper.querySelector("img").src = e.target.result
    fileUploadWrapper.classList.add("file-uploaded")
    const base64String = e.target.result.split(",")[1]
    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    }
  }
  reader.readAsDataURL(file)
})

// Cancel file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {
    data: null,
    mime_type: null,
  }
  fileUploadWrapper.classList.remove("file-uploaded")
  fileUploadWrapper.querySelector("img").src = "#"
})

// Add event listeners
sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e))
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click())
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"))
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"))

// Initialize with a welcome message - ONLY ONCE
// Check if there's already a message in the chat body
if (chatBody.children.length === 0) {
  const welcomeMessage = createMessageElement(
    `
    <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
      <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/>
    </svg>
    <div class="message-text">Hello! I'm your resume assistant. How can I help you today?</div>
  `,
    "bot-message",
  )

  chatBody.appendChild(welcomeMessage)

  // Add initial message to chat history
  chatHistory.push({
    role: "model",
    parts: [{ text: "Hello! I'm your resume assistant. How can I help you today?" }],
  })
}


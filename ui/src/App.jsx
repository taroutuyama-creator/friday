import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setMessage('')

    // TODO: Send to API and get response
    // For now, just echo back
    setMessages(prev => [...prev, { role: 'assistant', content: 'Friday is not yet connected to Claude API.' }])
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Friday</h1>
        <p>Claude Chat Service</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome">
              <h2>Welcome to Friday</h2>
              <p>Start a conversation with Claude.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
        </div>

        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  )
}

export default App

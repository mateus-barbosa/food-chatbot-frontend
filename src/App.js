import { useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { ThemeContext } from './ThemeContext';

function App() {

  const { theme, toggleTheme } = useContext(ThemeContext);
  const [messages, setMessages] = useState([])
  const [userMessage, setUserMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);

  const rasaServerUrl = "http://localhost:5005/webhooks/rest/webhook"

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const addMessage = (message, sender) => {
    const messageStyle = {
      color: sender === "user" ? theme.userMessage : theme.botMessage,
    }
    
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: message, sender: sender, messageStyle },
    ])
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
  
    addMessage(userMessage, "user");
    setUserMessage("");

    setIsTyping(true)
  
    try {
      const response = await fetch(rasaServerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
    
      const botResponses = await response.json();
      console.log("Resposta do Rasa:", botResponses); // Log para verificar a resposta
      setIsTyping(false);
    
      if (!botResponses || botResponses.length === 0) {
        // Se não houver resposta do Rasa
        addMessage("Desculpe, não compreendi sua pergunta.", "bot");
      } else {
        let foundValidResponse = false;
        for (const response of botResponses) {
          if (response.text) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            addMessage(response.text, "bot");
            foundValidResponse = true;
          }
        }
        if (!foundValidResponse) {
          // Caso nenhum item tenha a propriedade 'text'
          addMessage("Desculpe, não compreendi sua pergunta.", "bot");
        }
      }
    } catch (error) {
      console.error("Erro ao se comunicar com o servidor Rasa:", error);
      addMessage("Ocorreu um erro. Tente novamente mais tarde.", "bot");
      setIsTyping(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: theme.background,
      color: theme.text,
    },
    input: {
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    button: {
      backgroundColor: theme.buttonBackground,
      color: theme.text,
    },
  };

  const typingDotStyle = {
    backgroundColor: theme.text,
  };
  
  return (
    <div className="chat-container" style={styles.container}>
      <button className="theme-toggle" onClick={toggleTheme}>
        Alternar Tema
      </button>
      <div className="chat-box" ref={chatBoxRef} style={styles.input}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
            style={msg.style}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dot" style={typingDotStyle}></div>
            <div className="typing-dot" style={typingDotStyle}></div>
            <div className="typing-dot" style={typingDotStyle}></div>
          </div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          style={styles.input}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button 
            onClick={sendMessage} 
            style={styles.button}>Enviar</button>
      </div>
    </div>
  );
}

export default App;

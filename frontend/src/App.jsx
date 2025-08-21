import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, BookOpen, MapPin, DollarSign, Award, GraduationCap, Home, Trophy, AlertCircle } from 'lucide-react';

const CollegeFinderApp = () => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [userProfile, setUserProfile] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [apiKey] = useState('AIzaSyCUaX3kb2q_NMLT9fjC5NkgcKlzYPPf1ts');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questions = [
    {
      id: 'welcome',
      text: "Hello! I'm your AI College Counselor powered by Google Gemini. I'll help you find the perfect college based on your preferences and real-time data. Let's start with your academic background. What stream did you choose for your 12th grade?",
      type: 'select',
      options: ['Science (PCM - Physics, Chemistry, Math)', 'Science (PCB - Physics, Chemistry, Biology)', 'Commerce', 'Arts/Humanities', 'Vocational/Technical', 'Other']
    },
    {
      id: 'extracurricular',
      text: "Do you have any special talents or achievements in extracurricular activities? This will help me find colleges that excel in both academics and your areas of interest.",
      type: 'select',
      options: ['Sports (Cricket, Football, Basketball, etc.)', 'Arts & Creative (Painting, Dance, Drama)', 'Music (Vocal, Instrumental)', 'Technology/Coding/Robotics', 'Leadership/Student Government', 'Social Work/Community Service', 'Debate/Public Speaking', 'Writing/Journalism', 'None of the above']
    },
    {
      id: 'course',
      text: "What type of course are you interested in pursuing for your higher education?",
      type: 'select',
      options: ['Engineering (B.Tech/B.E)', 'Medical (MBBS/BDS/BAMS)', 'Business/Management (BBA/MBA)', 'Arts & Design (BFA/B.Design)', 'Computer Science/IT (BCA/B.Sc CS)', 'Law (LLB/BA LLB)', 'Commerce (B.Com/CA/CS)', 'Pure Sciences (B.Sc Physics/Chemistry/Biology)', 'Architecture', 'Journalism/Media', 'Other']
    },
    {
      id: 'budget',
      text: "What's your total budget for the entire course duration including tuition fees, books, and other academic expenses (in INR)?",
      type: 'select',
      options: ['Under ₹2 Lakhs (Government/Low-cost colleges)', '₹2-5 Lakhs (Affordable private colleges)', '₹5-10 Lakhs (Mid-range private colleges)', '₹10-20 Lakhs (Premium colleges)', '₹20-50 Lakhs (Top-tier private colleges)', 'Above ₹50 Lakhs (International standard)', 'Budget is flexible']
    },
    {
      id: 'hostel',
      text: "Do you need hostel/accommodation facilities at the college?",
      type: 'select',
      options: ['Yes, hostel is mandatory', 'Yes, but can consider nearby PG/rentals', 'No, I will stay at home/with relatives', 'Flexible - depends on the college']
    },
    {
      id: 'distance',
      text: "How far are you willing to travel from your home location for your studies?",
      type: 'select',
      options: ['Within my city (local colleges only)', 'Within my state', 'Anywhere in North India', 'Anywhere in South India', 'Anywhere in India', 'Open to international options']
    },
    {
      id: 'location',
      text: "Please provide your current city and state. This will help me find colleges with the best proximity and connectivity.",
      type: 'text',
      placeholder: 'e.g., Mumbai, Maharashtra or Chennai, Tamil Nadu'
    },
    {
      id: 'priorities',
      text: "What are your top priorities when choosing a college? (This will help me weight the recommendations)",
      type: 'select',
      options: ['Academic reputation and rankings', 'Placement opportunities and packages', 'Campus facilities and infrastructure', 'Faculty quality and research opportunities', 'Extracurricular activities and sports', 'Location and connectivity', 'Affordable fees structure', 'Industry connections and internships']
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ send first question when chat starts
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(questions[0].text, questions[0]);
    }
  }, []);

  const addBotMessage = (text, questionData = null, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'bot',
        questionData,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };

  // ✅ main fix → progress through questions
  const handleAnswer = (answer) => {
    addUserMessage(answer);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      addBotMessage(questions[nextIndex].text, questions[nextIndex]);
    } else {
      // last question → call recommendations
      generateCollegeRecommendations();
    }
  };

  const generateGeminiPrompt = () => {
    const { welcome, extracurricular, course, budget, hostel, distance, location, priorities } = userProfile;
    
    return `You are an expert college counselor for Indian students. Based on the following student profile, provide detailed college recommendations:

Student Profile:
- Academic Stream (12th grade): ${welcome}
- Extracurricular Activities/Interests: ${extracurricular}
- Desired Course: ${course}
- Budget Range: ${budget}
- Hostel Requirement: ${hostel}
- Distance Preference: ${distance}
- Current Location: ${location}
- Top Priority: ${priorities}

Please provide:
1. Top 5-7 college recommendations that match this profile
2. For each college, include:
   - Full college name and location
   - Why it matches their profile (academic + extracurricular fit)
   - Approximate total course fees
   - Hostel availability and costs (if needed)
   - Placement statistics and average packages
   - Special programs or facilities related to their extracurricular interests
   - Admission requirements and entrance exams
   - Notable alumni or achievement
   - Student reviews or ratings (if available)

3. Additional considerations:
   - Backup options if budget is tight
   - Scholarship opportunities available
   - Best time to apply and important deadlines
   - Tips for strengthening their application

Format the response in a clear, organized manner with proper headings and bullet points. Be specific about fees, placement data, and practical details that help in decision making.

Focus especially on colleges that excel in both academics and the student's extracurricular area of interest (${extracurricular}), as this combination is important for holistic development.`;
  };

  const callGeminiAPI = async (prompt) => {
    try {
      console.log('Making API call to Gemini...');
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log('Request body:', requestBody);
      

      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Gemini API Error Details:', error);
      throw error;
    }
  };

  const testGeminiConnection = async () => {
    try {
      console.log('Testing Gemini API connection...');
      const testPrompt = "Hello, please respond with 'API connection successful'";
      const response = await callGeminiAPI(testPrompt);
      console.log('Test response:', response);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const generateCollegeRecommendations = async () => {
    setIsLoadingRecommendations(true);
    
    try {
      // First test the connection
      const isConnected = await testGeminiConnection();
      if (!isConnected) {
        throw new Error('Connection test failed');
      }

      const prompt = generateGeminiPrompt();
      console.log('Generated prompt:', prompt);
      
      const recommendations = await callGeminiAPI(prompt);
      
      const responseText = `🎓 **AI-Powered College Recommendations**\n\nBased on your detailed profile, here are my personalized recommendations:\n\n${recommendations}\n\n---\n\n💡 **Next Steps:**\n• Research these colleges further on their official websites\n• Check current admission notifications and deadlines\n• Prepare for required entrance exams\n• Consider visiting campuses if possible\n\n🔄 Would you like me to provide more specific information about any of these colleges or help you with application strategies? Just ask me any follow-up questions!`;
      
      addBotMessage(responseText, null, 0);
    } catch (error) {
      console.error('Full error details:', error);
      
      let errorMessage = `I apologize, but I encountered an issue while fetching your college recommendations.\n\n`;
      
      if (error.message.includes('403')) {
        errorMessage += `🔑 **API Key Issue**: The API key might not have proper permissions or might be restricted.\n\n`;
      } else if (error.message.includes('429')) {
        errorMessage += `⏱️ **Rate Limit**: Too many requests. Please wait a moment and try again.\n\n`;
      } else if (error.message.includes('400')) {
        errorMessage += `📝 **Request Issue**: There might be an issue with the request format.\n\n`;
      } else {
        errorMessage += `🌐 **Connection Issue**: Please check your internet connection.\n\n`;
      }
      
      errorMessage += `**Error Details**: ${error.message}\n\n`;
      errorMessage += `Don't worry! Let me provide you with some general guidance based on your profile:\n\n`;
      errorMessage += `📚 **Based on your selections:**\n`;
      errorMessage += `• Stream: ${userProfile.welcome || 'Not specified'}\n`;
      errorMessage += `• Course: ${userProfile.course || 'Not specified'}\n`;
      errorMessage += `• Extracurricular: ${userProfile.extracurricular || 'Not specified'}\n`;
      errorMessage += `• Budget: ${userProfile.budget || 'Not specified'}\n`;
      errorMessage += `• Location: ${userProfile.location || 'Not specified'}\n\n`;
      errorMessage += `I recommend researching colleges that match these criteria. Would you like me to try generating recommendations again?`;
      
      addBotMessage(errorMessage, null, 0);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleApiKeySubmit = () => {
    // API key is now hardcoded and secure
    setTimeout(() => {
      addBotMessage(questions[0].text, questions[0]);
    }, 500);
  };

  const handleOptionSelect = (option) => {
    addUserMessage(option);
    
    const currentQ = questions[currentQuestion];
    setUserProfile(prev => ({
      ...prev,
      [currentQ.id]: option
    }));

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        addBotMessage(questions[nextQuestion].text, questions[nextQuestion]);
      }, 1000);
    } else {
      // All questions answered, generate AI recommendations
      setTimeout(() => {
        generateCollegeRecommendations();
      }, 1000);
    }
  };

  const handleTextSubmit = () => {
    if (!currentInput.trim()) return;
    
    addUserMessage(currentInput);
    
    const currentQ = questions[currentQuestion];
    setUserProfile(prev => ({
      ...prev,
      [currentQ.id]: currentInput
    }));

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        addBotMessage(questions[nextQuestion].text, questions[nextQuestion]);
      }, 1000);
    } else {
      setTimeout(() => {
        generateCollegeRecommendations();
      }, 1000);
    }

    setCurrentInput('');
  };

  const formatMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      // Handle headers with **text**
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} className="font-bold text-blue-600 mt-3 mb-1">{line.slice(2, -2)}</div>;
      }
      // Handle inline bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={i} className="mb-1">
            {parts.map((part, j) => 
              j % 2 === 1 ? <span key={j} className="font-bold text-blue-600">{part}</span> : part
            )}
          </div>
        );
      }
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <div key={i} className="ml-4 mb-1">{line}</div>;
      }
      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return <div key={i} className="font-medium text-gray-800 mt-2 mb-1">{line}</div>;
      }
      return <div key={i} className={line.trim() ? "mb-1" : "mb-2"}>{line || <br />}</div>;
    });
  };

  // Remove the API key input component since it's now integrated
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-full p-2">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">AI College Counselor</h1>
                <p className="text-sm text-gray-600">Powered by Google Gemini AI</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([]);
                setCurrentQuestion(0);
                setUserProfile({});
                window.location.reload();
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Restart Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-2xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`rounded-lg p-4 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="text-sm whitespace-pre-line">
                      {formatMessageText(message.text)}
                    </div>
                    
                    {/* Options for bot messages */}
                    {message.sender === 'bot' && message.questionData && message.questionData.type === 'select' && (
                      <div className="mt-4 space-y-2">
                        {message.questionData.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            className="block w-full text-left px-3 py-2 bg-white text-gray-700 rounded border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {(isTyping || isLoadingRecommendations) && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      {isLoadingRecommendations && (
                        <span className="text-xs text-gray-500 ml-2">Analyzing with AI...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {currentQuestion < questions.length && questions[currentQuestion].type === 'text' && !isLoadingRecommendations && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                  placeholder={questions[currentQuestion].placeholder || "Type your answer..."}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleTextSubmit}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-800">AI-Powered</h3>
            <p className="text-sm text-gray-600">Real-time recommendations via Gemini</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Trophy className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Extracurricular Match</h3>
            <p className="text-sm text-gray-600">Colleges excelling in your interests</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Home className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Hostel Planning</h3>
            <p className="text-sm text-gray-600">Accommodation preferences included</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <DollarSign className="w-8 h-8 text-yellow-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Budget Analysis</h3>
            <p className="text-sm text-gray-600">Complete course cost breakdown</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <MapPin className="w-8 h-8 text-red-600 mb-2" />
            <h3 className="font-semibold text-gray-800">Location Smart</h3>
            <p className="text-sm text-gray-600">Distance-based filtering</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeFinderApp;
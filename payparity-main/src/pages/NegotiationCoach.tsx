import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, RefreshCw, CheckCircle, Sparkles, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navigation from "@/components/Navigation";
import axios from "axios";
import { BACKEND_URL } from "@/config";

const NegotiationCoach = () => {
  const location = useLocation();
  const profileData = location.state?.profileData;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [mode, setMode] = useState<'coach' | 'mock_interviewer'>('coach');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your AI salary negotiation coach. I can help you with negotiation strategies, practice mock interviews, or answer any questions about salary discussions. How can I help you today?",
    },
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [profile, setProfile] = useState({
    title: profileData?.job_title || '',
    location: profileData?.location || '',
    years_experience: profileData?.experience || '',
    current_comp: profileData?.current_salary || '',
    target_comp: profileData?.predicted_salary || '',
    currency: 'INR',
  });

  const negotiationTips = [
    "Research market rates beforehand",
    "Focus on value you bring to the company",
    "Practice your key points out loud",
    "Be prepared to negotiate non-salary benefits",
    "Stay professional and confident",
  ];

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // italics
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);
    setUserMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        messages: newMessages,
        mode: mode,
        profile: {
          title: profile.title || undefined,
          location: profile.location || undefined,
          years_experience: profile.years_experience ? Number(profile.years_experience) : undefined,
          current_comp: profile.current_comp ? Number(profile.current_comp) : undefined,
          target_comp: profile.target_comp ? Number(profile.target_comp) : undefined,
          currency: profile.currency || undefined,
        },
      });

      const cleaned = cleanMarkdown(response.data.message);
      const aiMessage = { role: 'assistant' as const, content: cleaned };
      setChatMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    const welcomeMessage =
      mode === 'coach'
        ? "Hello! I'm your AI salary negotiation coach. I can help you with negotiation strategies, practice mock interviews, or answer any questions about salary discussions. How can I help you today?"
        : "Hello! I'm your mock interviewer. I'll simulate a real negotiation conversation to help you practice. Let's begin - tell me a bit about the role you're discussing, and I'll play the hiring manager.";

    setChatMessages([{ role: 'assistant', content: welcomeMessage }]);
  };

  // Scroll to bottom automatically when new message added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Reset when mode changes
  useEffect(() => {
    handleReset();
  }, [mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Navigation />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">AI Negotiation Coach</h1>
            <p className="text-lg text-gray-600">
              Get personalized guidance, practice negotiations, and boost your confidence
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Mode Selection */}
              <Card className="glass-card animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={mode}
                    onValueChange={(value) => setMode(value as 'coach' | 'mock_interviewer')}
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value="coach" id="coach" />
                      <Label htmlFor="coach" className="cursor-pointer font-normal">
                        <div>
                          <div className="font-semibold">Coach Mode</div>
                          <div className="text-xs text-gray-500">Get advice and strategies</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mock_interviewer" id="mock" />
                      <Label htmlFor="mock" className="cursor-pointer font-normal">
                        <div>
                          <div className="font-semibold">Mock Interviewer</div>
                          <div className="text-xs text-gray-500">Practice realistic negotiations</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <Card className="glass-card animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      ['title', 'Title', 'e.g., Senior Data Scientist'],
                      ['location', 'Location', 'e.g., Bangalore, India'],
                      ['years_experience', 'Years Experience', 'e.g., 5'],
                      ['current_comp', 'Current Comp', 'e.g., 1500000'],
                      ['target_comp', 'Target Comp', 'e.g., 1800000'],
                      ['currency', 'Currency', 'e.g., INR'],
                    ].map(([key, label, placeholder]) => (
                      <div key={key}>
                        <Label htmlFor={key} className="text-sm">
                          {label}
                        </Label>
                        <Input
                          id={key}
                          placeholder={placeholder}
                          type={key.includes('comp') || key.includes('years') ? 'number' : 'text'}
                          value={(profile as any)[key]}
                          onChange={(e) =>
                            setProfile({ ...profile, [key]: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Profile is optional but improves guidance</p>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="glass-card animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Negotiation Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {negotiationTips.map((tip, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="glass-card animate-slide-up h-[500px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Chat with AI Coach
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                  {/* Chat Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
                  >
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-teal-500 text-white'
                              : 'bg-white/70 text-gray-800'
                          }`}
                        >
                          <p
                            className="text-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/70 p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Type your message or start the mock negotiation..."
                      className="flex-1 resize-none"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim() || isTyping}
                      className="self-end bg-gradient-to-r from-purple-600 to-teal-500"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Scripts */}
          <Card className="mt-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle>Quick Negotiation Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Opening Statement</h4>
                  <p className="text-sm text-gray-700">
                    "Based on my research and contributions this year, I'd like to discuss adjusting my
                    compensation to reflect my current market value."
                  </p>
                </div>
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Value Proposition</h4>
                  <p className="text-sm text-gray-700">
                    "I've consistently exceeded my goals and taken on additional responsibilities that have
                    directly contributed to our team's success."
                  </p>
                </div>
                <div className="p-4 bg-white/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Market Research</h4>
                  <p className="text-sm text-gray-700">
                    "According to industry data, professionals with my experience and skill set typically earn
                    between X and Y in this market."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NegotiationCoach;

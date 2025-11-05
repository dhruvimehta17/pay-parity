import { useState } from "react";
import { Upload, TrendingUp, Users, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import Navigation from "@/components/Navigation";

const Index = () => {
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "Smart Profile Analysis",
      description: "Upload your CV or LinkedIn profile and our AI instantly analyzes your skills, experience, and market position."
    },
    {
      icon: TrendingUp,
      title: "Personalized Benchmarks",
      description: "Get salary data tailored to your exact role, skills, experience level, and location."
    },
    {
      icon: Users,
      title: "Anonymous Comparisons",
      description: "Compare your salary with other women in your field while maintaining complete privacy."
    },
    {
      icon: MessageSquare,
      title: "AI Negotiation Coach",
      description: "Practice salary negotiations with our AI coach and get personalized scripts for real scenarios."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-r from-purple-100 to-teal-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">PayParity</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Empower your career with AI-driven salary insights. Know your worth, negotiate with confidence, and close the pay gap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-payparity-gradient hover:opacity-90 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Your CV
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => navigate('/negotiation-coach')}
              className="bg-gradient-to-r from-teal-500 to-purple-600 hover:opacity-90 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              AI Negotiation Coach
              <Sparkles className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">Free analysis • Completely confidential</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 glass-card">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-payparity-gradient rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {showUpload && <FileUpload onClose={() => setShowUpload(false)} />}
    </div>
  );
};

export default Index;

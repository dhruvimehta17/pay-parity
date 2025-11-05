
import { useState } from "react";
import { TrendingUp, MapPin, Briefcase, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

const SalaryBenchmark = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const profileData = {
    name: "Priya Sharma",
    role: "Senior Software Engineer",
    experience: "5 years",
    location: "Bangalore, Karnataka",
    skills: ["React", "TypeScript", "Node.js", "AWS", "Python"],
    currentSalary: 1450000,
    marketRange: {
      min: 1400000,
      median: 1650000,
      max: 1900000
    }
  };

  const salaryData = [
    { percentile: "25th", amount: 1400000, difference: -50000 },
    { percentile: "50th (Median)", amount: 1650000, difference: 200000 },
    { percentile: "75th", amount: 1800000, difference: 350000 },
    { percentile: "90th", amount: 1900000, difference: 450000 }
  ];

  const formatSalary = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Navigation />
      
      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">Your Salary Benchmark</h1>
            <p className="text-lg text-gray-600">Personalized insights based on your profile analysis</p>
          </div>

          {/* Profile Summary */}
          <Card className="mb-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold">{profileData.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold">{profileData.experience}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold flex items-center">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profileData.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Skills</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profileData.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Benchmark Card */}
          <Card className="mb-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatSalary(profileData.marketRange.median)}
                </div>
                <p className="text-gray-600">Market Median for Your Profile</p>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">
                    Range: {formatSalary(profileData.marketRange.min)} - {formatSalary(profileData.marketRange.max)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {salaryData.map((data, index) => (
                  <div key={index} className="text-center p-4 bg-white/50 rounded-lg">
                    <div className="text-lg font-bold">{formatSalary(data.amount)}</div>
                    <div className="text-sm text-gray-600">{data.percentile}</div>
                    <div className={`text-sm font-semibold ${
                      data.difference > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.difference > 0 ? '+' : ''}{formatSalary(Math.abs(data.difference))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Strong Position</h4>
                    <p className="text-sm text-green-700">Your skills in React and AWS are highly valued in the Indian tech market.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Growth Opportunity</h4>
                    <p className="text-sm text-blue-700">You could potentially earn 12-27% more based on market data.</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Location Advantage</h4>
                    <p className="text-sm text-purple-700">Bangalore offers premium salaries for your skill set in India.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card animate-slide-up">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate('/salary-comparison')}
                    className="w-full justify-between" 
                    variant="outline"
                  >
                    Compare with peers
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/negotiation-coach')}
                    className="w-full justify-between bg-payparity-gradient text-white hover:opacity-90"
                  >
                    Practice negotiation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                    <strong>Pro Tip:</strong> The best time to negotiate is during performance reviews or when you've delivered significant value to your team.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryBenchmark;

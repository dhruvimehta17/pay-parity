
import { useState } from "react";
import { Users, Filter, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";

const SalaryComparison = () => {
  const navigate = useNavigate();
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const comparisonData = [
    {
      id: 1,
      role: "Senior Software Engineer",
      experience: "4-6 years",
      location: "Bangalore",
      salary: 1650000,
      skills: ["React", "Node.js", "AWS"],
      company: "Tech Startup",
      anonymous: true
    },
    {
      id: 2,
      role: "Senior Software Engineer",
      experience: "5-7 years",
      location: "Hyderabad",
      salary: 1800000,
      skills: ["Python", "Django", "GCP"],
      company: "Fortune 500",
      anonymous: true
    },
    {
      id: 3,
      role: "Software Engineer III",
      experience: "4-5 years",
      location: "Pune",
      salary: 1550000,
      skills: ["React", "TypeScript", "AWS"],
      company: "Mid-size Tech",
      anonymous: true
    },
    {
      id: 4,
      role: "Senior Developer",
      experience: "6-8 years",
      location: "Mumbai",
      salary: 1900000,
      skills: ["Java", "Spring", "Kubernetes"],
      company: "Enterprise",
      anonymous: true
    }
  ];

  const stats = {
    totalProfiles: 1247,
    averageSalary: 1675000,
    medianSalary: 1650000,
    payGap: 8.2
  };

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
            <h1 className="text-4xl font-bold mb-4">Anonymous Salary Comparison</h1>
            <p className="text-lg text-gray-600">Compare your compensation with other women in tech across India</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card animate-slide-up">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalProfiles.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Profiles</div>
              </CardContent>
            </Card>
            <Card className="glass-card animate-slide-up">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{formatSalary(stats.averageSalary)}</div>
                <div className="text-sm text-gray-600">Average Salary</div>
              </CardContent>
            </Card>
            <Card className="glass-card animate-slide-up">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{formatSalary(stats.medianSalary)}</div>
                <div className="text-sm text-gray-600">Median Salary</div>
              </CardContent>
            </Card>
            <Card className="glass-card animate-slide-up">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.payGap}%</div>
                <div className="text-sm text-gray-600">Pay Gap</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filter Comparisons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="junior">0-2 years</SelectItem>
                      <SelectItem value="mid">3-5 years</SelectItem>
                      <SelectItem value="senior">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi NCR</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          <Card className="mb-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Similar Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map((profile) => (
                  <div key={profile.id} className="p-4 bg-white/50 rounded-lg border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{profile.role}</h4>
                        <p className="text-sm text-gray-600">{profile.experience} • {profile.location}</p>
                        <p className="text-sm text-gray-500">{profile.company}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatSalary(profile.salary)}
                        </div>
                        <div className="text-sm text-gray-500">Annual Salary</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="mb-8 glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Above Average</h4>
                    <p className="text-sm text-green-700">Your current compensation is competitive within your peer group in India.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Growth Potential</h4>
                    <p className="text-sm text-blue-700">Similar profiles earn up to 15% more in certain companies across Indian metros.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Market Trend</h4>
                    <p className="text-sm text-purple-700">Salaries in your field have increased 8% in the last year across India.</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Negotiation Window</h4>
                    <p className="text-sm text-orange-700">73% of women in similar roles successfully negotiated higher pay in Indian companies.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center">
            <Button 
              onClick={() => navigate('/negotiation-coach')}
              size="lg"
              className="bg-payparity-gradient text-white hover:opacity-90 px-8 py-4"
            >
              Get Negotiation Help
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryComparison;

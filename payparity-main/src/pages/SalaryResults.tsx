import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Award,
  Users
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const SalaryResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No results available</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const currentSalary = location.state?.currentSalary || 0;
  const predictedSalary = result.predicted_salary || 0;
  const comparison = result.comparison || {};
  const parsedInfo = result.parsed_info || {};
  const peerComparisons = result.peer_comparisons || [];

  const salaryDifference = predictedSalary - currentSalary;
  const percentageDifference =
    currentSalary > 0
      ? ((salaryDifference / currentSalary) * 100).toFixed(1)
      : 0;

  const formatSalary = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const chartData = [
    { name: "Your Salary", amount: currentSalary, fill: "#8b5cf6" },
    { name: "Market Prediction", amount: predictedSalary, fill: "#14b8a6" }
  ];

  const statusConfig = {
    underpaid: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      title: "You Are Underpaid",
      gradient: "from-red-500 to-orange-500"
    },
    fair: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      title: "Fairly Compensated",
      gradient: "from-green-500 to-teal-500"
    },
    overpaid: {
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      title: "Above Market Rate",
      gradient: "from-blue-500 to-purple-500"
    },
    fresh: {
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      title: "Entry Level Estimate",
      gradient: "from-purple-500 to-pink-500"
    }
  };

  const status = comparison.status || "fresh";
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.fresh;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Navigation />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
              Your Salary Analysis
            </h1>
            <p className="text-lg text-gray-600">
              Based on your skills, experience, and current market scenario
            </p>
          </div>

          {/* Status Banner */}
          <Card className={`mb-8 ${config.bgColor} border-2 ${config.borderColor} animate-slide-up`}>
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 p-4 rounded-full bg-gradient-to-r ${config.gradient}`}>
                  <StatusIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className={`text-3xl font-bold mb-3 ${config.color}`}>{config.title}</h2>
                <p className="text-xl text-gray-700 mb-2">{comparison.message}</p>
                <p className="text-gray-600 max-w-2xl">{comparison.reason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Salary Comparison Chart & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Salary Chart */}
            <Card className="glass-card animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Salary Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatSalary(value)} />
                    <Tooltip formatter={(v: number) => formatSalary(v)} contentStyle={{ borderRadius: "8px" }} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Your Current Salary:</span>
                    <span className="text-xl font-bold text-purple-600">{formatSalary(currentSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Market Prediction:</span>
                    <span className="text-xl font-bold text-teal-600">{formatSalary(predictedSalary)}</span>
                  </div>
                  {currentSalary > 0 && (
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      salaryDifference > 0 ? "bg-green-50" : "bg-red-50"
                    }`}>
                      <span className="font-semibold text-gray-700">Difference:</span>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${
                          salaryDifference > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {salaryDifference > 0 ? "+" : ""}
                          {formatSalary(Math.abs(salaryDifference))}
                        </span>
                        <span className={`ml-2 text-sm ${
                          salaryDifference > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          ({percentageDifference > 0 ? "+" : ""}
                          {percentageDifference}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile */}
            <Card className="glass-card animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Title</p>
                    <p className="text-lg font-semibold">{parsedInfo.Job_Title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Experience</p>
                    <p className="text-lg font-semibold">{parsedInfo.Experience_Years || 0} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Education Level</p>
                    <p className="text-lg font-semibold">{parsedInfo.Education_Level || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="text-lg font-semibold">{parsedInfo.Location || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <Badge className="bg-gradient-to-r from-purple-600 to-teal-500 text-white">
                      {parsedInfo.Category || "—"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Key Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedInfo.Skills_Required
                        ? parsedInfo.Skills_Required.split(",")
                            .slice(0, 8)
                            .map((skill: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {skill.trim()}
                              </Badge>
                            ))
                        : "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Recommendation */}
          {status === "underpaid" && comparison.suggested_salary && (
            <Card className="mb-8 glass-card animate-slide-up border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-600">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Market Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg">
                  <p className="text-lg text-gray-700 mb-4">
                    Based on your skills and experience, the current market scenario suggests you should be earning:
                  </p>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {formatSalary(comparison.suggested_salary)}
                    </p>
                    <p className="text-gray-600 mt-2">
                      That's{" "}
                      <span className="font-bold text-orange-600">
                        {formatSalary(comparison.suggested_salary - currentSalary)}
                      </span>{" "}
                      more than your current salary
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🔹 MOVED HERE: Action Buttons (before Peer Comparisons) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button
              onClick={() =>
                navigate("/negotiation-coach", {
                  state: {
                    profileData: {
                      job_title: parsedInfo.Job_Title,
                      location: parsedInfo.Location,
                      experience: parsedInfo.Experience_Years,
                      current_salary: currentSalary,
                      predicted_salary: predictedSalary
                    }
                  }
                })
              }
              className="bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:opacity-90 px-8 py-6 text-lg"
            >
              Learn Negotiation Tactics
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="px-8 py-6 text-lg">
              Analyze Another Profile
            </Button>
          </div>

          {/* Peer Comparisons */}
          {peerComparisons && peerComparisons.length > 0 && (
            <Card className="mb-8 glass-card animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Compare with Peers
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Professionals with similar job titles from our dataset of 19,000+ salaries
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {peerComparisons.map((peer: any, idx: number) => {
                    const peerSalaryDiff = peer.salary - predictedSalary;
                    const peerPercentDiff = ((peerSalaryDiff / predictedSalary) * 100).toFixed(1);
                    return (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-semibold text-gray-800 mb-1">{peer.job_title}</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>📍 {peer.location}</p>
                              <p>🎓 {peer.education}</p>
                              <p>💼 {peer.experience_years} years exp</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex flex-wrap gap-1">
                              {peer.skills &&
                                peer.skills.split(",").slice(0, 3).map((skill: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {skill.trim()}
                                  </Badge>
                                ))}
                              {peer.skills && peer.skills.split(",").length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{peer.skills.split(",").length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col justify-center">
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                              {formatSalary(peer.salary)}
                            </p>
                            <p
                              className={`text-sm mt-1 ${
                                Math.abs(parseFloat(peerPercentDiff)) < 5
                                  ? "text-green-600"
                                  : peerSalaryDiff > 0
                                  ? "text-blue-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {peerSalaryDiff > 0 ? "+" : ""}
                              {Math.abs(parseFloat(peerPercentDiff))}% vs yours
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    💡 <strong>Insight:</strong> These are real salary records from our dataset for similar roles.
                    Use this data to understand market standards and strengthen your negotiation position.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryResults;

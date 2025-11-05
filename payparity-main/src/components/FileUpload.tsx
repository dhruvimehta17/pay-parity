

import React, { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { X, Upload, Link as LinkIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Helper function to parse salary input
const parseSalaryInput = (salaryInput: string): number => {
  if (!salaryInput) return 0;

  const salaryStr = salaryInput.trim().toLowerCase();
  const salaryClean = salaryStr.replace("₹", "").replace("rs", "").replace("inr", "").trim();

  // Handle "5 lakh", "5lakh", "5 lakhs", "5l", "5lpa"
  const lakhMatch = salaryClean.match(/([\d.]+)\s*l(?:akh|akhs)?(?:\s*p\.?a\.?)?\b|([\d.]+)\s*lpa\b|([\d.]+)\s*l\b/);
  if (lakhMatch) {
    const value = parseFloat(lakhMatch[1] || lakhMatch[2] || lakhMatch[3]);
    return value * 100000;
  }

  // Handle "5 cr", "5crore", "5 crores"
  const croreMatch = salaryClean.match(/([\d.]+)\s*cr(?:ore|ores)?\b|([\d.]+)\s*c\b/);
  if (croreMatch) {
    const value = parseFloat(croreMatch[1] || croreMatch[2]);
    return value * 10000000;
  }

  // Handle numeric formats like "5,00,000" or "500000"
  const numericStr = salaryClean.replace(/,/g, "").replace(/\s/g, "");
  const numericValue = parseFloat(numericStr);

  if (!isNaN(numericValue)) {
    if (numericValue >= 1000) return numericValue;
    if (numericValue > 0) return numericValue * 100000;
  }

  return 0;
};

interface FileUploadProps {
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 🔹 NEW

  // 🔹 Validate nonsense job titles before uploading
  const isInvalidJobTitle = (title: string): boolean => {
    const t = title.trim().toLowerCase();
    const invalidTitles = [
      "hi", "bye", "hello", "aaa", "asdf", "qwerty", "sample",
      "random", "none", "na", "idk", "job", "title", "work",
      "abcd", "xyz", "xyz123", "asdfg", "demo"
    ];
    return (
      !t ||
      t.length < 3 ||
      /\d/.test(t) ||
      invalidTitles.includes(t) ||
      /^[a-z]{2,4}$/.test(t) ||
      /^[a-z]+\d+$/.test(t)
    );
  };

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!file && !linkedinUrl) {
      alert("Please upload a resume or enter your LinkedIn URL.");
      return;
    }
    if (!jobTitle.trim()) {
      alert("Please enter your job title before uploading.");
      return;
    }

    // 🔹 Local frontend validation for nonsense job titles
    if (isInvalidJobTitle(jobTitle)) {
      setErrorMsg(`
        Please enter a valid professional job title 
        (e.g., 'Software Engineer', 'Data Analyst', 'Graphic Designer'). 
        If you feel this is an error, 
        <a href="mailto:life@123.gmail.com?subject=Resume%20Job%20Title%20Validation%20Issue&body=Hi%2C%20I%20feel%20there%20is%20an%20error%20with%20my%20job%20title%20validation.%20Please%20check."
           style="color:#007bff;text-decoration:underline;">click here</a> 
        to contact support.
      `);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("job_title", jobTitle);
      if (linkedinUrl) formData.append("linkedin_url", linkedinUrl);
      if (currentSalary && currentSalary.trim())
        formData.append("current_salary", currentSalary.trim());

      const res = await axios.post(`${BACKEND_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 🔹 If backend returns vague job title error, show on same modal
      if (res.data.status === "error") {
        setErrorMsg(res.data.message);
        setLoading(false);
        return;
      }

      const parsedSalary = parseSalaryInput(currentSalary);
      navigate("/salary-results", {
        state: {
          result: res.data,
          currentSalary: parsedSalary,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error while uploading resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fade-in border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
          Upload Resume 
        </h2>

        {/* 🔹 Error message box */}
        {errorMsg && (
          <div
            className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg text-sm mb-4"
            dangerouslySetInnerHTML={{ __html: errorMsg }}
          />
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your job title (e.g., Web Developer)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none transition"
          />

          <input
            type="text"
            placeholder="Enter salary (e.g., 5 lakh, 5lpa, 5,00,000)"
            value={currentSalary}
            onChange={(e) => setCurrentSalary(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none transition"
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tiff,.gif,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none transition"
          />


          {/* <div className="text-center text-gray-400 font-medium">— or —</div> */}

          {/* <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Paste your LinkedIn profile URL"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none transition"
            />
          </div> */}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-teal-500 text-white py-6 text-lg rounded-xl mt-4 hover:opacity-90 shadow-md hover:shadow-lg transition"
          >
            {loading ? (
              <>
                <Sparkles className="mr-2 w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Resume
                <Upload className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

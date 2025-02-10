import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const analysisData = location.state?.analysisData || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/intensity-history");
        const data = await response.json();
        console.log("Fetched Data:", data);
  
        if (data?.history && Array.isArray(data.history) && data.history.length > 0) {
          const formattedData = data.history.flatMap((entry) => {
            if (Array.isArray(entry.intensity_scores)) {
              return entry.intensity_scores.map((scoreEntry) => ({
                x: new Date(entry.timestamp), // Timestamp as X-axis
                y: scoreEntry.score || 0, // Extract 'score' for Y-axis
                concern: scoreEntry.concern, // Store concern (optional)
              }));
            }
            return []; // Return empty if not an array
          });
  
          setChartData(formattedData);
        } else {
          console.warn("No valid data available from API");
          setChartData([]); // Reset to avoid undefined issues
        }
      } catch (error) {
        console.error("Error fetching intensity data:", error);
      }
    };
  
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!analysisData) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">No Data Available</h2>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  // Ensure safe access to properties
  const {
    concern_categories = {},
    concerns = [],
    intensity_scores = {},
    keywords = [],  // Ensure keywords is always an array
    response_message = "",
    sentiment = ""
  } = analysisData;

  // Chart.js data configuration
  const data = {
    datasets: [
      {
        label: "Intensity Over Time",
        data: chartData, // Already in { x, y } format
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderWidth: 2,
        tension: 0.3, // Smoother curve
        pointRadius: 4, // Highlight data points
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute", // Change to 'second' for more granularity
          tooltipFormat: "yyyy-MM-dd HH:mm:ss",
          displayFormats: {
            minute: "HH:mm:ss",
            hour: "HH:mm"
          }
        },
        title: {
          display: true,
          text: "Time",
          font: { weight: "bold" }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Intensity",
          font: { weight: "bold" }
        }
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Generated Report</h2>

      {/* Line Chart */}
      <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Intensity Over Time</h3>
        <div className="h-96"> {/* Ensures chart has enough height */}
          <Line data={data} options={options} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Concern Categories */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Concern Categories</h3>
          <ul className="text-gray-700">
            {Object.keys(concern_categories).length > 0
              ? Object.entries(concern_categories).map(([concern, category], index) => (
                  <li key={index} className="mt-2">
                    <strong>{concern}:</strong> {category}
                  </li>
                ))
              : <li className="text-gray-500">No data available</li>}
          </ul>
        </div>

        {/* Concerns */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Concerns</h3>
          <ul className="text-gray-700">
            {concerns.length > 0
              ? concerns.map((concern, index) => <li key={index} className="mt-2">{concern}</li>)
              : <li className="text-gray-500">No concerns recorded</li>}
          </ul>
        </div>

        {/* Intensity Scores */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Intensity Scores</h3>
          <ul className="text-gray-700">
            {Object.keys(intensity_scores).length > 0
              ? Object.entries(intensity_scores).map(([concern, score], index) => (
                  <li key={index} className="mt-2">
                    <strong>{concern}:</strong> {score}
                  </li>
                ))
              : <li className="text-gray-500">No data available</li>}
          </ul>
        </div>

        {/* Keywords (Fixed) */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Keywords</h3>
          <p className="text-gray-700">
            {Array.isArray(keywords) && keywords.length > 0 
              ? keywords.join(", ") 
              : "No keywords found"}
          </p>
        </div>

        {/* Sentiment */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Sentiment</h3>
          <p className={`text-gray-700 ${sentiment === "Negative" ? "text-red-600" : "text-green-600"}`}>
            {sentiment || "No sentiment detected"}
          </p>
        </div>

        {/* Response Message */}
        <div className="border border-gray-300 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold">Response</h3>
          <p className="text-gray-700">{response_message || "No response message available"}</p>
        </div>
      </div>

      <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default ReportPage;

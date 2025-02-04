import { useState } from "react";
import axios from "axios";

function App() {
  const [image, setImage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1];

      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || "your-google-api-key";
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and extract multiple-choice questions (MCQs) exactly as they appear in the image. Maintain the original language and formatting.

                - If the image contains a stamp image before any question, replace it with "[image here]".
                - Ensure every question has at least one correct answer.
                - If reference text or explanation (solution) exists, include them.
                - Return ONLY raw JSON in this format:

                [
                  {
                    "questionText": "string",
                    "isExtraImageExist": "", // if image exists, replace with [image here]
                    "referenceText": "",
                    "solutionText": "",
                    "options": [
                      { "text": "string", "isCorrect": boolean }
                    ]
                  }
                ]

                Rules:
                1. Extract all MCQs, not just one.
                2. Preserve exact wording. Keep the original language (do not translate).
                3. Keep all relevant details (diagrams = [image] if needed).
                4. Return ONLY JSON, no explanations, no markdown or code blocks.
                5. Return empty string for referenceText and solutionText if not applicable.
                6. Reference text can be inside [](e.g.: [ঢা. বি. ২০২৪-২৫]). Also, solutionText can be inside ব্যাখ্যা/Solution/Solve or any similar part.
                7. Create EXACT clones of question(s). Do not change anything.
                8. Never select 2 answers as correct. If there are 2 correct answers, select the most correct one.`
              },
              {
                inlineData: {
                  mimeType: image.type,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      };

      try {
        const response = await axios.post(GEMINI_API_URL, payload, {
          headers: { "Content-Type": "application/json" },
        });

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          alert("No valid response from API");
          return;
        }

        let rawText = candidates[0]?.content?.parts[0]?.text || "";

        // Remove Markdown formatting if present
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
          const questionsArray = JSON.parse(rawText);
          setQuestions(questionsArray);
        } catch (jsonError) {
          console.error("JSON Parsing Error:", jsonError, "Response was:", rawText);
          alert("Failed to parse response. API might be returning an unexpected format.");
        }

      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image. Check API key and response format.");
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div>
      <h1>The Brain of Ayotto</h1>
      <p>The uniqueness of Ayotto AI that can reduce time, effort & cost</p>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Questions"}
      </button>
      {/* Displaying extracted questions */}
      {questions.length === 0 && <p>No questions found.</p>}
      {questions.length > 0 && (
        <div>
          <h2>Extracted Questions:</h2>
          {questions.map((q, index) => (
            <div key={index}>
              {q.questionText && <p>{q.questionText}</p>}
              {q.referenceText && <p>{q.referenceText}</p>}
              <ul>
                {q.options.map((option, idx) => (
                  <li key={idx} style={{ color: option.isCorrect ? "green" : "black" }}>
                    {option.text}
                  </li>
                ))}
              </ul>
              {q.solutionText && <p><strong>Solution:</strong> {q.solutionText}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
